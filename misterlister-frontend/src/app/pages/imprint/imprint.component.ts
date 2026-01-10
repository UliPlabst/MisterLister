import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EMAIL } from "src/app/constants";
import { LayoutService } from "src/app/services/layout.service";
import { DisposableCollection } from "src/app/utils";

@Component({
  selector: "app-imprint",
  templateUrl: "./imprint.component.html",
  styleUrls: ["./imprint.component.sass"]
})
export class ImprintComponent implements OnInit, OnDestroy
{
  email = EMAIL;
  edited = new Date(2025, 11, 28).toDateString();
  layout = inject(LayoutService);
  _disp = new DisposableCollection();
  
  ngOnInit(): void
  {
    this.layout.setTitle("Imprint").addTo(this._disp);
  }
  
  ngOnDestroy(): void
  {
    this._disp.dispose();
  }
}
  