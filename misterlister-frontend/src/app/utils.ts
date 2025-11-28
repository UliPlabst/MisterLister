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