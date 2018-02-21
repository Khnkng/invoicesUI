import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {StateService} from "qCommon/app/services/StateService";
import {NumeralService} from "qCommon/app/services/Numeral.service";
import {InvoicesService} from "../services/Invoices.service";
import {Session} from "qCommon/app/services/Session";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {DateFormater} from "qCommon/app/services/DateFormatter.service";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {State} from "qCommon/app/models/State";

@Component({
    "selector": "unapplied-collections",
    "templateUrl": "../views/unappliedCollections.html"
})

export class UnappliedCollections{
    companyId: string;
    unappliedCollectionData: any = {};
    unappliedCollectionOptions: any = {search: true, pageSize: 10};
    searchString: string = "";
    hasPayments: boolean = false;
    dateFormat:string;
    serviceDateformat:string;
    routeSubscribe: any;

    constructor(private _router: Router, private stateService: StateService, private titleService: pageTitleService,
                private numeralService: NumeralService, private invoiceService: InvoicesService, private loadingService: LoadingService,
                private dateFormater: DateFormater, private switchBoard: SwitchBoard){
        this.titleService.setPageTitle("Unapplied Collecitons");
        this.companyId = Session.getCurrentCompany();
        this.dateFormat = dateFormater.getFormat();
        this.serviceDateformat = dateFormater.getServiceDateformat();
        this.getUnappliedCollections();
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            this.goToPreviousState();
        });
    }

    goToPreviousState(){
        let prevState = this.stateService.getPrevState();
        if(prevState){
            let link = [prevState.url];
            this._router.navigate(link);
        } else{
            let link = ['invoices/dashboard', 3];
            this._router.navigate(link);
        }
    }

    setSearchString(searchString){
        this.searchString = searchString;
    }

    getUnappliedCollections(){
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.getUnappliedCollections(this.companyId)
            .subscribe(collections => {
                this.loadingService.triggerLoadingEvent(false);
                this.buildPaymentsTableData(collections);
            }, error =>{
                this.loadingService.triggerLoadingEvent(false);
            });
    }

    buildPaymentsTableData(unappliedCollections) {
        this.hasPayments = false;
        this.unappliedCollectionData.defSearch = true;
        this.unappliedCollectionData.defSearchString = this.searchString;
        this.unappliedCollectionData.rows = [];
        this.unappliedCollectionData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {"name": "type", "title": "Payment type/#"},
            {"name": "receivedFrom", "title": "Received From"},
            {"name": "dateReceived", "title": "Date Received"},
            {"name": "amount", "title": "Amount"},
            {"name": "status", "title": "Status", "type": "html", "sortable": false, "filterable": false},
            {"name": "payment_applied_amount", "title": "Applied Amount"}
        ];
        let base = this;
        unappliedCollections.forEach(function(payment) {
            let row:any = {};
            row['id'] = payment['id'];
            let paymentType= payment.type =='cheque'?'Check':payment.type;
            row['type'] = "<div>"+paymentType+"</div>";
            if(payment.referenceNo){
                row['type'] += "<div><small>"+payment.referenceNo+"</small></div>";
            }
            row['receivedFrom'] = payment['customerName'];
            row['dateReceived'] = (payment['paymentDate']) ? base.dateFormater.formatDate(payment['paymentDate'],base.serviceDateformat, base.dateFormat) : payment['paymentDate'];
            let assignStatus = "";
            let assignmentHtml = "";
            if(row['payment_applied_amount'] >= payment.paymentAmount) {
                assignStatus = "Assigned";
                assignmentHtml = "<small style='color:#00B1A9'>"+"Applied"+"</small>"

            } else if(row['payment_applied_amount'] > 0) {
                assignStatus = "Partially Assigned";
                assignmentHtml = "<small style='color:#ff3219'>"+"Partially Applied"+"</small>"
            } else {
                assignStatus = "Unassigned";
                assignmentHtml = "<small style='color:#ff3219'>"+"Not Applied"+"</small>"
            }
            row['status'] = assignmentHtml;
            row['amount'] = "<div>"+base.numeralService.format("$0,0.00", payment.paymentAmount)+"</div>";
            row['payment_applied_amount'] = "<div>"+base.numeralService.format("$0,0.00", payment.payment_applied_amount)+"</div>";
            base.unappliedCollectionData.rows.push(row);
        });

        setTimeout(function(){
            base.hasPayments = true;
        }, 0);
        this.loadingService.triggerLoadingEvent(false);
    }

    handleAction(collection){
        this.stateService.addState(new State("UNAPPLIED_COLLECTIONS", this._router.url, null, null));
        let link = ['payments/edit', collection.id];
        this._router.navigate(link);
    }
}