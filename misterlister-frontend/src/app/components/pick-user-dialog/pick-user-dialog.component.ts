import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-pick-user-dialog',
  imports: [
    MaterialModule
  ],
  templateUrl: './pick-user-dialog.component.html',
  styleUrl: './pick-user-dialog.component.sass',
})
export class PickUserDialogComponent 
{
  ctrl = new FormControl<string>("");
  
  constructor()
  {
    
  }  
  
  
  
}
