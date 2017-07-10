
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
import {DateFormater} from "qCommon/app/services/DateFormatter.service";


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


    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private invoiceService: InvoicesService,private customerService: CustomersService,private dateFormater:DateFormater){
        this.titleService.setPageTitle("Add Payment To Invoice");
        this.dateFormat = dateFormater.getFormat();
        this.routeSub = this._route.params.subscribe(params => {
            //this.invoiceID=params['invoiceID'];
            this.invoiceID='88f194d9-6712-48d7-afc3-f2d6699fe8f9';
            this.loadInvoiceData();
        });
    }

    loadInvoiceData() {
        let base = this;
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.getInvoice(this.invoiceID).subscribe(invoices=>{
            if(invoices) {
                base.invoiceData = invoices;
                base.hasInvoiceData = true;
            }
            this.loadingService.triggerLoadingEvent(false);
        },error=>this.handleError(error));
    }

    setDueDate(date){
        console.log(date);
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
