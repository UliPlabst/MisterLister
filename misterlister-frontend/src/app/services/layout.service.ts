import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IDisposable, LambdaDisposable } from "../utils";

type LayoutButton = {
  icon: string;
  invoke: (ev: MouseEvent) => any;
}

type LayoutConfig = {
  showFooter: boolean;
}

const defaultLayoutConfig: LayoutConfig = {
  showFooter: true
};

@Injectable({
  providedIn: "root"
})
export class LayoutService implements OnDestroy
{
  title$ = new BehaviorSubject<string>("");
  buttons$ = new BehaviorSubject<LayoutButton[]>([]);
  
  config: LayoutConfig = {
    showFooter: true
  };
  
  set(config: Partial<LayoutConfig>)
  {
    setTimeout(() => {
      this.config = {
        ...this.config,
        ...config
      };
    });
    return new LambdaDisposable(() => this.set(defaultLayoutConfig));
  }
  
  ngOnDestroy(): void
  {
    this.title$.complete();
    this.buttons$.complete();
  }
  
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
    this.setTitle("MisterLister")
  }
  
}