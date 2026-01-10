import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { IApiError } from "../types.api";

export type MessageSeverity = "info" | "warning" | "error" | "success"|"busy";

export type InfoMessage = {
  severity: MessageSeverity;
  message: string;
  details?: string;
  timeout?: number;
};

@Injectable({
  providedIn: "root"
})
export class InfoService
{
  private _messages$ = new BehaviorSubject<InfoMessage[]>([]);
  public messages$ = this._messages$.asObservable();
  
  showApiError(e: IApiError)
  {
    return this.addMessage({
      severity: "error",
      message: "Oops, an error occurred",
      details: e.message, 
    });
  }
  
  removeMessage(message: InfoMessage)
  {
    this._messages$.next(
      this._messages$.value.filter(m => m !== message)
    );
  }
  
  addMessage(message: InfoMessage)
  {
    this._messages$.next([
      ...this._messages$.value,
      message
    ]);
    if(message.timeout && message.timeout > 0)
    {
      setTimeout(() => {
        this.removeMessage(message);
      }, message.timeout);
    }
  }
  
  showMessage(
    severity: MessageSeverity,
    message: string,
    details: string = null,
    timeout: number = null
  )
  {
    this.addMessage({
      severity,
      message,
      details,
      timeout
    });
  }
}