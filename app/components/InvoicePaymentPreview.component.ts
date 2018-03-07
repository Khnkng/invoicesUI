
import {Component,Input} from "@angular/core";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {ToastService} from "qCommon/app/services/Toast.service";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {ActivatedRoute, Router} from "@angular/router";
import {InvoicesService} from "../services/Invoices.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {CustomersService} from "qCommon/app/services/Customers.service";
import {Session} from "qCommon/app/services/Session";
import {NumeralService} from "qCommon/app/services/Numeral.service";
import {DateFormater} from "qCommon/app/services/DateFormatter.service";
import {DiscountService} from "qCommon/app/services/Discounts.service";

declare let jQuery:any;
declare let _:any;
declare let moment:any;

@Component({
    selector: 'invoicePaymentPreview',
    templateUrl: '../views/invoicePaymentPreview.html',
})

export class InvoicePaymentPreview{
    invoiceID:string;
    customers: Array<any> = [];
    taskInvoices: Array<any> = [];
    itemInvoices: Array<any> = [];
    invoiceData:any;
    logoURL:string;
    dateFormat:string;
    serviceDateformat:string;
    zoomSize:number=1;
    amountFont:string="18pt";
    lineAmountFont:string="14pt";
    logoWidth:string="0";
    termsList:any={"net30":"Net 30","net45":"Net 45","net60":"Net 60","net90":"Net 90","custom":"Custom"};
    invoiceStates:any={"draft":"Draft","paid":"Paid","partially_paid":"Partially Paid","past_due":"Past Due","sent":"Sent"};
    templateType:string;
    displayState:string;
    tasks:string;
    UOM:string;
    unitCost:string;
    showDescription:boolean=true;
    showUnitCost:boolean=true;
    showUOM:boolean=true;
    showItemName:boolean=true;
    latefeeAmount:any=0;
    discountAmount:any=0;
    notesSize:any=0;
    invoiceAmount:any=0;
    @Input()
    set invoices(invoices:any){
        this.invoiceData = invoices;
        this.templateType=invoices.templateType;
        this.tasks=invoices.tasks;
        this.UOM=invoices.UOM;
        this.unitCost=invoices.unitCost;
        this.showDescription=invoices.showDescription;
        this.showUnitCost=invoices.showUnitCost;
        this.showUOM=invoices.showUOM;
        this.showItemName=invoices.showItemName;
        this.notesSize=invoices.notes;
        if(invoices.logoURL){
            this.logoWidth="90px";
            this.logoURL = invoices.logoURL;
        }else{
            this.getCompanyLogo();
        }
        invoices.displayterm=this.setDisplayTerms(invoices.term);
        this.loadInvoiceData();
        if(invoices.isPastDue){
          this.bgColor="#F06459";
          this.displayState="past_due";
        }else {
          this.displayState=invoices.state;
          this.getHeaderColor(this.displayState);
        }
        this.latefeeAmount=invoices.late_fee_amount?invoices.late_fee_amount:0;
        if(invoices.state!="partially_paid"&&invoices.is_discount_applied&&invoices.discount_id){
          this.getDiscountAmount();
        }

        this.getZoomSize();
    }
    bgColor:string="#878787";

    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private invoiceService: InvoicesService,private customerService: CustomersService,
                private numeralService:NumeralService,private dateFormater: DateFormater,private  discountsService:DiscountService){
        this.serviceDateformat = dateFormater.getServiceDateformat();
        this.dateFormat = dateFormater.getFormat();
    }

    loadInvoiceData() {
        this.taskInvoices =this.invoiceData.invoiceLines//  _.filter(this.invoiceData.invoiceLines, function(invoice) { return invoice.type == 'task'; });
        //this.itemInvoices =  _.filter(this.invoiceData.invoiceLines, function(invoice) { return invoice.type == 'item'; });
    }

    loadCustomers(companyId: any) {
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
            }, error => {
                this.toastService.pop(TOAST_TYPE.error, "Failed To Load Your Customers");
                this.loadingService.triggerLoadingEvent(false);
            });
    }

    getCompanyLogo() {
        this.invoiceService.getCompanyLogo(this.invoiceData.company_id,this.invoiceData.user_id)
            .subscribe(preference => this.processPreference(preference[0]), error => this.handleError(error));
    }

    processPreference(preference){
        if(preference && preference.temporaryURL){
            this.logoWidth="90px";
            this.logoURL = preference.temporaryURL;
        }
    }

    convertDateToLocaleFormat(inputDate){
        return (inputDate) ? this.dateFormater.formatDate(inputDate, this.serviceDateformat, this.dateFormat) : inputDate;
    }

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Failed To Perform Operation");
    }

    ngOnDestroy(){
    }

    ngOnInit(){

    }

    formatAmount(value){
        return this.numeralService.format('$0,0.00', value)
    }

    formatQuantity(value){
        return this.numeralService.format('0,0.0000', value)
    }

    getInvoiceDisplayState(state){
        return this.invoiceStates[state];
    }

    getHeaderColor(state){
        switch (state) {
            case "draft":
                this.bgColor="#878787";
                break;
            case "past_due":
                this.bgColor="#F06459";
                break;
            case "sent":
                this.bgColor="#384986";
                break;
            case "paid":
                this.bgColor="#00b1a9";
                break;
            default:
                this.bgColor="#00b1a9";
                break;
        }
    }

    getZoomSize(){
        let amount=this.formatAmount(this.invoiceData.amount);
        if(amount.length>16){
            this.amountFont="13pt";
            this.lineAmountFont="10pt";
        }
    }

    setDisplayTerms(term){
      if(term=='custom'){
        let startDate = moment(this.invoiceData.invoice_date, this.serviceDateformat);
        let endDate = moment(this.invoiceData.due_date, this.serviceDateformat);

        return   endDate.diff(startDate, 'days') +' days';
      }else {
        return this.termsList[this.invoiceData.term]
      }
    }

    validateLateFeeAmount(){
        if(this.latefeeAmount>0){
            return true;
        }
        return false;
    }

    validateNotes(){
        if(this.notesSize.length>0){
            return true;
        }
    }

    getDiscountAmount(){
      let dueDate=this.dateFormater.formatDate(this.invoiceData.due_date,this.dateFormat,this.serviceDateformat);
      let data={
        due_date:dueDate,
        amount:this.invoiceData.amount
      };
      this.discountsService.getDiscountAmount(data,this.invoiceData.discount_id,Session.getCurrentCompany()).subscribe(discount => {
        this.discountAmount=this.roundOffValue(discount.discount_amount);
      }, error => this.handleError(error));
    }

    validateDiscountAmount(){
      if(this.discountAmount>0){
        return true;
      }
      return false;
    }

    calculateDueTotal(){
      if(this.invoiceData.is_discount_applied&&this.invoiceData.discount_id){
        return this.roundOffValue(this.invoiceData.amount_due-this.discountAmount);
      }else {
        return  this.invoiceData.amount_due;
      }
    }

    calculateAmountTotal(){
      if(this.invoiceData.is_discount_applied&&this.invoiceData.discount_id){
        return this.roundOffValue(this.invoiceData.amount-this.discountAmount);
      }else {
        return this.invoiceData.amount;
      }
    }

  roundOffValue(num){
    return Math.round(num * 100) / 100
  }
}
