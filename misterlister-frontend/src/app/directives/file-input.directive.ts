import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import { fromEvent } from 'rxjs';
import { DisposableCollection } from "../utils";

export interface FileInputChangedEvent
{
  files: FileList;
  target: HTMLInputElement;
}

@Directive({
  selector: "[fileInput]",
  standalone: true
})
export class FileInputDirective implements OnDestroy, AfterViewInit
{
  private _disp = new DisposableCollection();

  @Input("fileInputMultiple")
  multiple: boolean = false;
  @Input("fileInputAccept")
  accept: string = null;
  @Input("fileInputDisabled")
  disabled: boolean = false;
  @Input("fileInputCapture")
  capture: string = null;

  @Output("fileInputChanged")
  changed = new EventEmitter<FileInputChangedEvent>();

  input: HTMLInputElement;

  constructor(
    private _el: ElementRef<HTMLElement>
  )
  {

  }

  ngAfterViewInit(): void
  {
    let el = this._el.nativeElement;
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.accept = this.accept;
    this.input.multiple = this.multiple;
    if(this.capture)
      this.input.capture = this.capture;
    
    this.input.classList.add("no-display")

    fromEvent(this.input, "change")
      .subscribe((e: Event) => {
          this.changed.next({
            files: this.input.files,
            target: this.input
          });
        })
        .addTo(this._disp);
    fromEvent(this._el.nativeElement, "click")
      .subscribe(() => {
          if(!this.disabled)
            this.input.click();
        })
        .addTo(this._disp);

    el.appendChild(this.input);
  }

  ngOnDestroy(): void
  {
    this._disp.dispose();
  }

}
