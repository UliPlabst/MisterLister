export interface ICheckList {
  key: string;
  name: string;
  description: string;
  items: IListItem[];
  createdBy: string;
  created: string;
  lastModified: string;
  lastModifiedBy: string;
  deleted: string;
  deletedBy: string;
  encryptedKey: string;
}

export interface IListItem {
  key: string;
  name: string;
  state: ItemState;
  completedAt: string;
  completedBy: string;
  lastModified: string;
  lastModifiedBy: string;
  createdAt: string;
  createdBy: string;
  deletedAt: string;
  deletedBy: string;
  __isNew?: boolean;
}

export enum ItemState
{
  Idle,
  Completed,
  Deleted
}

export interface IApiError
{
  code: ErrorCode;
  message: string;
}

export enum ErrorCode
{
  NotFound,
  NoUser,
  BadRequest,
  GenericNotAllowed,
  Offline,
  GenericError,
  ServerError = 500
}

export interface ISaveListDTO
{
  new: ICheckList;
  old?: ICheckList;
}