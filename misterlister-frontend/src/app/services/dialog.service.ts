import { Injectable, TemplateRef, Type } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { ConfirmDialogComponent, IConfirmationDialogData } from "../components/confirm-dialog/confirm-dialog.component";
import { ComponentType } from "@angular/cdk/overlay";

export interface IDialog<TData, TReturn = any>
{
  data: TData;
  dialogRef: MatDialogRef<any, TReturn>;
}

@Injectable({
  providedIn: "root"
})
export class DialogService
{
  constructor(
    public matDialog: MatDialog
  )
  {
    
  }
  
  async confirm(
    header: string,
    bodyParagraphs: string[],
    confirmButton: string = "Ok",
    cancelButton: string = "Cancel",
  )
  {
    let data: IConfirmationDialogData = {
      header: header,
      bodyParagraphs: bodyParagraphs,
      buttons: [
        {
          label: cancelButton,
          returnVal: false
        },
        {
          label: confirmButton,
          color: "primary",
          focus: true,
          returnVal: true
        },
      ]
    }
    let dialog = this.openDialog(ConfirmDialogComponent, data);
    let res = await dialog.afterClosed().toPromise();
    return res == true;
  }
  
  openDialog<TData, TRet>(
    component: Type<IDialog<TData, TRet>>, 
    data: TData,
    cfg: Omit<MatDialogConfig, "data"> = null
  ): MatDialogRef<IDialog<TData, TRet>, TRet>
  {
    return this.matDialog.open(component, {
      data,
      ...(cfg ?? {}),
      ...((component as any).defaultDialogArgs ?? {}),
    }) as MatDialogRef<any, TRet>;
  }
  
  
  open<T, D = any, R = any>(component: ComponentType<T>, config?: MatDialogConfig<D>): MatDialogRef<T, R>;
  open<T, D = any, R = any>(template: TemplateRef<T>, config?: MatDialogConfig<D>): MatDialogRef<T, R>;
  open<T, D = any, R = any>(template: ComponentType<T> | TemplateRef<T>, config?: MatDialogConfig<D>): MatDialogRef<T, R>;
  open(template: any, config: any)
  {
    return this.matDialog.open(template, config);
  }
}


