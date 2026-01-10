import { firstValueFrom } from "rxjs";
import { DialogService } from "../services/dialog.service";
import { StorageService } from "../services/storage.service";
import { ICheckList } from "../types.api";
import { decrypt, importKey, encrypt, exportKey } from "../utils";
import { InputMasterKeyDialogComponent } from "../components/input-master-key-dialog/input-master-key-dialog.component";

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
)
{
  if(!list)
    return null;
  let id = list.key;
  let key = await context.storage.getKey(id);
  let keyChanged = false;
  while(true)
  {
    try
    {
      list = await decryptList(list, key);
      if(keyChanged)
        await this.storage.saveKey(id, key);
      break;
    }
    catch(err)
    {
      let dialog = await context.dialog.openDialog(InputMasterKeyDialogComponent, {});
      let res = await firstValueFrom(dialog.afterClosed()) as string;
      if(String.isNullOrEmpty(res))
        break;
      key = await importKey(res);
      keyChanged = true;
    }
  }
  return list;
}

export async function encryptList(list: ICheckList, key: CryptoKey)
{
  if(!list)
    return null;
  let listKeyStr = await decrypt(key, list.encryptedKey);
  let listKey    = await importKey(listKeyStr);
  
  let pName           = encrypt(listKey, list.name);
  let pDesc           = encrypt(listKey, list.description);
  let pCreatedBy      = encrypt(listKey, list.createdBy);
  let pLastModifiedBy = encrypt(listKey, list.lastModifiedBy);
  
  let pItems = list.items
    .map(item => [
      encrypt(listKey, item.name),
      encrypt(listKey, item.createdBy),
      encrypt(listKey, item.lastModifiedBy),
    ])
    .flat();
  
  let promises = [pName, pDesc, pCreatedBy, pLastModifiedBy, ...pItems];
  let results = await Promise.all(promises);
  
  let res = structuredClone(list);
  
  res.name           = results[0];
  res.description    = results[1];
  res.createdBy      = results[2];
  res.lastModifiedBy = results[3];
  
  for(let i = 0; i < list.items.length; i++)
  {
    res.items[i].name           = results[4 + i * 3];
    res.items[i].createdBy      = results[4 + i * 3 + 1];
    res.items[i].lastModifiedBy = results[4 + i * 3 + 2];
  }
  return res;
}

export async function decryptList(list: ICheckList, key: CryptoKey)
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
  
  let res = structuredClone(list);
  
  res.name           = results[0];
  res.description    = results[1];
  res.createdBy      = results[2];
  res.lastModifiedBy = results[3];
  
  for(let i = 0; i < list.items.length; i++)
  {
    res.items[i].name           = results[4 + i * 3];
    res.items[i].createdBy      = results[4 + i * 3 + 1];
    res.items[i].lastModifiedBy = results[4 + i * 3 + 2];
  }
  return res;
}