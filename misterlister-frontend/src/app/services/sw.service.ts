import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, fromEvent, skip } from "rxjs";
import { IServiceWorkerOptions } from "src/global/db";
import { EventBus } from "../misc/EventBus";
import { DecryptedList } from "../types";
import { ICheckList } from "../types.api";
import { Disposable, DisposableCollection } from "../utils";
import { decryptList } from "../utils/utils.list";
import { InfoService } from "./info.service";
import { StorageService } from "./storage.service";

type SwEventMap = {
  listUpdate: {
    list: DecryptedList;
  }
}

@Injectable({
  providedIn: "root"
})
export class SwService extends Disposable
{
  enabled = false;
  private _swOptions$ = new BehaviorSubject<IServiceWorkerOptions>(null);
  swOptions$ = this._swOptions$.asObservable().pipe(skip(1));
  private _disp = new DisposableCollection();
  
  bus = new EventBus<SwEventMap>();
  private _ready$ = new BehaviorSubject<boolean>(false);
  public ready$ = this._ready$.asObservable();
  private info = inject(InfoService);
  
  constructor(
    public storage: StorageService
  )
  {
    super();
    this.init();
  }
  
  dispose()
  {
    this._disp.dispose();
  }
  
  async init()
  {
    if ("serviceWorker" in navigator) 
    {
      let reg = await navigator.serviceWorker.register("service-worker.js");
      this._ready$.next(true);
      console.log("Custom SW registered");
    }
    else
    {
      console.warn("Service worker not supported in this browser");
      this.info.showMessage("warning", "Service worker not supported in this browser. Offline functionality will be disabled.");
      this._ready$.next(false);
    }
    this._ready$.complete();
    
    fromEvent(navigator.serviceWorker, "message")
      .subscribe(async (e: MessageEvent) => {
        if(e.data?.type == "LIST_SYNC")
        {
          let list = e.data.list as ICheckList;
          if(!list)
            return;
          let key = await this.storage.getKey(list.key);
          if(!key)
            return;
          let decrypted = await decryptList(list, key);
          this.bus.emit("listUpdate", { list: decrypted });
        }
      })
      .addTo(this._disp);
  }
  
  async updateOptions(options: Partial<IServiceWorkerOptions>)
  {
    let opts = {
      ...this._swOptions$.value,
      ...options
    }
    await this.storage.db.setSwOptions(opts);
    if ("serviceWorker" in navigator) 
    {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.active?.postMessage({ type: "UPDATE_SW_OPTS" });
        }
      });
    }
  }
  
  
  
}