import { Injectable } from "@angular/core";
import Dexie, { Table } from 'dexie';
import { ICheckList } from "src/app/types.api";
import { MisterListerDb } from "src/global/db";

@Injectable({
  providedIn: "root"
})
export class StorageService
{
  db = new MisterListerDb();
  
  constructor()
  {
    
  }
  
  async getLists()
  {
    let entries = await this.db.lists.toArray();
    return entries.map(e => e.new ?? e.old);
  }

}

