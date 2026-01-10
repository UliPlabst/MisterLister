import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PortalModule, CdkPortal } from '@angular/cdk/portal';
import { MaterialModule } from 'src/app/material.module';
import { IDialog } from 'src/app/services/dialog.service';
import { generate } from 'lean-qr';

export interface IQrCodeDialogData {
  title?: string;
  content: string;
  buttons?: Button[];
}

export type Button = {
  icon?: string;
  label: string;
  invoke: (ev: MouseEvent) => any;
  color?: string
}

@Component({
  selector: 'app-qrcode-dialog',
  imports: [
    MaterialModule,
    PortalModule
  ],
  templateUrl: './qrcode-dialog.component.html',
  styleUrl: './qrcode-dialog.component.sass',
})
export class QrCodeDialogComponent implements IDialog<IQrCodeDialogData, void>, OnInit {
  @ViewChild('qrCanvas', { static: true }) qrCanvas!: ElementRef<HTMLCanvasElement>;
  
  data = inject(MAT_DIALOG_DATA) as IQrCodeDialogData;
  dialogRef = inject(MatDialogRef) as MatDialogRef<any, void>;

  ngOnInit(): void {
    this.generateQrCode();
  }

  private generateQrCode(): void {
    const canvas = this.qrCanvas.nativeElement;
    const code = generate(this.data.content);
    code.toCanvas(canvas, {  });
  }
}
