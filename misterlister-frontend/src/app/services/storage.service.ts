import { Injectable } from "@angular/core";
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
  
  async getKey(id: string): Promise<CryptoKey>
  {
    let record = await this.db.keys.get(id);
    if(!record)
      throw new Error("No encryption key found for list.");
    return record?.key;
  }
  
  async saveKey(id: string, key: CryptoKey)
  {
    return this.db.keys.put({ id, key });
  }
  
  async setKeyValue(key: string, value: any)
  {
    await this.db.keyValues.put({ key, value });
  }
  
  async getKeyValue<T = any>(key: string): Promise<T>
  {
    let kv = await this.db.keyValues.get(key);
    return kv?.value;
  }

}

