import { Component } from "@angular/core";
import { EMAIL } from "src/app/constants";

@Component({
  selector: "app-privacy",
  templateUrl: "./privacy.component.html",
  styleUrls: ["./privacy.component.sass"]
})
export class PrivacyComponent
{
  edited = new Date(2025, 11, 28).toDateString();
  email = EMAIL;
}
  