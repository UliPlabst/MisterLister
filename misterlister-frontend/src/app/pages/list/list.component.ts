import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, firstValueFrom, fromEvent, map, Subject } from 'rxjs';
import { ButtonProgressWrapperComponent } from "src/app/components/button-progress-wrapper/button-progress-wrapper.component";
import { QrCodeDialogComponent } from 'src/app/components/qrcode-dialog/qrcode-dialog.component';
import { TogglerComponent } from 'src/app/components/toggler/toggler.component';
import { MaterialModule } from 'src/app/material.module';
import { IfNullPipe } from 'src/app/pipes/ifNull.pipe';
import { PureCallPipe } from 'src/app/pipes/pureCall.pipe';
import { UtilityService } from 'src/app/services/utility.service';
import { DecryptedList, DecryptedListItem, isDecryptedList } from 'src/app/types';
import { IListItem, ItemState } from 'src/app/types.api';
import { DisposableCollection, exportKey, importKey, LambdaDisposable } from 'src/app/utils';
import { createShareUrl } from 'src/app/utils/utils.list';

export type ListComponentQP = {
  showData?: boolean;
}

type MapEntry = {
  form: FormGroup<{
    name: FormControl<string>;
    completed: FormControl<boolean>;
  }>,
  disp: DisposableCollection
}


@Component({
  selector: 'app-list',
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    TogglerComponent,
    MaterialModule,
    PureCallPipe,
    CommonModule,
    ButtonProgressWrapperComponent,
    IfNullPipe
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.sass',
})
export class ListComponent implements OnInit, OnDestroy
{ 
  ItemState = ItemState;
  private _disp = new DisposableCollection();
  
  controls = new Map<string, MapEntry>();
  form = new FormGroup({
    name: new FormControl<string>(""),
    description: new FormControl<string>(""),
  });
  listDisp = new DisposableCollection();
  list: DecryptedList = null;
  oldState: DecryptedList = null;
  items: DecryptedListItem[] = [];
  deletedItems: DecryptedListItem[] = [];
  private _dirty = false;
  
  private _changed = new Subject<void>();
  
  busy: "saving"|null = null;
  key: CryptoKey = null;
  toggleListData = false;
  
  constructor(
    public util: UtilityService,
    private _route: ActivatedRoute,
    private _changeRef: ChangeDetectorRef,
    private _vc: ViewContainerRef,
    private _el: ElementRef<HTMLElement>,
  )
  {
    
  }
  
  async ngOnInit()
  {
    this.util.layout.set({ showFooter: false}).addTo(this._disp);
    
    this.util.layout.setButtons([
      {
        icon: "share",
        invoke: async () => {
          let url = await createShareUrl(this.list, { storage: this.util.storage });
          this.util.dialog.openDialog(QrCodeDialogComponent, {
            title: `Share List ${this.list.name}`,
            content: url,
            buttons: [
              {
                label: "Share",
                icon: "share",
                color: "primary",
                invoke: async (ev: MouseEvent) => {
                  navigator.share({
                    title: `List ${this.list.name}`,
                    text: `Check out my list on MisterLister`, // Description/body text
                    url: url
                  });
                }
              }
            ]
          });
        }
      }
    ]).addTo(this._disp);
    
    this.util.registerBeforeUnloadHandler(async ev => {
      if(this._dirty)
      {
        let user = this.util.user$.value;
        if(!user)
          return;
        let dto = await this.getSaveDTO(user);
        this.util.api.saveList(this.list.key, dto, true, true);
      }
    }).addTo(this._disp);
    
    this._route.paramMap
      .pipe(
        map(e => e.get("id")),
        distinctUntilChanged()
      )
      .subscribe(async (id) => {
        let rmKey = false;
        let fragment = await firstValueFrom(this._route.fragment);
        if(fragment?.startsWith("key="))
        {
          let keyStr = fragment.substring(4);
          let key = await importKey(keyStr);
          await this.util.storage.saveKey(id, key);
          rmKey = true;
        }
        
        if(id == null)
        {
          this.util.router.navigate([".."]);
          return;
        }
        let list = await this.util.api.getList(id);
        if(!list || !isDecryptedList(list))
        {
          this.util.router.navigate([".."]);
          return;
        }
        this.setList(list);
        if(rmKey)
          this.util.router.navigate([], { fragment: null, replaceUrl: true });
        
        
        let wasMasterKeyExported = await this.util.storage.getKeyValue<boolean>(`masterKeyExported-${this.list.key}`);
        if(!wasMasterKeyExported)
        {
          setTimeout(async () => {
            if(await this.util.storage.getKeyValue<boolean>(`masterKeyExported-${this.list.key}`))
              return;
            
            // this.util.info.showMessage(
            //   "info",
            //   "Backup master key",
            //   `Don't forget to backup your list master key! Your master key is stored on your device only and cannot be recovered otherwise. Every list has it's own master key!`
            // );
          }, 10000)
        }
      });
      
    this._route.queryParams
      .subscribe((e: ListComponentQP) => {
        let changed = false;
        let res: any = { ...e };
        if(e.showData)
        {
          this.toggleListData = true;
          delete res.showData;
          changed = true;
        }
        
        if(changed)
          this.util.router.navigate([], { queryParams: res, replaceUrl: true });
      })
      .addTo(this._disp);
      
    fromEvent(window, "focus")
      .subscribe(e => {
      })
      .addTo(this._disp);
      
    this.util.sw.bus.get("listUpdate")
      .pipe(filter(e => e.list.key == this.list?.key))
      .subscribe(e => {
        this.setList(e.list);
      });
      
    this._changed
      .subscribe(e => {
        this._dirty = true;
      });
      
    this._changed
      .pipe(debounceTime(5000))
      .subscribe(async e => {
        await this.save(false);
      });
  }
  
  async ngOnDestroy()
  {
    this._changed.complete();
    this._disp.dispose();
    if(this._dirty)
      this.save(true);
  }
  
  setList(list: DecryptedList)
  {
    if(this.list)
    {
      this.list.items.forEach(e => this.removeMapEntry(e));
      this.listDisp.dispose();
    }
    
    this.util.layout.setTitle(list.name || "Untitled");
    
    this.list = list;
    this.oldState = structuredClone(list);
    
    let [items, deletedItems] = this.list.items.split(e => e.state != ItemState.Deleted);
    this.items = items;
    this.deletedItems = deletedItems;
    
    this.form.patchValue(list);
    this.form.valueChanges
      .subscribe(e => {
        this.list.name = e.name;
        this.list.description = e.description;
        this._changed.next();
      })
      .addTo(this.listDisp);
    
    this.controls = new Map<string, MapEntry>();
    for(let item of this.list.items)
    {
      this.createMapEntry(item);
    }
  }
  
  async exportMasterKey()
  {
    let key = await this.util.storage.getKeyOrThrow(this.list.key);
    let masterKey = await exportKey(key);
    navigator.clipboard.writeText(masterKey);
    await this.util.storage.setKeyValue(`masterKeyExported-${this.list.key}`, true);
    this.util.info.showMessage("success", "Master key copied to clipboard.", null, 2000);
  }
  
  async getSaveDTO(user: string): Promise<{ old: DecryptedList, new: DecryptedList }>
  {
    let list = {
      ...this.list,
      items: [
        ...this.items,
        ...this.deletedItems
      ]
    };
    return {
      new: list,
      old: this.oldState,
    };
  }
  
  save = async (forceSave = true) => {
    let user = await this.util.ensureUser();
    if(!user)
      return;
    let dto = await this.getSaveDTO(user);
    console.log("[List]", "Save", this.list);
    let res = await this.util.api.saveList(
      this.list.key, 
      dto, 
      forceSave
    );
    this._dirty = false;
    this.setList(res);
  }
  
  async deleteList()
  {
    let conf = await this.util.dialog.confirm(
      "Delete List",
      [
        "Are you sure you want to delete this list? Deletion is instant and permanent. This action cannot be undone."
      ],
      "Delete",
      "Cancel"
    );
    if(!conf)
      return;
    await this.util.api.deleteList(this.list.key);
    this.util.router.navigate([".."]);
  }
  
  deleteCompleted()
  {
    for(let item of this.items.filter(e => e.state == ItemState.Completed))
    {
      this.removeItem(item);
    }
  }
  
  insertItem(idx: number = null, focus = true)
  {
    let user = this.util.user$.value;
    let now = new Date().toISOString();
    
    let item: DecryptedListItem = {
      key: this.util.newGuid(),
      name: '',
      state: ItemState.Idle,
      lastModified: now,
      lastModifiedBy: user,
      createdAt: now,
      createdBy: user,
      completedAt: null,
      completedBy: now,
      deletedBy: null,
      deletedAt: null,
      __isNew: true,
    };
    this.items.splice(idx, 0, item);
    this.createMapEntry(item);
    this._changed.next();
    if(focus)
      setTimeout(() => this.focusItem(item), 0);
  }
  
  removeItem(item: DecryptedListItem)
  {
    this.items.remove(item);
    if(!item.__isNew)
    {
      item.state = ItemState.Deleted;
      this.deletedItems.push(item);
    }
    if(this.items.length == 0)
    {
      this.insertItem(0, true);
    }
    this._changed.next();
  }
  
  restoreItem(item: DecryptedListItem)
  {
    this.deletedItems.remove(item);
    item.state = ItemState.Idle;
    this.getCtrl(item).controls.completed.setValue(false);
    this.items.push(item);
    this._changed.next();
  }
  
  private createMapEntry(item: IListItem)
  {
    let disp = new DisposableCollection();
    let form = new FormGroup({
      name: new FormControl<string>(item.name),
      completed: new FormControl<boolean>(item.state == ItemState.Completed)
    });
    
    form.controls.name.valueChanges
      .subscribe(e => {
        if(item.state == ItemState.Deleted)
          return;
        item.name = e;
        this._changed.next();
      })
      .addTo(disp);

    form.controls.completed.valueChanges
      .subscribe((val) => {
        if(item.state == ItemState.Deleted)
          return;
        item.state = val ? ItemState.Completed : ItemState.Idle;
        this._changed.next();
      }).addTo(disp);
    
    this.controls.set(item.key, {
      form, 
      disp
    });
  }
  
  private removeMapEntry(item: IListItem)
  {
    let entry = this.controls.get(item.key);
    if(!entry)
      return;
    
    entry.disp.dispose();
    this.controls.delete(item.key);
  }  

  getCtrl = (item: IListItem) => {
    return this.controls.get(item.key).form;
  }
  
  drop(event: CdkDragDrop<IListItem[]>) 
  {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  }
  
  focusItem(item: IListItem)
  {
    this._el.nativeElement.querySelector(`#item-${item.key}`)
        ?.querySelector<HTMLElement>(".name-input")
        ?.focus();
  }
  
  onItemKeydown(item: DecryptedListItem, ev: KeyboardEvent)
  {
    if(ev.key == "Enter")
    {
      if(ev.shiftKey)
      {
        this.getCtrl(item).controls.completed.setValue(item.state == ItemState.Idle ? true : false);
      }
      else
      {
        ev.stopPropagation();
        ev.preventDefault();
        this.insertItem(this.items.indexOf(item) + 1);
      }
    }
    else if(ev.key == "Backspace" && item.name == "")
    {
      ev.stopPropagation();
      ev.preventDefault();
      let idx = this.items.indexOf(item);
      if(idx > -1)
      {
        this.removeItem(item);
      }
      let above = this.items[idx - 1];
      if(above)
        this.focusItem(above);
    }
    else if(ev.key == "Delete")
    {
      let nextItem = this.items[this.items.indexOf(item) + 1];
      if(nextItem && nextItem.name == "")
      {
        ev.stopPropagation();
        ev.preventDefault();
        let idx = this.items.indexOf(item);
        if(idx > -1)
          this.removeItem(item);
        this.focusItem(nextItem);
      }
    }
    else if(ev.key == "ArrowUp")
    {
      if(ev.shiftKey)
      {
        let idx = this.items.indexOf(item);
        if(idx > 0)
        {
          ev.stopPropagation();
          ev.preventDefault();
          moveItemInArray(this.items, idx, idx - 1);
          setTimeout(() => this.focusItem(this.items[idx - 1]), 0);
        }
      }
      else
      {
        let idx = this.items.indexOf(item);
        if(idx > 0)
          this.focusItem(this.items[idx - 1]);
      }
    }
    else if(ev.key == "ArrowDown")
    {
      if(ev.shiftKey)
      {
        let idx = this.items.indexOf(item);
        if(idx < this.items.length - 1)
        {
          ev.stopPropagation();
          ev.preventDefault();
          moveItemInArray(this.items, idx, idx + 1);
          setTimeout(() => this.focusItem(this.items[idx + 1]), 0);
        }
      }
      else
      {
        let idx = this.items.indexOf(item);
        if(idx < this.items.length - 1)
          this.focusItem(this.items[idx + 1]);
      }
    }
  }
  
  scrollIntoView(el: ElementRef<HTMLElement>)
  {
    this._changeRef.detectChanges();
    el.nativeElement?.scrollIntoView({behavior: 'smooth', block: 'end'});
  }
}

