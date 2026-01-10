import "./date-extensions";
import { IServiceWorkerOptions, ListEntry } from "../global/db";
import { db } from "./constants";
import { ErrorCode, IApiError, ICheckList, ISaveListDTO } from "../../src/app/types.api";
import { API_URI } from "../global/environment";
import { SwRouter } from "./sw-router";

declare const __PRECACHE_ASSETS__: string[];

let nextSync: Record<string, Date> = {}

declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register(tag: string): Promise<void>;
    }
  }
  interface SyncEvent extends Event
  {
    waitUntil(promise: Promise<any>): void;
    tag: string;
  }
}

let swOptions: IServiceWorkerOptions = {
  autoSaveEnabled: false
};

db.getSwOptions().then(e => {
  if(e)
    swOptions = e
});

const mode = "cors";
const isProd = process.env.NODE_ENV == "production";
const thresholdMinutes = 0;
const _self = self as any as ServiceWorkerGlobalScope;

// _self.addEventListener("sync", (event: SyncEvent) => {
//   if (event.tag === "sync-lists") {
//     const ns = nextSync["sync-lists"];
//     if(ns && new Date().getTime() < ns.getTime())
//     {
//       registerSync("sync-lists");
//       return;
//     }
//     console.log("[sw]", "syncing")
//     event.waitUntil(savePending());
//   }
// })

_self.addEventListener("install", (event) => {
  console.log("[sw] Installed");
  
  if(isProd) 
  {
    event.waitUntil(
      caches.open("v1").then((cache) => {
        return cache.addAll(__PRECACHE_ASSETS__);
      }
    ));
  }
  _self.skipWaiting(); // Optional: activate immediately
});

_self.addEventListener("activate", (event) => {
  console.log("[sw] Activated");
  return _self.clients.claim(); // Take control of uncontrolled clients
});

const swRouter = new SwRouter()
  .on({
    route: "/api/v1/list/:id",
    opts: { method: "GET" },
    fn: (event, params) =>  handleGetList(params.get("id"), event.request)
  })
  .on({
    route: "/api/v1/list/:id",
    opts: { method: "POST" },
    fn: (event, params) => handleSaveList(params.get("id"), event.request)
  })
  .on({
    route: "/api/v1/list/:id",
    opts: { method: "DELETE" },
    fn: (event, params) => handleDeleteList(params.get("id"), event.request)
  })
  .on({
    route: "/api/v1/lists",
    opts: { method: "POST" },
    fn: (event, params) => handleSyncLists(event.request)
  });

_self.addEventListener("fetch", (event) => {
  if(swRouter.handle(event))
    return;
  console.log(event.request.url);
  console.log("[ServiceWorker] Fetching:", event.request.url);
  event.respondWith(fallback());
  
  async function fallback()
  {
    let cache = await caches.open("v1");
    let res = await cache.match(event.request);
    if(res == null)
      res = await fetch(event.request);
    return res;
  }
});

_self.addEventListener("message", async (event) => {
  if(event.data.type == "UPDATE_SW_OPTS")
  {
    swOptions = await db.getSwOptions();
    console.log("Update opts", swOptions)
  }
});

// async function savePending()
// {
//   let clients = await _self.clients.matchAll();
//   let lists = await db.lists.filter(e => e.pending != null).toArray();
//   let threshold = new Date().addMinutes(thresholdMinutes);
//   for(let entry of lists.filter(e => e.pending < threshold))
//   {
//     let res = await saveList({ new: entry.new, old: entry.old, user: entry.user });
//     if(res.ok)
//     {
//       let list = res.json();
//       clients.forEach(e => e.postMessage({ type: "LIST_SYNC", list }));
//     }
//   }
// }

async function registerSync(name: string)
{
  let registration = await _self.registration;
  nextSync[name] = new Date().addMinutes(thresholdMinutes);
  registration.sync.register(name);
}

async function handleGetList(id: string, request: Request): Promise<Response>
{
  let url = new URL(request.url);
  if(!id)
  {
    let error: IApiError = {
      code: ErrorCode.BadRequest,
      message: "Missing id query"
    };
    return createJsonResponse(error, 400)
  }  
  
  let entry = await db.lists.get(id);
  if(entry)
    return createJsonResponse(entry.new ?? entry.old);
  
  let r = await fetch(request);
  if(r.status != 200)
    return r;
  let list = await r.json();
  entry = {
    id,
    new: list,
    old: list,
    pending: null
  };
  await db.lists.put(entry, id);
  return createJsonResponse(entry.new ?? entry.old);
}

async function updateListEntry(id: string, newList: ICheckList): Promise<ListEntry>
{
  let entry = await db.lists.get(id);
  if(!entry) 
  {
    entry = {
      id,
      new: newList,
      old: null,
      pending: new Date()
    };
    await db.lists.put(entry, entry.id);
  }
  else
  {
    if(!newList)
      return entry;
    entry.new = newList;
    await db.lists.update(id, { new: newList, pending: new Date() });
  }
  return entry;
}


async function handleSaveList(id: string, request: Request): Promise<Response>
{
  let url = new URL(request.url);
  
  let clone = request.clone();
  let dto = await clone.json() as ISaveListDTO;
  
  let entry = await updateListEntry(id, dto.new);
  let resultList = dto.new;
  if(url.searchParams.get("forceSave") != null && navigator.onLine)
  {
    dto = {
      ...dto,
      old: entry.old
    };
    let r = await fetch(`${API_URI}/api/v1/list/${id}`, {
      body: JSON.stringify(dto),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      mode
    });
    if(r.ok)
    {
      resultList = await r.json();
      await db.lists.update(entry.id, { 
        old: resultList,
        new: resultList,
        pending: null
      });
      
    }
  }
  return createJsonResponse(resultList);
}

async function handleDeleteList(id: string, request: Request): Promise<Response>
{
  if(!navigator.onLine)
    return createErrorResonse(ErrorCode.Offline, "Cannot delete list while offline", 503);
  let res = await fetch(request);
  if(res.ok)
  {
    let entry = await db.lists.get(id);
    if(entry)
      await db.lists.delete(id);
  }
  return res;
}

async function handleSyncLists(request: Request): Promise<Response>
{
  let clone = request.clone();
  let dtos = await clone.json() as Record<string, ISaveListDTO>;
  let entries: ListEntry[] = [];
  for(let id of Object.keys(dtos))
  {
    let dto = dtos[id];
    let entry = await updateListEntry(id, dto.new);
    entries.push(entry);
  }
  
  if(navigator.onLine)
  {
    let r = await fetch(`${API_URI}/api/v1/lists/sync`, {
      body: JSON.stringify(dtos),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      mode
    });
    return r;    
  }
  else
  {
    let r: Record<string, ICheckList> = {};
    for(let e of entries)
    {
      r[e.id] = e.new;
    }
    return createJsonResponse(r);
  }
}

function createJsonResponse(data: any, status = 200)
{
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" }});
}

function createErrorResonse(code: ErrorCode, message: string, status = 400)
{
  let error: IApiError = {
    code,
    message
  };
  return createJsonResponse(error, status);
}