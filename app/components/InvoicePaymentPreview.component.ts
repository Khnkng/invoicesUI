
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


declare let jQuery:any;
declare let _:any;
declare let moment:any;

@Component({
    selector: 'invoicePaymentPreview',
    templateUrl: '/app/views/invoicePaymentPreview.html',
})

export class InvoicePaymentPreview{
    invoiceID:string;
    customers: Array<any> = [];
    taskInvoices: Array<any> = [];
    itemInvoices: Array<any> = [];
    invoiceData:any;
    logoURL:string;
    termsList:any={"net30":"Net 30","net45":"Net 45","net60":"Net 60","net90":"Net 90","custom":"Custom"};
    invoiceStates:any={"draft":"Draft","paid":"Paid","partially_paid":"Partially Paid","past_due":"Past Due","sent":"Sent"};
    @Input()
    set invoices(invoices:any){
        invoices.displayterm=this.termsList[invoices.term];
        this.invoiceData = invoices;
        if(invoices.logoURL){
            this.logoURL = invoices.logoURL;
        }else{
            this.getCompanyLogo();
        }
        this.loadInvoiceData();
        this.getHeaderColor(invoices.state);
    }
    bgColor:string="#878787";

    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private invoiceService: InvoicesService,private customerService: CustomersService,
                private numeralService:NumeralService){
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
            this.logoURL = preference.temporaryURL;
        }
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
                this.bgColor="#07D4BE";
                break;
            case "paid":
                this.bgColor="#384986";
                break;
            default:
                this.bgColor="#07D4BE";
                break;
        }
    }

}
