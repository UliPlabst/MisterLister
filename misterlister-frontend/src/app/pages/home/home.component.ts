import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { PureCallPipe } from 'src/app/pipes/pureCall.pipe';
import { UtilityService } from 'src/app/services/utility.service';
import { ICheckList } from 'src/app/types.api';
import { createKey, DisposableCollection, download, encrypt, exportKey, importKey } from 'src/app/utils';
import { decryptList } from 'src/app/utils/utils.list';
import { ListComponentQP } from '../list/list.component';
import { FileInputChangedEvent, FileInputDirective } from "src/app/directives/file-input.directive";
import { DecryptedList } from 'src/app/types';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    MaterialModule,
    PureCallPipe,
    FileInputDirective
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass',
})
export class HomeComponent implements OnInit, OnDestroy
{ 
  goToCtrl = new FormControl<string>("", Validators.required);
  nameCtrl = new FormControl<string>("", Validators.required);
  disp = new DisposableCollection();
  lists: ICheckList[] = null;
  
  constructor(
    public util: UtilityService
  )
  {
  }
  
  ngOnInit()
  {
    this.util.layout.resetTitle();
    this.util.sw.bus.get("listUpdate")
      .pipe(debounceTime(100))
      .subscribe(async e => {
        await this.updateLists();
      })
      .addTo(this.disp);
    this.updateLists();
  }
  
  ngOnDestroy(): void
  {
    this.disp.dispose();
  }
  
  async updateLists()
  {
    let lists = await this.util.storage.getLists();
    lists = await Promise.all(
      lists.map(async l => {
        try
        {
          l = await decryptList(l, await this.util.storage.getKeyOrThrow(l.key));
        }
        catch(err)
        {
          l.name = "[UNABLE TO DECRYPT]";
        }
        return l;
      })
    );
    this.lists = lists.sort((a,b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  }
  
  getItems = (list: ICheckList) => list.items.filter(e => e.deletedAt == null).length;
  
  async createList()
  {
    if(this.nameCtrl.invalid)
    {
      this.nameCtrl.markAsTouched();
      return;
    }
    
    let user = await this.util.ensureUser();
    let masterKey = await createKey();
    let listEncryptionKey = await createKey();
    let encryptedKey = await encrypt(
      masterKey,
      await exportKey(listEncryptionKey)
    );
    let now = new Date().toISOString();
    let list: DecryptedList = {
      name: this.nameCtrl.value,
      description: null,
      items: [],
      key: this.util.newGuid(),
      encryptedKey,
      createdBy: user,
      created: now,
      lastModified: now,
      lastModifiedBy: user,
      deleted: null,
      deletedBy: user,
      isEncrypted: false,
    };
    await this.util.storage.saveKey(list.key, masterKey);
    
    let res = await this.util.api.saveList(list.key, {
      new: list,
      old: null
    });
    if(!res)
      return;
    this.util.router.navigate(["/list", res.key], {
      queryParams: {
        showData: true
      } satisfies ListComponentQP
    });
  }
  
  getLink = (list: ICheckList) => `/list/${list.key}`; 
  
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
    this.util.router.navigate(["/list", list.key]);
  }
  
  async exportLists()
  {
    await this.updateLists();
    let json = JSON.stringify(this.lists, null, 3);
    await download(`misterlister-backup-${new Date().toISOString()}.json`, json, "application/json");
  }
  
  async exportMasterKeys()
  {
    let keys = await this.util.storage.db.keys.toArray();
    let obj: Record<string, string> = {};
    for(let k of keys)
    {
      let exported = await exportKey(k.key);
      obj[k.id] = exported;
    }
    let json = JSON.stringify(obj, null, 3);
    await download(`misterlister-master-keys-${new Date().toISOString()}.json`, json, "application/json");
  }
  
  async importMasterKeys(ev: FileInputChangedEvent)
  {
    try
    {
      let file = ev.files[0];
      let text = await file.text();
      let obj: Record<string, string> = JSON.parse(text);
      if(!obj || typeof obj !== "object" || Object.values(obj).some(v => typeof v !== "string"))
      {
        this.util.info.showMessage(
          "error",
          "Invalid master key file.",
          "The selected file has an invalid format and cannot be imported."
        );
        return;
      }
      
      for(let id of Object.keys(obj))
      {
        let existing = await this.util.storage.getKey(id);
        if(existing) //prevent override
          continue;
          
        let key = await importKey(obj[id]);
        await this.util.storage.saveKey(id, key);
        await this.util.api.getList(id);
      } 
      
      await this.updateLists();
      this.util.info.showMessage(
        "success",
        "Master keys imported.",
        "The master keys have been successfully imported."
      );
    }
    finally
    {
      ev.target.value = "";
    }
  }
  
}
