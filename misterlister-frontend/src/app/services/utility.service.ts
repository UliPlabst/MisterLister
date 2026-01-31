import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import { DialogService } from "./dialog.service";
import { PickUserDialogComponent } from "../components/pick-user-dialog/pick-user-dialog.component";
import { Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { StorageService } from "./storage.service";
import { LayoutService } from "./layout.service";
import { DisposableCollection, LambdaDisposable } from "../utils";
import { SwService } from "./sw.service";
import { InfoService } from "./info.service";

@Injectable({
  providedIn: "root"
})
export class UtilityService
{
  user$ = new BehaviorSubject<string>(null);
  disp = new DisposableCollection();
  private _beforeUnloadHandler: (ev: BeforeUnloadEvent) => any = null;
  
  constructor(
    public api: ApiService,
    public dialog: DialogService,
    public router: Router,
    public storage: StorageService,
    public layout: LayoutService,
    public sw: SwService,
    public info: InfoService
  )
  {
    let d = this.user$
      .subscribe(e => {
        if(!String.isNullOrEmpty(e))
        {
          this.setCookie("user", e);
          this.api.headers["X-User"] = e;
        }
      });
      
    window.addEventListener("beforeunload", ev => {
      this._beforeUnloadHandler?.(ev);
    });
      
    let user = this.getCookies().user;
    this.user$.next(user);
    this.disp.push(d);
    (window as any).__util = this;
  }
  
  registerBeforeUnloadHandler(handler: (ev: BeforeUnloadEvent) => any)
  {
    if(this._beforeUnloadHandler != null)  
      throw new Error("Before unload handler already registered");
    this._beforeUnloadHandler = handler;
    return new LambdaDisposable(() => this._beforeUnloadHandler = null);
  }
  
  destroy()
  {
    this.disp.dispose();
  }

  newGuid()
  {
    return crypto.randomUUID();
  };

  async ensureUser()
  {
    let cookies = this.getCookies();
    if (!String.isNullOrWhitespace(cookies.user) && cookies.user == this.user$.value)
      return cookies.user;
    let d = this.dialog.open(PickUserDialogComponent);
    let res = await d.afterClosed().toPromise() as string;
    if (!res)
      return null;
    
    this.setUser(res);
    return res;
  }
  
  setUser(user: string)
  {
    this.user$.next(user);
  }

  setCookie(name: string, value: string)
  {
    let expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  }

  getCookies()
  {
    let cookies = document.cookie.split("; ");
    let cookieObj: { [key: string]: string } = {};
    for (let i = 0; i < cookies.length; i++)
    {
      let cookie = cookies[i].split("=");
      cookieObj[cookie[0]] = cookie[1];
    }
    return cookieObj;
  }
}
