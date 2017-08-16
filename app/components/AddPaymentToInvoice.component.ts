import {Component} from "@angular/core";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {ToastService} from "qCommon/app/services/Toast.service";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {ActivatedRoute, Router} from "@angular/router";
import {InvoicesService} from "../services/Invoices.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {CustomersService} from "qCommon/app/services/Customers.service";
import {DateFormater} from "qCommon/app/services/DateFormatter.service";
import {StateService} from "qCommon/app/services/StateService";


declare let jQuery:any;
declare let _:any;
declare let moment:any;

@Component({
    selector: 'addInvoicePayment',
    templateUrl: '/app/views/addPaymentsToInvoice.html',
})

export class InvoiceAddPayment{
    localeFortmat:string='en-US';
    routeSub:any;
    invoiceID:string;
    invoiceData:any;
    hasInvoiceData: boolean = false;
    dateFormat:string;
    applyObject:any={'reference_number':'','invoice_date':'','payment_method':'cash','amount':''};
    paymentOptions:Array<any>=[{'name':'Cash','value':'cash'},{'name':'Credit/Debit','value':'card'},{'name':'Check','value':'cheque'},{'name':'PayPal','value':'paypal'},{'name':'ACH','value':'ach'}];
    routeSubscribe:any;



    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private stateService: StateService, private invoiceService: InvoicesService,private customerService: CustomersService,private dateFormater:DateFormater){
        this.titleService.setPageTitle("Add Payment To Invoice");
        this.dateFormat = dateFormater.getFormat();
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            this.loadInvoiceData();
        });
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            this.gotoPreviousState();
        });
    }

    gotoPreviousState() {
        let prevState = this.stateService.getPrevState();
        if (prevState) {
            this._router.navigate([prevState.url]);
        }
    }
    loadInvoiceData() {
        let base = this;
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.getInvoice(this.invoiceID).subscribe(invoices=>{
            if(invoices) {
                base.invoiceData = invoices;
                this.applyObject.reference_number = invoices.number;
                this.applyObject.invoice_date= invoices.invoice_date;
                base.hasInvoiceData = true;
            }
            this.loadingService.triggerLoadingEvent(false);
        },error=>this.handleError(error));
    }

    setPaymentMethod(paymentMethod){
        this.applyObject.payment_method = paymentMethod.target.value;
    }

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Failed to perform operation");
    }

    applyPayment(){
        console.log(this.applyObject);
        this.applyObject['state'] = 'paid';
        this.applyObject['currency'] = this.invoiceData.currency;
        this.applyObject['customer_id'] = this.invoiceData.customer_id;
        this.invoiceService.markAsPaid(this.applyObject,this.invoiceID).subscribe(success => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice paid successfully.");
                this.navigateToDashborad();
            },
            error => {
                this.toastService.pop(TOAST_TYPE.error, "Invoice payment failed.")
            });
    }

    navigateToDashborad(){
        let link = ['invoices/dashboard',2];
        this._router.navigate(link);
    }
    ngOnDestroy(){
        this.routeSubscribe.unsubscribe();
    }

    ngOnInit(){

    }

}
