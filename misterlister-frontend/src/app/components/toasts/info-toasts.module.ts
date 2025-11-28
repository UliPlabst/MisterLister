import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { InfoToastContainerComponent } from "./info-toast-container/info-toast-container.component";
import { InfoToastComponent } from "./info-toast/info-toast.component";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [
    InfoToastComponent,
    InfoToastContainerComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  exports: [
    InfoToastComponent,
    InfoToastContainerComponent,
  ]
})
export class InfoToastsModule { }
