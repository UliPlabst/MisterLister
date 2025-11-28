import { filter, map, Observable, Subject } from "rxjs";
import { Disposable } from "../utils"

type EventMap = Record<string, any>;
type Envelope<T = any> = { event: string, data: T };
export class EventBus<T extends EventMap> extends Disposable
{
  private _subject = new Subject<Envelope>();
  constructor()
  {
    super();
  }  
  
  override dispose(): void
  {
    this._subject.complete();
  }
  
  emit<K extends keyof T & string>(event: K, data: T[K])
  {
    this._subject.next({ event, data });
  }
  
  get<K extends keyof T & string>(event: K): Observable<T[K]>
  {
    return this._subject.pipe(filter(e => e.event == event), map(e => e.data));
  }
}