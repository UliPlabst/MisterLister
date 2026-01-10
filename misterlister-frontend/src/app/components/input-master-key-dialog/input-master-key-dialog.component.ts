import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { IDialog } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-input-master-key-dialog',
  imports: [
    MaterialModule,
    CdkTextareaAutosize
  ],
  templateUrl: './input-master-key-dialog.component.html',
  styleUrl: './input-master-key-dialog.component.sass',
})
export class InputMasterKeyDialogComponent implements IDialog<any, string>
{
  ctrl      = new FormControl<string>("", [Validators.required]);
  data      = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef) as MatDialogRef<any, string>;
  
  constructor(
    
  )
  {
    
  }  
}
