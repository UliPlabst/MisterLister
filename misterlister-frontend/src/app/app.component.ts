import "./extensions/extensions";
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MaterialModule } from "./material.module";
import { SlideBarComponent } from "./components/slidebar/slide-bar.component";
import { UtilityService } from "./services/utility.service";
import { CommonModule } from "@angular/common";
import { PickUserDialogComponent } from "./components/pick-user-dialog/pick-user-dialog.component";
import { SwService } from "./services/sw.service";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { DisposableCollection, LambdaDisposable } from "./utils";
import { InfoToastsModule } from "./components/toasts/info-toasts.module";
import { filter, take } from "rxjs";
import { ISaveListDTO } from "./types.api";
import { FileInputDirective } from "./directives/file-input.directive";
import { EncryptedSaveDTO } from "./services/api.service";

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterModule,
    MaterialModule,
    SlideBarComponent,
    MatSlideToggleModule,
    ReactiveFormsModule,
    CommonModule,
    InfoToastsModule,
    FileInputDirective
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent implements OnInit, OnDestroy
{
  menuExpanded = false;
  autoSaveCtrl = new FormControl<boolean>(false);
  private _disp = new DisposableCollection();
  constructor(
    public util: UtilityService,
    public sw: SwService
  )
  {
  }
  
  async ngOnInit()
  {
    this.sw.addTo(this._disp);
    this.autoSaveCtrl.valueChanges
      .subscribe(e => {
        this.sw.updateOptions({ autoSaveEnabled: e });
      })
      .addTo(this._disp);
      
    this.util.sw.ready$
      .subscribe(e => {
        // if(e == true)
        //   this.sync();
      });
      
    let installPromptDismissed = await this.util.storage.getKeyValue<boolean>("installPromptDismissed");
    if(!installPromptDismissed)
    {
      if(await this.util.storage.getKeyValue<boolean>("installPromptDismissed"))
        return;
      // setTimeout(async () => {
      //   let res = await this.util.dialog.confirm(
      //     "Install MisterLister App",
      //     [
      //       "Did you know that you can install this web app on your device for a better experience?",
      //       "Installing this app will allow you to add it to your home screen and increase the storage quota limits to ensure that your data will never be deleted due to storage constraints.",
      //       "Installation instructions are different depending on your browser. Look for a button named 'Add to home screen' or 'Install app' in the context menu.",
      //     ],
      //     "Got it, don't show again",
      //     "Ok"
      //   );
      //   if(res === true)
      //     await this.util.storage.setKeyValue("installPromptDismissed", true);
      // }, 30000)
    }
  }
  
  ngOnDestroy(): void
  {
    this._disp.dispose();
  }
  
  async sync()
  {
    let lists = await this.util.storage.db.lists.toArray();
    if(this.util.user$.value == null || lists.length == 0)
      return;
    let dtos: Record<string, EncryptedSaveDTO> = {};
    for(let l of lists)
    {
      let res: EncryptedSaveDTO = {
        new: l.new != null ? { ...l.new, isEncrypted: true } : null,
        old: l.old != null ? { ...l.old, isEncrypted: true } : null,
      };
      dtos[l.id] = res;
    }
    let res = await this.util.api.syncLists(dtos);
    if(!res)
      return;
    Object.keys(res).forEach(id => {
      this.util.sw.bus.emit("listUpdate", { list: res[id] });
    });
  }
  
  async switchUser()
  {
    let d = this.util.dialog.open(PickUserDialogComponent);
    let res = await d.afterClosed().toPromise();
    if (!res)
      return null;
    this.util.setUser(res);
  }
}
