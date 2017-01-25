/**
 * Created by seshu on 25-07-2016.
 */

import {Session} from "qCommon/app/services/Session";
import {FormBuilder, FormGroup} from "@angular/forms";
import {InvoiceSettingsForm} from "../forms/InvoiceSettings.form";
import {Component, OnInit} from "@angular/core";
import {FileUploader, FileUploaderOptions} from "ng2-file-upload";
import {DomSanitizer} from "@angular/platform-browser";
import {InvoicesService} from "../services/Invoices.service";

declare let jQuery:any;
declare let Foundation:any;
declare let _:any;
declare let moment:any;

@Component({
  selector: 'invoice-settings',
  templateUrl: '/app/views/invoiceSettings.html',
})

export class InvoiceSettingsComponent implements  OnInit {
  invoiceSettingsForm: FormGroup;
  public uploader: FileUploader;
  public hasBaseDropZoneOver: boolean = false;
  document: any;
  billUploadResp: any;
  companyId: string;

  constructor(private _fb: FormBuilder, private _invoiceSettingsForm: InvoiceSettingsForm, private dss: DomSanitizer,
      private invoiceService: InvoicesService){
    this.invoiceSettingsForm = this._fb.group(this._invoiceSettingsForm.getForm());
    this.companyId = Session.getCurrentCompany();

    this.uploader = new FileUploader(<FileUploaderOptions>{
      url: invoiceService.getDocumentServiceUrl(),
      headers: [{
        name: 'Authorization',
        value: 'Bearer ' + Session.getToken()
      }]
    });
  }

  fileOverBase(e: any) {
    this.hasBaseDropZoneOver = e;
  }

  startUpload($event) {
    let base = this;
    setTimeout(function () {
      base.uploader.uploadAll();
    }, 500);
  }

  deleteDocument() {
    //Invoke delete document service
  }

  removeUploadItem(item) {
    item.remove();
    this.deleteDocument();
  }

  compileLink() {
    let base = this;
    if (this.document && this.document.temporaryURL) {
      let link: string = "";

      link = this.document.temporaryURL;
    }
  }

  ngOnInit() {
    this.uploader.onBuildItemForm = (fileItem: any, form: any) => {
      let payload: any = {};
      payload.sourceID = this.companyId;
      payload.sourceType = 'company_invoice';
      form.append('payload', JSON.stringify(payload));
    };

    this.uploader.onCompleteItem = (item, response, status, header) => {
      if (status === 200) {
        this.uploader.progress = 100;
        this.billUploadResp = response;
        this.uploader.queue.forEach(function (item) {
          item.remove();
        });
        this.document = JSON.parse(response);
        this.compileLink();
      }
    }
  }
}
