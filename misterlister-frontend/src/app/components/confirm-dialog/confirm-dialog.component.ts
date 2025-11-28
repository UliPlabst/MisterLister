import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { IDialog } from 'src/app/services/dialog.service';

export interface IConfirmationDialogData
{
  header: string;
  bodyParagraphs: string[];
  buttons: IConfirmDialogButton[]
}

export interface IConfirmDialogButton
{
  label: string;
  color?: string;
  returnVal?: any;
  focus?: boolean;
  invoke?: () => Promise<any> | any
}


@Component({
  selector: 'app-confirm-dialog',
  imports: [
    MaterialModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.sass',
})
export class ConfirmDialogComponent implements IDialog<IConfirmationDialogData>
{ 
  busy = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: IConfirmationDialogData,
    public dialogRef: MatDialogRef<any>
  )
  {
    
  }
  
  async onButtonClicked(b: IConfirmDialogButton)
  {
    try
    {
      this.busy = true;
      let res = b.returnVal;
      if(typeof b.invoke == "function")
      {
        res = b.invoke();
        if(res instanceof Promise)
          res = await res;
      }
      this.dialogRef.close(res);
    }
    finally
    {
      this.busy = false;
    }
  }
}
