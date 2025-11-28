import Dexie, { Table } from "dexie";
import { ICheckList } from "../app/types.api";

export type IServiceWorkerOptions = {
  autoSaveEnabled: boolean;
}

export type ListEntry = {
  new: ICheckList;
  old: ICheckList;
  id: string;
  pending: Date;
  user: string;
}

export class MisterListerDb extends Dexie
{
  lists: Table<ListEntry, string>;
  keyValues: Table<{ key: string, value: any }, string>;
  constructor()
  {
    super("MisterListerDB");
    this.version(1)
      .stores({
        lists: "++id, value",
        keyValues: "key, value"
      });
    this.lists = this.table("lists");
    this.keyValues = this.table("keyValues");
  }
  
  setSwOptions(options: IServiceWorkerOptions)
  {
    return this.keyValues.put({ key: "swOptions", value: options });
  }
  
  getSwOptions(): Promise<IServiceWorkerOptions>
  {
    return this.keyValues.get("swOptions").then((v) => {
      if(!v)
        return { autoSaveEnabled: true };
      return v.value;
    });
  }
}