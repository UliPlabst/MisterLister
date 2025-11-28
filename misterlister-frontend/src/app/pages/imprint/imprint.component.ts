import { Component } from "@angular/core";
import { EMAIL } from "src/app/constants";

@Component({
  selector: "app-imprint",
  templateUrl: "./imprint.component.html",
  styleUrls: ["./imprint.component.sass"]
})
export class ImprintComponent
{
  email = EMAIL;
}
  