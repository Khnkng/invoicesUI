
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
    @Input()
    set invoices(invoices:any){
        this.invoiceData = invoices;
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
        }else {
          this.getHeaderColor(invoices.state);
        }

        this.getZoomSize();
    }
    bgColor:string="#878787";

    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private invoiceService: InvoicesService,private customerService: CustomersService,
                private numeralService:NumeralService,private dateFormater: DateFormater){
        this.serviceDateformat = dateFormater.getServiceDateformat();
        this.dateFormat = dateFormater.getFormat();
    }

    loadInvoiceData() {
        this.taskInvoices =  _.filter(this.invoiceData.invoiceLines, function(invoice) { return invoice.type == 'task'; });
        this.itemInvoices =  _.filter(this.invoiceData.invoiceLines, function(invoice) { return invoice.type == 'item'; });
    }

    loadCustomers(companyId: any) {
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
            }, error => {
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your customers");
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
        this.toastService.pop(TOAST_TYPE.error, "Failed to perform operation");
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
                this.bgColor="#00b1a9";
                break;
            case "paid":
                this.bgColor="#384986";
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

}
