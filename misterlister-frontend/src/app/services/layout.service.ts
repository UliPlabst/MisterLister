import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { LambdaDisposable } from "../utils";

@Injectable({
  providedIn: "root"
})
export class LayoutService {
  title$ = new BehaviorSubject<string>("");
  
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