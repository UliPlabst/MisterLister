import "./date-extensions";
import { IServiceWorkerOptions } from "../global/db";
import { db } from "./constants";
import { ErrorCode, IApiError, ISaveListDTO } from "../../src/app/types.api";
import { API_HOST } from "../global/environment";

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

const isProd = process.env.NODE_ENV == "production";
const thresholdMinutes = 0;
const _self = self as any as ServiceWorkerGlobalScope;

_self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "sync-lists") {
    const ns = nextSync["sync-lists"];
    if(ns && new Date().getTime() < ns.getTime())
    {
      registerSync("sync-lists");
      return;
    }
    console.log("[sw]", "syncing")
    event.waitUntil(savePending());
  }
})

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

_self.addEventListener("fetch", (event) => {
  let request = event.request;
  
  let url = new URL(request.url);
  let fragments = url.pathname.split("/").filter(x => x.length > 0);
  if(url.host != API_HOST || fragments[0] != "api")
  {
    event.respondWith(fetch(event.request));
    return;
  }
  
  console.log(url);
  let headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });
  
  let version = fragments[1];
  let action = fragments[2];
  
  //TOOD: use version
  
  if(action == "list" && request.method == "GET")
  {
    let id = fragments[3];
    event.respondWith(handleGetList(id, request));
    return;
  }
  else if(action == "list" && request.method == "POST")
  {
    event.respondWith(handleSaveList(request));
    return;
  }
  else if(action == "list" && request.method == "DELETE")
  {
    let id = fragments[3];
    event.respondWith(handleDeleteList(id, request));
    return;
  }
  console.log(url.pathname);
  console.log("[ServiceWorker] Fetching:", event.request.url);
  event.respondWith(fetch(event.request));
    
    // if(fragments[1] != "v1")
    //   throw new Error("Invalid API version");
    
    // let handler = getHandler(fragments[1]);
    // let method = fragments[2];
    
    // let promise = handler[method](event.request, headers);
    // event.respondWith(promise);
});

_self.addEventListener("message", async (event) => {
  if(event.data.type == "UPDATE_SW_OPTS")
  {
    swOptions = await db.getSwOptions();
    console.log("Update opts", swOptions)
  }
});

async function savePending()
{
  let clients = await _self.clients.matchAll();
  let lists = await db.lists.filter(e => e.pending != null).toArray();
  let threshold = new Date().addMinutes(thresholdMinutes);
  for(let entry of lists.filter(e => e.pending < threshold))
  {
    let res = await saveList({ new: entry.new, old: entry.old, user: entry.user });
    if(res.ok)
    {
      let list = res.json();
      clients.forEach(e => e.postMessage({ type: "LIST_SYNC", list }));
    }
  }
}

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
    user: null,
    pending: null
  };
  await db.lists.put(entry, id);
  return createJsonResponse(entry.new ?? entry.old);
}

async function handleSaveList(request: Request): Promise<Response>
{
  let url = new URL(request.url);
  
  let clone = request.clone();
  let json = await clone.json() as ISaveListDTO;
  
  let entry = await db.lists.get(json.new.id);
  if(!entry) 
  {
    entry = {
      id: json.new.id,
      new: json.new,
      user: json.user,
      old: null,
      pending: new Date()
    };
    await db.lists.put(entry, entry.id);
  }
  else
  {
    entry.new = json.new;
    await db.lists.update(entry.id, { new: json.new, pending: new Date() });
  }
  
  if(url.searchParams.get("forceSave") != null && navigator.onLine)
  {
    return saveList(json);
  }
  else
  {
    await registerSync("sync-lists");
    return createJsonResponse(entry.new);
  }
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

async function saveList(dto: ISaveListDTO)
{
  try
  {
    let entry = await db.lists.get(dto.new.id);
    if(!entry) //should not happen
    {
      entry = {
        id: dto.new.id,
        new: dto.new,
        user: dto.user,
        old: dto.old,
        pending: new Date()
      };
      await db.lists.put(entry, entry.id);
    }
    dto.old = entry.old;
    
    let resultList = dto.new;
    if(navigator.onLine)
    {
      let r = await fetch(`http://${API_HOST}/api/v1/list/${dto.new.id}`, {
        body: JSON.stringify(dto),
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        mode: "cors"
      });
      if(r.status != 200)
        return r;
      resultList = await r.json();
      await db.lists.update(entry.id, { 
        old: resultList,
        new: resultList,
        pending: null
      });
    }
    else
    {
      await db.lists.update(entry.id, {
        new: dto.new,
        pending: null
      });
    }
    return createJsonResponse(resultList);
  }
  catch(err)
  {
    return createJsonResponse(dto.new);
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