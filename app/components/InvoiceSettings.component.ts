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
import {UUID} from "angular2-uuid";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {pageTitleService} from "qCommon/app/services/PageTitle";

declare let jQuery:any;
declare let Foundation:any;
declare let _:any;
declare let moment:any;

@Component({
  selector: 'invoice-settings',
  templateUrl: '../views/invoiceSettings.html',
})

export class InvoiceSettingsComponent implements  OnInit {
  invoiceSettingsForm: FormGroup;
  public uploader: FileUploader;
  public hasBaseDropZoneOver: boolean = false;
  document: any;
  billUploadResp: any;
  companyId: string;
  logoURL:string;
  preference: any;
  userID:any;
  showUploader:boolean;

  constructor(private _fb: FormBuilder, private _invoiceSettingsForm: InvoiceSettingsForm, private dss: DomSanitizer,
      private invoiceService: InvoicesService, private toastService: ToastService, private loadingService: LoadingService,private titleService:pageTitleService){
    this.invoiceSettingsForm = this._fb.group(this._invoiceSettingsForm.getForm());
    this.companyId = Session.getCurrentCompany();
    this.userID=Session.getUser().id;
    this.titleService.setPageTitle("Invoice Settings");
    if(this.companyId){
      this.loadingService.triggerLoadingEvent(true);
      this.invoiceService.getPreference(this.companyId,this.userID)
          .subscribe(preference => this.processPreference(preference), error => {
            this.loadingService.triggerLoadingEvent(false);
            this.toastService.pop(TOAST_TYPE.error, "Failed to load invoice preferences");
          });
    }
    this.getCompanyLogo();
  }

  getCompanyLogo() {
    this.invoiceService.getCompanyLogo(Session.getCurrentCompany(),Session.getUser().id)
        .subscribe(preference => this.processLogoPreference(preference[0]), error => {
          this.setFileUploader(null);
          this.handleError(error);
        });
  }

  processLogoPreference(preference){
    if(preference && preference.temporaryURL){
      this.logoURL = preference.temporaryURL;
      this.setFileUploader(preference.id);
    }else {
      this.setFileUploader(null);
    }
  }

  processPreference(preference){
    this.loadingService.triggerLoadingEvent(false);
    this.preference = preference;
    if(preference){
      //this.logoURL = preference.companyLogo;
      this.populateColumns();
      this._invoiceSettingsForm.updateForm(this.invoiceSettingsForm, preference);
    }
  }

  populateColumns(){
    if(["Units", "Hours"].indexOf(this.preference.units) == -1){
      this.preference.otherUnits = this.preference.units;
      this.preference.units = 'Other';
    }
    if(["Item", "Product", "Service", "Task"].indexOf(this.preference.items) == -1){
      this.preference.otherItems = this.preference.items;
      this.preference.items = 'Other';
    }
    if(["Price", "Rate"].indexOf(this.preference.price) == -1){
      this.preference.otherPrice = this.preference.price;
      this.preference.price = 'Other';
    }
    if(["Amount"].indexOf(this.preference.amount) == -1){
      this.preference.otherAmount = this.preference.amount;
      this.preference.amount = 'Other';
    }
  }

  handleError(error){

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
    if (this.document && this.document.temporaryURL) {
      let link: string = "";
      link = this.document.temporaryURL;
      this.logoURL = link;
      let data = this._invoiceSettingsForm.getData(this.invoiceSettingsForm);
      data.documentId = this.document.id;
      data.companyLogo = this.logoURL;
      this._invoiceSettingsForm.updateForm(this.invoiceSettingsForm, data);
    }
  }

  ngOnInit() {

  }

  submit($event){
    $event && $event.preventDefault();
    this.loadingService.triggerLoadingEvent(true);
    let data = this._invoiceSettingsForm.getData(this.invoiceSettingsForm);
    if(this.preference && !_.isEmpty(this.preference)){
      data.id = this.preference.id;
      this.invoiceService.updatePreference(this.cleanData(data), this.preference.id, this.companyId)
          .subscribe(response => {
            this.loadingService.triggerLoadingEvent(false);
            this.toastService.pop(TOAST_TYPE.success, "Invoice Preference updated successfully");
          }, error => {
            this.loadingService.triggerLoadingEvent(false);
            this.toastService.pop(TOAST_TYPE.error, "Could not update Invoice Preference");
          });
    } else{
      data.id = UUID.UUID();
      this.invoiceService.createPreference(this.cleanData(data), this.companyId)
          .subscribe(response => {
            this.loadingService.triggerLoadingEvent(false);
            this.toastService.pop(TOAST_TYPE.success, "Invoice Preference created successfully");
          }, error => {
            this.loadingService.triggerLoadingEvent(false);
            this.toastService.pop(TOAST_TYPE.error, "Could not create Invoice Preference");
          });
    }
  }

  cleanData(data){
    if(data.units == 'Other'){
      data.units = data.otherUnits;
    }
    if(data.items == 'Other'){
      data.items = data.otherItems;
    }
    if(data.amount == 'Other'){
      data.amount = data.otherAmount;
    }
    if(data.price == 'Other'){
      data.price = data.otherPrice;
    }
    delete data.otherUnits;
    delete data.otherItems;
    delete data.otherAmount;
    delete data.otherPrice;
    return data;
  }

  isOtherItem(){
    let data = this._invoiceSettingsForm.getData(this.invoiceSettingsForm);
    if(data.items == 'Other'){
      return false;
    }
    return true;
  }

  isOtherPrice(){
    let data = this._invoiceSettingsForm.getData(this.invoiceSettingsForm);
    if(data.price == 'Other'){
      return false;
    }
    return true;
  }

  isOtherAmount(){
    let data = this._invoiceSettingsForm.getData(this.invoiceSettingsForm);
    if(data.amount == 'Other'){
      return false;
    }
    return true;
  }

  isOtherUnit(){
    let data = this._invoiceSettingsForm.getData(this.invoiceSettingsForm);
    if(data.units == 'Other'){
      return false;
    }
    return true;
  }

  setFileUploader(documentId){
    let serviceURL=this.invoiceService.getDocumentServiceUrl();
    let methodType='POST';
    if(documentId){
      serviceURL=serviceURL+'/'+documentId;
      methodType='PUT';
    }
    this.uploader = new FileUploader(<FileUploaderOptions>{
      url: serviceURL,
      method:methodType,
      headers: [{
        name: 'Authorization',
        value: 'Bearer ' + Session.getToken()
      }]
    });
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
    this.showUploader=true;
  }

}
