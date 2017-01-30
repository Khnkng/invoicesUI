
import {Component} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Session} from "qCommon/app/services/Session";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {InvoicesService} from "../services/Invoices.service";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {CustomersService} from "qCommon/app/services/Customers.service";

declare let _:any;
declare let jQuery:any;

@Component({
    selector: 'invoice',
    templateUrl: '/app/views/invoice.html'
})

export class InvoiceComponent{
    routeSub:any;
    invoiceID:string;
    newInvoice:boolean;
    preference:any = {};
    customers: Array<any> = [];

    constructor(private _router:Router, private _route: ActivatedRoute, private loadingService: LoadingService,
        private invoiceService: InvoicesService, private toastService: ToastService, private customerService: CustomersService){
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            if(!this.invoiceID){
                this.newInvoice = true;
            }
        });
    }

    ngOnInit(){
        let companyId = Session.getCurrentCompany();
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your customers");
            });
        this.invoiceService.getPreference(companyId)
            .subscribe(preference => {
                this.preference = preference;
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load Invoice settings.");
            });
        if(!this.newInvoice){
            //Fetch existing invoice
        }
    }

    setInvoiceDate(date){

    }

    setPaymentDate(date){

    }

    populateCustomers(){

    }
}