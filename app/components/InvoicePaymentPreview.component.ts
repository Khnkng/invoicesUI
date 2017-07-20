
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
    @Input()
    set invoices(invoices:any){
        this.invoiceData = invoices;
        if(invoices.logoURL){
            this.logoURL = invoices.logoURL;
        }else{
            this.getCompanyLogo();
        }
        this.loadInvoiceData();
    }

    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private invoiceService: InvoicesService,private customerService: CustomersService){
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

}
