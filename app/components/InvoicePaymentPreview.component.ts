
import {Component} from "@angular/core";
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
    localeFortmat:string='en-US';
    routeSub:any;
    invoiceID:string;
    invoiceData:any;
    customers: Array<any> = [];
    taskInvoices: Array<any> = [];
    itemInvoices: Array<any> = [];
    hasInvoiceData: boolean = false;

    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private invoiceService: InvoicesService,private customerService: CustomersService){
        this.titleService.setPageTitle("Add Payment To Invoice");
        this.routeSub = this._route.params.subscribe(params => {
            //this.invoiceID=params['invoiceID'];
            this.invoiceID='88f194d9-6712-48d7-afc3-f2d6699fe8f9';
            this.loadInvoiceData();
            this.loadCustomers(Session.getCurrentCompany());
        });
    }

    loadInvoiceData() {
        let base = this;
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.getInvoice(this.invoiceID).subscribe(invoices=>{
            if(invoices) {
                base.hasInvoiceData = true;
                base.invoiceData = invoices;
                base.taskInvoices =  _.filter(invoices.invoiceLines, function(invoice) { return invoice.type == 'task'; });
                base.itemInvoices =  _.filter(invoices.invoiceLines, function(invoice) { return invoice.type == 'item'; });
            }
            this.loadingService.triggerLoadingEvent(false);
        },error=>this.handleError(error));
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

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Failed to perform operation");
    }

    ngOnDestroy(){
    }

    ngOnInit(){

    }

}
