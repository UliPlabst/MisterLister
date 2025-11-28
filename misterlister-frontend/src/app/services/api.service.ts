import { ErrorHandler, inject, Injectable } from "@angular/core";
import { ErrorCode, IApiError, ICheckList, ISaveListDTO } from "../types.api";
import { InfoService } from "./info.service";
import { API_HOST } from "src/global/environment";

@Injectable({
  providedIn: "root"
})
export class ApiService
{
  baseUri = `http://${API_HOST}/api/v1/`
  headers = {
    "Content-Type": "application/json",
    "X-User": null as string
  }
  errorHandler = inject(ErrorHandler);
  info = inject(InfoService);
  
  async saveList(list: ISaveListDTO, forceSave = false)
  {
    let uri = `list${forceSave ? "?forceSave=true" : ""}`;
    return await this.request(uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(list)
    })
  }
  
  async getList(id: string)
  {
    let res = await this.request(`list/${id}`);
    return res as ICheckList;
  }
  
  async deleteList(id: string)
  {
    return await this.request(`list/${id}`, {
      method: "DELETE"
    });
  }
  
  async request(uri: string, options?: RequestInit)
  {
    let res = await fetch(`${this.baseUri}${uri}`, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        ...this.headers
      },
      mode: "cors"
    });
    
    let json: any = null;
    try
    {
      json = await res.json();
    }
    catch(err)
    {
      
    }
    
    if(!res.ok)
    {
      if(json)
      {
        let apiError = toApiError(json);
        console.error("API Error:", apiError);
        this.info.showApiError(apiError);
      }
    }
    return null;
  }
}


export function isApiError(e: any): e is IApiError
{
  return e != null && typeof e.kind == "number";
}

export function isTimeoutError(err: any): err is { name: "TimeoutError", message: string }
{
  return err != null && typeof err == "object" && err.name == "TimeoutError";
}

export function toApiError(e: any): IApiError
{
  if(e == null)
    return null;
  if(isApiError(e))
    return e;
  return {
    code: ErrorCode.GenericError,
    message: e?.message
  };
}