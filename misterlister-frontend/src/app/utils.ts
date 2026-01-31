import { HttpResponse } from "@angular/common/http";

export interface IDisposable
{
  dispose(): void
  addTo(disp: IDisposableCollection): this
  [Symbol.dispose](): void;
}

export function isDisposable(obj: any): obj is IDisposable
{
  return obj != null && typeof obj.dispose == "function";
}

export function assertNever(never: never): never
{
  throw new Error("Should never happen");
}

export function str2Int(str: string): number
{
  let num = Number.parseInt(str);
  if (Number.isNaN(num))
    return null;
  return num;
}

export abstract class Disposable implements IDisposable
{
  abstract dispose(): void;
  addTo(disp: IDisposableCollection): this
  {
    disp.push(this);
    return this;
  }
  
  [Symbol.dispose]() { this.dispose(); }
}

export class DisposableCollection extends Disposable implements IDisposableCollection
{
  private _disposables: IDisposable[] = [];

  dispose()
  {
    for(let d of this._disposables)
    {
      d?.dispose();
    }
    this._disposables = [];
  }

  push(disp: IDisposable)
  {
    this._disposables.push(disp);
  }
}

type Constructor<T = any> = abstract new (...args: any[]) => T;

export interface IDisposableCollection extends IDisposable
{
  push(d: IDisposable): void;
}

export function DisposableMixin<TBase extends Constructor>(base: TBase)
{
  abstract class mixin extends base implements IDisposable
  {
    abstract dispose(): void;
    addTo(disp: IDisposableCollection): this
    {
      disp.push(this);
      return this;
    }
    
    [Symbol.dispose]()
  {
    this.dispose();
  }
  }
  return mixin;
}

export class LambdaDisposable<T = void> extends Disposable implements IDisposable
{
  constructor(
    protected _fn: () => T
  )
  {
    super();
  }

  dispose()
  {
    if(this._fn)
      this._fn();
    this._fn = null;
  }
}

export function sleep(ms: number)
{
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

const CYPHER = "AES-GCM";
const LENGTH = 256;

export async function createKey(): Promise<CryptoKey>
{
  return await crypto.subtle.generateKey(
    { name: CYPHER, length: LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKey(key: CryptoKey): Promise<string>
{
  const buffer = await crypto.subtle.exportKey("raw", key);
  //encode as base64
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export async function importKey(base64: string)
{
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "raw",
    buffer,
    { name: CYPHER, length: LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

const ENCRYPTION_ENABLED = true;

export async function decrypt(key: CryptoKey, base64: string)
{
  if(!ENCRYPTION_ENABLED)
    return base64;
  
  try
  {
    if(String.isNullOrEmpty(base64))
      return null;
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const text = await crypto.subtle.decrypt(
      { name: CYPHER, iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(text);
  }
  catch(err)
  {
    throw new DecryptionError(err);
  }
}


export async function encrypt(key: CryptoKey, message: string)
{
  if(!ENCRYPTION_ENABLED)
    return message;
  if(String.isNullOrEmpty(message))
    return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: CYPHER, iv },
    key,
    new TextEncoder().encode(message)
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export class DecryptionError extends Error
{
  constructor(public innerError: any)
  {
    super();
  }
}

const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-\.]+)(?:; ?|$)/i;
const asciiFilenameRegex = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i;
export function getFileNameFromContentDispositionHeader(disposition: string)
{
  let fileName: string = null;
  if (utf8FilenameRegex.test(disposition))
  {
    fileName = decodeURIComponent(utf8FilenameRegex.exec(disposition)[1]);
  }
  else
  {
    // prevent ReDos attacks by anchoring the ascii regex to string start and
    //  slicing off everything before 'filename='
    const filenameStart = disposition.toLowerCase().indexOf('filename=');
    if (filenameStart >= 0)
    {
      const partialDisposition = disposition.slice(filenameStart);
      const matches = asciiFilenameRegex.exec(partialDisposition);
      if (matches != null && matches[2]) {
        fileName = matches[2];
      }
    }
  }
  return fileName;
}

export async function download(fileName: string, blob: Blob, contentType: string): Promise<void>
export async function download(fileName: string, content: string, contentType: string): Promise<void>
export async function download(blobResponse: HttpResponse<Blob>): Promise<void>
export async function download(fileNameOrResponse: string | HttpResponse<Blob>, content?: string|Blob, contentType?: string): Promise<void>
{
  let fileName: string;
  let c: string;
  if(typeof(fileNameOrResponse) == "string")
  {
    fileName = fileNameOrResponse;
    c = typeof content == "string"
      ? `data:${contentType};charset=utf-8, ${encodeURIComponent(content)}`
      : URL.createObjectURL(content);
  }
  else
  {
    fileName = getFileNameFromContentDispositionHeader(fileNameOrResponse.headers.get("content-disposition"));
    contentType = fileNameOrResponse.headers.get("content-type");
    c = URL.createObjectURL(fileNameOrResponse.body);
  }

  let element = document.createElement('a');
  element.setAttribute('href', c);
  element.setAttribute('download', fileName);
  document.body.appendChild(element);
  element.click();
  element.remove();
}
