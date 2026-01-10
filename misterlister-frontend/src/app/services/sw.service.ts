import { inject, Injectable, OnDestroy } from "@angular/core";
import { StorageService } from "./storage.service";
import { IServiceWorkerOptions } from "src/global/db";
import { BehaviorSubject, fromEvent, skip } from "rxjs";
import { Disposable, DisposableCollection } from "../utils";
import { EventBus } from "../misc/EventBus";
import { ICheckList } from "../types.api";
import { InfoService } from "./info.service";

type SwEventMap = {
  listUpdate: {
    list: ICheckList;
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
      .subscribe((e: MessageEvent) => {
        if(e.data?.type == "LIST_SYNC")
        {
          this.bus.emit("listUpdate", { list: e.data.list });
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