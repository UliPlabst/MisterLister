import { ICheckList, IListItem } from "./types.api";

export interface DecryptedList extends ICheckList
{
  encryptedName?: string;
  encryptedDescription?: string;
  encryptedCreatedBy?: string;
  encryptedLastModifiedBy?: string;
  encryptedDeletedBy?: string;
  isEncrypted: false;
  items: DecryptedListItem[];
}

export interface DecryptedListItem extends IListItem
{
  encryptedName?: string;
  encryptedCreatedBy?: string;
  encryptedLastModifiedBy?: string;
  encryptedCompletedBy?: string;
  encryptedDeletedBy?: string;
}

export interface EncryptedList extends ICheckList
{
  isEncrypted: true;
}

export type MaybeDecryptedList = DecryptedList | EncryptedList;

export function isDecryptedList(list: MaybeDecryptedList): list is DecryptedList
{
  return list != null && (list as DecryptedList).isEncrypted === false;
}
