
import {Component} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Session} from "qCommon/app/services/Session";
import {LoadingService} from "qCommon/app/services/LoadingService";

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

    constructor(private _router:Router, private _route: ActivatedRoute, private loadingService: LoadingService){
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            if(!this.invoiceID){
                this.newInvoice = true;
            }
        });
    }

    ngOnInit(){
        let companyId = Session.getCurrentCompany();
        if(!this.newInvoice){
            //Fetch existing invoice
        }
    }
}