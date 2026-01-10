import { ErrorHandler, inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { API_URI } from "src/global/environment";
import { InputMasterKeyDialogComponent } from "../components/input-master-key-dialog/input-master-key-dialog.component";
import { ErrorCode, IApiError, ICheckList, ISaveListDTO } from "../types.api";
import { importKey } from "../utils";
import { decryptList, decryptListWithDialog, encryptList } from "../utils/utils.list";
import { DialogService } from "./dialog.service";
import { InfoService } from "./info.service";
import { StorageService } from "./storage.service";

@Injectable({
  providedIn: "root"
})
export class ApiService
{
  baseUri = `${API_URI}/api/v1/`
  headers = {
    "Content-Type": "application/json",
    "X-User": null as string
  }
  
  errorHandler = inject(ErrorHandler);
  info         = inject(InfoService);
  storage      = inject(StorageService);
  dialog       = inject(DialogService);
  
  readonly mode = "cors";
  
  async saveList(id: string, list: ISaveListDTO, forceSave = false, keepalive = false)
  {
    let uri = `list/${id}${forceSave ? "?forceSave=true" : ""}`;
    let key = await this.storage.getKey(id);
    list.new = list.new == null 
      ? null 
      : await encryptList(list.new, key);
      
    let res = await this.request(uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(list),
      keepalive: keepalive,
    }) as ICheckList;
    return await decryptListWithDialog(res, {
      storage: this.storage,
      dialog: this.dialog
    });
  }
  
  async getList(id: string)
  {
    let res = await this.request(`list/${id}`, {
      method: "GET"
    }) as ICheckList;
    return await decryptListWithDialog(res, {
      storage: this.storage,
      dialog: this.dialog
    });
  }
  
  async deleteList(id: string)
  {
    return await this.request(`list/${id}`, {
      method: "DELETE"
    });
  }
  
  async syncLists(dtos: Record<string, ISaveListDTO>)
  {
    for(let key of Object.keys(dtos))
    {
      let dto = dtos[key];
      let listKey = await this.storage.getKey(key);
      dto.new = dto.new == null 
        ? null 
        : await encryptList(dto.new, listKey);
    }
    return await this.request(`lists/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dtos)
    });
  }
  
  async request(uri: string, options?: RequestInit)
  {
    let json: any = null;
    let res: Response = null;
    let error: Error = null;
    try
    {
      res = await fetch(`${this.baseUri}${uri}`, {
        ...options,
        headers: {
          ...(options?.headers ?? {}),
          ...this.headers
        },
        mode: "cors"
      });
      json = await res.json();
    }
    catch(err)
    {
      error = err;
    }
    
    if(!res || !res.ok)
    {
      if(json)
      {
        let apiError = toApiError(json);
        console.error("API Error:", apiError);
        this.info.showApiError(apiError);
      }
      return null;
    }
    else if(error)
    {
      this.errorHandler.handleError(error);
    }
    return json;
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
