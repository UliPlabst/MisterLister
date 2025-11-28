import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { PureCallPipe } from 'src/app/pipes/pureCall.pipe';
import { UtilityService } from 'src/app/services/utility.service';
import { ICheckList } from 'src/app/types.api';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    MaterialModule,
    PureCallPipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass',
})
export class HomeComponent implements OnInit
{ 
  goToCtrl = new FormControl<string>("", Validators.required);
  nameCtrl = new FormControl<string>("", Validators.required);
  
  lists: ICheckList[] = null;
  
  constructor(
    public util: UtilityService
  )
  {
  }
  
  async ngOnInit()
  {
    this.util.layout.resetTitle();
    let lists = await this.util.storage.getLists();
    this.lists = lists.sort((a,b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  }
  
  async createList()
  {
    if(this.nameCtrl.invalid)
    {
      this.nameCtrl.markAsTouched();
      return;
    }
    
    let user = await this.util.ensureUser();
    let list: ICheckList = {
      name: this.nameCtrl.value,
      description: null,
      items: [],
      id: this.util.newGuid()
    };
    let res = await this.util.api.saveList({
      new: list,
      user
    });
    if(!res)
      return;
    this.util.router.navigate(["/list", res.id]);
  }
  
  getLink = (list: ICheckList) => `/list/${list.id}`; 
  
  async goToList()
  {
    let id = this.goToCtrl.value;
    if(id == null)
      return;
    let list = await this.util.api.getList(id);
    if(!list)
    {
      this.goToCtrl.setErrors({ invalid: true });
      return;
    }
    await this.util.ensureUser();
    this.goToCtrl.setErrors(null);
    this.util.router.navigate(["/list", list.id]);
  }
  
}
