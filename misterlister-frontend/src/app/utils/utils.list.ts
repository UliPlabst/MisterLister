import { firstValueFrom } from "rxjs";
import { InputMasterKeyDialogComponent } from "../components/input-master-key-dialog/input-master-key-dialog.component";
import { DialogService } from "../services/dialog.service";
import { StorageService } from "../services/storage.service";
import { DecryptedList, DecryptedListItem, EncryptedList } from "../types";
import { ICheckList, IListItem } from "../types.api";
import { decrypt, encrypt, exportKey, importKey } from "../utils";

export async function createShareUrl(list: ICheckList, context: {
  storage: StorageService
})
{
  let key = await context.storage.getKey(list.key);
  let exp = await exportKey(key);
  return `${location.origin}/list/${list.key}#key=${exp}`
}

export async function decryptListWithDialog(
  list: ICheckList,
  context: {
    storage: StorageService,
    dialog: DialogService
  }
): Promise<DecryptedList>
{
  if(!list)
    return null;
  let id = list.key;
  let keyChanged = false;
  let key = await context.storage.getKey(id);
  if(key == null)
  {
    key = await promptForKey(context);
    keyChanged = true;
  }
  
  if(key == null)
    return null;
    
  while(true)
  {
    try
    {
      let decrypted = await decryptList(list, key);
      if(keyChanged)
        await context.storage.saveKey(id, key);
      return decrypted;
    }
    catch(err)
    {
      console.error(err, 'Failed to decrypt list');
      key = await promptForKey(context);
      keyChanged = true;
      if(key == null)
        return null;
    }
  }
}

async function promptForKey(context: { dialog: DialogService }): Promise<CryptoKey>
{
  let dialog = await context.dialog.openDialog(InputMasterKeyDialogComponent, {});
  let res = await firstValueFrom(dialog.afterClosed()) as string;
  res = res?.trim();
  if(String.isNullOrEmpty(res))
    return null;
  let key = await importKey(res);
  return key;
}

export async function encryptList(list: DecryptedList, old: DecryptedList, key: CryptoKey): Promise<EncryptedList>
{
  if(!list)
    return null;
  let listKeyStr = await decrypt(key, list.encryptedKey);
  let listKey    = await importKey(listKeyStr);
  
  let listPromise = allObj({
    name: list.name !== old?.name 
      ? encrypt(listKey, list.name) 
      : Promise.resolve(old?.encryptedName),
    description: list.description !== old?.description 
      ? encrypt(listKey, list.description) 
      : Promise.resolve(old?.encryptedDescription),
    createdBy: list.createdBy !== old?.createdBy 
      ? encrypt(listKey, list.createdBy) 
      : Promise.resolve(old?.encryptedCreatedBy),
    lastModifiedBy: list.lastModifiedBy !== old?.lastModifiedBy 
      ? encrypt(listKey, list.lastModifiedBy) 
      : Promise.resolve(old?.encryptedLastModifiedBy),
    deletedBy: list.deletedBy !== old?.deletedBy 
      ? encrypt(listKey, list.deletedBy) 
      : Promise.resolve(old?.encryptedDeletedBy),
  });
  
  let itemPromises = list.items.map(async (item) => {
    let oldItem = old?.items?.find(e => e.key == item.key);
    return await ecryptListItem(item, oldItem, listKey);
  });
  
  let { listData, items } = await allObj({
    listData: listPromise,
    items: Promise.all(itemPromises)
  });
  
  let res: EncryptedList = {
    key: list.key,
    name: listData.name,
    description: listData.description,
    items: items,
    createdBy: listData.createdBy,
    created: list.created,
    lastModified: list.lastModified,
    lastModifiedBy: listData.lastModifiedBy,
    deleted: list.deleted,
    deletedBy: listData.deletedBy,
    encryptedKey: list.encryptedKey,
    isEncrypted: true,
  };
  return res;
}


async function ecryptListItem(
  item: DecryptedListItem,
  oldItem: DecryptedListItem,
  key: CryptoKey
): Promise<IListItem>
{
  let partial = await allObj({
    name: item.name !== oldItem?.name 
      ? encrypt(key, item.name) 
      : Promise.resolve(oldItem?.encryptedName),
    createdBy: item.createdBy !== oldItem?.createdBy ? encrypt(key, item.createdBy) : Promise.resolve(oldItem?.encryptedCreatedBy),
    lastModifiedBy: item.lastModifiedBy !== oldItem?.lastModifiedBy 
      ? encrypt(key, item.lastModifiedBy) 
      : Promise.resolve(oldItem?.encryptedLastModifiedBy),
    completedBy: item.completedBy !== oldItem?.completedBy 
      ? encrypt(key, item.completedBy) 
      : Promise.resolve(oldItem?.encryptedCompletedBy),
    deletedBy: item.deletedBy !== oldItem?.deletedBy 
      ? encrypt(key, item.deletedBy) 
      : Promise.resolve(oldItem?.encryptedDeletedBy),
  });
  
  let res: IListItem = {
    key: item.key,
    name: partial.name,
    state: item.state,
    completedAt: item.completedAt,
    completedBy: partial.completedBy,
    lastModified: item.lastModified,
    lastModifiedBy: partial.lastModifiedBy,
    createdAt: item.createdAt,
    createdBy: partial.createdBy,
    deletedAt: item.deletedAt,
    deletedBy: partial.deletedBy,
  }
  return res;
}

async function allObj<T extends Record<string, Promise<any>>>(promises: T): Promise<{ [prop in keyof T]: Awaited<T[prop]> }>
{
  let keys = Object.keys(promises) as (keyof T)[];
  let results = await Promise.all(Object.values(promises));
  return Object.fromEntries(keys.map((k,i) => [k, results[i]])) as any;
}

export async function decryptList(list: ICheckList, key: CryptoKey): Promise<DecryptedList>
{
  if(!list)
    return null;
  let listKeyStr = await decrypt(key, list.encryptedKey);
  let listKey    = await importKey(listKeyStr);
  
  let pName           = decrypt(listKey, list.name);
  let pDesc           = decrypt(listKey, list.description);
  let pCreatedBy      = decrypt(listKey, list.createdBy);
  let pLastModifiedBy = decrypt(listKey, list.lastModifiedBy);
  
  let pItems = list.items
    .map(item => [
      decrypt(listKey, item.name),
      decrypt(listKey, item.createdBy),
      decrypt(listKey, item.lastModifiedBy),
    ])
    .flat();
  
  let promises = [pName, pDesc, pCreatedBy, pLastModifiedBy, ...pItems];
  let results = await Promise.all(promises);
  
  let decrypted: DecryptedList = {
    ...list,
    encryptedName: list.name,
    name: results[0],
    encryptedDescription: list.description,
    description: results[1],
    encryptedCreatedBy: list.createdBy,
    createdBy: results[2],
    encryptedLastModifiedBy: list.lastModifiedBy,
    lastModifiedBy: results[3],
    items: list.items.map((item,i) => ({
      ...item,
      encryptedName: item.name,
      name: results[4 + i * 3],
      encryptedCreatedBy: item.createdBy,
      createdBy: results[4 + i * 3 + 1],
      encryptedLastModifiedBy: item.lastModifiedBy,
      lastModifiedBy: results[4 + i * 3 + 2],
    })),
    isEncrypted: false
  };
  return decrypted;
}