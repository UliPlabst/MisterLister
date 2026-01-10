import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EMAIL } from "src/app/constants";
import { LayoutService } from "src/app/services/layout.service";
import { DisposableCollection } from "src/app/utils";

@Component({
  selector: "app-about",
  templateUrl: "./about.component.html",
  styleUrls: ["./about.component.sass"]
})
export class AboutComponent implements OnInit, OnDestroy
{
  layout = inject(LayoutService);
  _disp = new DisposableCollection();

  ngOnInit(): void
  {
    this.layout.setTitle("About").addTo(this._disp);
  }

  ngOnDestroy(): void
  {
    this._disp.dispose();
  }

}