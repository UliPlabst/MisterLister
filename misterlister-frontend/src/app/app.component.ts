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
    InfoToastsModule
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
  
  ngOnInit(): void
  {
    this.sw.addTo(this._disp);
    this.autoSaveCtrl.valueChanges
      .subscribe(e => {
        this.sw.updateOptions({ autoSaveEnabled: e });
      })
      .addTo(this._disp);
  }
  
  ngOnDestroy(): void
  {
    this._disp.dispose();
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
