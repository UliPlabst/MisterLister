import { ErrorHandler, inject, Injectable } from "@angular/core";
import { API_URI } from "src/global/environment";
import { DecryptedList, EncryptedList, isDecryptedList, MaybeDecryptedList } from "../types";
import { ErrorCode, IApiError, ICheckList, ISaveListDTO } from "../types.api";
import { decryptListWithDialog, encryptList } from "../utils/utils.list";
import { DialogService } from "./dialog.service";
import { InfoService } from "./info.service";
import { StorageService } from "./storage.service";

export type SaveDTO = DecryptedSaveDTO | EncryptedSaveDTO;
export type EncryptedSaveDTO = { new: EncryptedList; old: EncryptedList }
export type DecryptedSaveDTO = { new: DecryptedList; old: DecryptedList }

export function isDecryptedSaveDTO(dto: SaveDTO): dto is DecryptedSaveDTO
{
  if(dto.old == null && dto.new == null)
    throw new Error("Inconsistent DTO: both new and old lists cannot be null");
  if(dto.old != null && isDecryptedList(dto.old))
  {
    if(dto.new != null && !isDecryptedList(dto.new))
      throw new Error("Inconsistent DTO: both new and old lists must be either decrypted or encrypted");
    return true;
  }
  else if(dto.new != null && isDecryptedList(dto.new))
  {
    if(dto.old != null && !isDecryptedList(dto.old))
      throw new Error("Inconsistent DTO: both new and old lists must be either decrypted or encrypted");
    return true;
  }
  return false;
}

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
  
  private async prepareDto(dto: SaveDTO): Promise<ISaveListDTO>
  {
    if(isDecryptedSaveDTO(dto))
    {
      let key = await this.storage.getKeyOrThrow(dto.new?.key ?? dto.old?.key);
      return {
        new: await encryptList(dto.new, dto.old, key),
        old: await encryptList(dto.old, dto.old, key) //noop decryption
      };
    }
    else
    {
      if(isDecryptedList(dto.new) || isDecryptedList(dto.old))
        throw new Error("Inconsistent DTO: both new and old lists must be either decrypted or encrypted");
      return dto;
    }
  }
  
  async saveList(
    id: string, 
    dto: SaveDTO,
    forceSave = false, 
    keepalive = false
  )
  {
    let uri = `list/${id}${forceSave ? "?forceSave=true" : ""}`;
    let saveDto = await this.prepareDto(dto);
      
    let res = await this.request(uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(saveDto),
      keepalive: keepalive,
    }) as ICheckList;
    return await decryptListWithDialog(res, {
      storage: this.storage,
      dialog: this.dialog
    });
  }
  
  async getList(id: string): Promise<MaybeDecryptedList>
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
  
  async syncLists(dtos: Record<string, SaveDTO>)
  {
    let mappedDtos: Record<string, ISaveListDTO> = {};
    for(let key of Object.keys(dtos))
    {
      mappedDtos[key] = await this.prepareDto(dtos[key]);
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
