import { ICheckList } from "src/app/types.api";


export function updateSortNumbers(list: ICheckList)
{
  let i = 0;
  for(let item of list.items)
  {
    item.sortNumber = i++;
  }
}