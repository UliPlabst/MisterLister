import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EMAIL } from "src/app/constants";
import { LayoutService } from "src/app/services/layout.service";
import { DisposableCollection } from "src/app/utils";

@Component({
  selector: "app-privacy",
  templateUrl: "./privacy.component.html",
  styleUrls: ["./privacy.component.sass"]
})
export class PrivacyComponent implements OnInit, OnDestroy
{
  edited = new Date(2025, 11, 28).toDateString();
  email = EMAIL;
  layout = inject(LayoutService);
  _disp = new DisposableCollection();
  
  ngOnInit(): void
  {
    this.layout.setTitle("Privacy ").addTo(this._disp);
  }
  
  ngOnDestroy(): void
  {
    this._disp.dispose();
  }
}
  