import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
 name: 'ifNull',
 pure: true,
 standalone: true
})
export class IfNullPipe implements PipeTransform 
{
  transform<T>(value: T, replaceWith: any): T {
    return !value ? replaceWith : value;
  }
}