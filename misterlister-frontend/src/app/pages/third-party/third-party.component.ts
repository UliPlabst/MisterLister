import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { MaterialModule } from "src/app/material.module";
import { LayoutService } from "src/app/services/layout.service";
import { DisposableCollection } from "src/app/utils";

@Component({
  selector: "app-third-party",
  templateUrl: "./third-party.component.html",
  styleUrls: ["./third-party.component.sass"],
  imports: [
    MaterialModule
  ]
})
export class ThirdPartyComponent implements OnInit, OnDestroy
{
   layout = inject(LayoutService);
  _disp = new DisposableCollection();

  ngOnInit(): void
  {
    this.layout.setTitle("Third party").addTo(this._disp);
  }

  ngOnDestroy(): void
  {
    this._disp.dispose();
  }
}
  