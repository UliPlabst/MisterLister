import { Component, HostBinding, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { InfoMessage, InfoService } from 'src/app/services/info.service';
import { assertNever } from 'src/app/utils';


@Component({
  selector: "app-info-toast",
  styleUrls: ['./info-toast.component.sass'],
  templateUrl: './info-toast.component.html',
  standalone: false
})
export class InfoToastComponent implements OnInit, OnChanges
{
  icon: string;

  @Input()
  message: InfoMessage;


  @HostBinding("class")
  get classBinding() { return this.message.severity }
  @HostBinding("class.toast")
  get toastBinding() { return true }
  
  infoService = inject(InfoService);

  ngOnChanges(changes: SimpleChanges)
  {
    if(changes.message)
      this.icon = this.getIcon(this.message);
  }

  ngOnInit()
  {
    this.icon = this.getIcon(this.message);
  }

  getIcon = (m: InfoMessage) => {
    switch(m.severity)
    {
      case "error":
        return "error";
      case "info":
        return "info";
      case "warning":
        return "warning";
      case "success":
        return "done";
      case "busy":
        return "spinner";
      default:
        assertNever(m.severity);
    }
  }

  onMouseEnter()
  {
    this.message.timeout = null;
  }

  onClose()
  {
    this.infoService.removeMessage(this.message);
  }
}
