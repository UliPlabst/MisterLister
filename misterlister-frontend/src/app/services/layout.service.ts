import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IDisposable, LambdaDisposable } from "../utils";

type LayoutButton = {
  icon: string;
  invoke: (ev: MouseEvent) => any;
}

@Injectable({
  providedIn: "root"
})
export class LayoutService {
  title$ = new BehaviorSubject<string>("");
  buttons$ = new BehaviorSubject<LayoutButton[]>([])
  
  setButtons(buttons: LayoutButton[]): IDisposable
  {
    setTimeout(() => {
      this.buttons$.next(buttons);
    }, 0);
    return new LambdaDisposable(() => this.setButtons([]));
  }
  
  setTitle(title: string)
  {
    setTimeout(() => {
      this.title$.next(title);
    }, 0);
    document.title = title;
    return new LambdaDisposable(() => this.resetTitle());
  }
  
  resetTitle()
  {
    this.setTitle("Misterlister")
  }
  
}