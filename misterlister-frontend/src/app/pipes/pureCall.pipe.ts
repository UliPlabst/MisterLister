import { Pipe, PipeTransform } from "@angular/core";

type Rest<T> = T extends [arg: any, ...res: infer U] ? U : never;

@Pipe({
  name: 'pureCall',
  pure: true
})
export class PureCallPipe implements PipeTransform, PipeTransform
{
  val: any;
  transform<T, TFn extends (val: T, ...params: any[]) => any>(value: T, fn: TFn, ...params: Rest<Parameters<TFn>>) : ReturnType<TFn>
  {
    if(this.val && typeof this.val.dispose == "function")
      this.val.dispose();

    this.val = fn(value, ...params);
    return this.val;
  }
}
