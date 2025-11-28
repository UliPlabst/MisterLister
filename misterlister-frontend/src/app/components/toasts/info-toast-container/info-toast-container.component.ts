import { Component, OnInit, Input, Inject, OnDestroy, inject } from "@angular/core";
import { Subscription } from "rxjs";
import { trigger, transition, style, animate } from "@angular/animations";
import { InfoMessage, InfoService } from "src/app/services/info.service";

@Component({
  selector: 'app-info-toast-container',
  styleUrls: ['./info-toast-container.component.sass'],
  standalone: false,
  animations: [
    trigger('toast',[
      transition(':enter', [
        style({
          opacity: "0",
        }),
        animate(".2s ease-in-out", style({
          opacity: "1"
        }))
      ]),
      transition(':leave', [
        style({
          opacity: "1"
        }),
        animate(".2s ease-in-out", style({
          opacity: "0"
        }))
      ])
    ]),
  ],
  template: `
@for (m of messages; track m) {
  <div @toast class="info-toast-container">
    <app-info-toast [message]="m" >
    </app-info-toast>
  </div>
}
`
})
export class InfoToastContainerComponent implements OnInit, OnDestroy
{
  @Input()
  scope: string = "global";

  messages: InfoMessage[];

  progress = 100;
  sub: Subscription;

  infoService = inject(InfoService);
  
  ngOnInit()
  {
    this.sub = this.infoService.messages$
      .subscribe(e => {
        this.messages = e;
      });
  }
  
  ngOnDestroy(): void
  {
    this.sub?.unsubscribe();
  }
}
