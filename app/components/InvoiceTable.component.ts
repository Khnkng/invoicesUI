/**
 * Created by Nagaraju Thota on 07-11-2017.
 */

import {Component, ViewChild} from "@angular/core";
import {Session} from "qCommon/app/services/Session";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {CompaniesService} from "qCommon/app/services/Companies.service";
import {Router,ActivatedRoute} from "@angular/router";
import {FTable} from "qCommon/app/directives/footable.directive";
import {StateService} from "qCommon/app/services/StateService";
import {State} from "qCommon/app/models/State";
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";

declare let jQuery:any;
declare let _:any;
declare let Highcharts:any;
declare let moment:any;

@Component({
    selector: 'invoices',
    templateUrl: '../views/invoiceTable.html'
})

export class InvoiceTableComponent {
    report:any={};
    tableData:any = {};
    tableOptions:any = {};
    companyCurrency:string;
    hasItemCodes: boolean = false;
    reportChartOptionsStacked:any;
    reportChartOptions:any;
    companyId:string;
    showFlyout:boolean = true;
    taxesList:any;
    tableColumns:Array<string> = ['bill_id','vendor_name','current_state','bill_date', 'due_date', 'amount'];
    todaysDate:any;
    reportasas:boolean= false;
    paymentcount:any;
    payable:boolean=false
    routeSub:any;
    currentpayment:any;
    receivedData:any;
    invoiceTabledata:any;
    credits:any;
    invoiceState:any;
    billstatus:boolean=false;
    @ViewChild('fooTableDir') fooTableDir:FTable;
    @ViewChild('createtaxes') createtaxes;
    routeSubscribe:any;

    constructor(private _router: Router,private _route: ActivatedRoute,private companyService: CompaniesService,
                private loadingService:LoadingService, private stateService: StateService,
                private titleService:pageTitleService,_switchBoard:SwitchBoard) {
        this.companyId = Session.getCurrentCompany();
        this.companyCurrency = Session.getCurrentCompanyCurrency();
        this.routeSub = this._route.params.subscribe(params => {
            this.currentpayment = params['invoiceTableID'];
            if(this.currentpayment=='receivables'){
                this.invoiceState='Receivables';
                //this.billstatus=true;
            } else if(this.currentpayment=='past_due'){
                this.invoiceState='Past Due';
                //this.billstatus=true;
            } else if(this.currentpayment=='opened'){
                this.invoiceState='Opened';
                //this.billstatus=true;
            } else if(this.currentpayment=='sent'){
                this.invoiceState='Sent';
                //this.billstatus=true;
            } else if(this.currentpayment=='recvdin30days'){
                this.invoiceState='Received Invoices';
                /*this.companyService.getReceivedInvoiceTable(this.companyId)
                    .subscribe(receivedData  => {
                        this.receivedData=receivedData;
                    }, error =>{
                        this.loadingService.triggerLoadingEvent(false);
                    });*/
                //this.billstatus=true;
            } else{
                console.log("error");
            }
            this.titleService.setPageTitle(this.invoiceState);
        });
        //this.loadingService.triggerLoadingEvent(true);
/*
        this.companyService.getReceivedInvoiceTable(this.companyId)
            .subscribe(receivedData  => {
                this.receivedData=receivedData;
                //console.log("this.paiddata",this.paiddata);
            }, error =>{
                this.loadingService.triggerLoadingEvent(false);
            });
*/

        this.companyService.getInvoiceTable(this.companyId,this.currentpayment)
            .subscribe(invoiceTabledata  => {
                this.invoiceTabledata=invoiceTabledata;
                this.companyService.credits(this.companyId)
                    .subscribe(credits => {
                        this.credits = credits;
                        this.buildTableData();
                    }, error => {
                        this.loadingService.triggerLoadingEvent(false);
                    });
            }, error =>{
                this.loadingService.triggerLoadingEvent(false);
            });
        this.routeSubscribe =  _switchBoard.onClickPrev.subscribe(title => this.hideFlyout());
    }

    handleAction($event){
        let action = $event.action;
        delete $event.action;
        delete $event.actions;
        if(action == 'edit') {
            this.stateService.addState(new State("PAYMENTS_TABLE", this._router.url, null, null));
            let link = ['payments/bill',Session.getCurrentCompany(),$event.bill_id, $event.current_state];
            this._router.navigate(link);
        }
    }

    hideFlyout(){
        let link = ['payments/dashboard','dashboard'];
        this._router.navigate(link);
    }

    buildTableData() {
        this.hasItemCodes = false;
        this.tableData.rows = [];
        this.tableOptions.search = true;
        this.tableOptions.pageSize = 9;
        this.tableData.columns = [
            {"name":"bill_id","title":"Bill ID" ,"visible": false},
            {"name": "vendor_name", "title": "Vendor Name"},
            {"name":"bill_date","title":"Bill Date"},
            {"name": "due_date", "title": "Due Date"},
            {"name":"current_state","title":"Current State"},
            {"name": "amount", "title": "Amount", "type":"number", "formatter": (amount)=>{
                amount = parseFloat(amount);
                return amount.toLocaleString(base.companyCurrency, { style: 'currency', currency: base.companyCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
            },"classes": "currency-align currency-padding"},
            {"name": "daysToPay", "title": "Days to Pay"},
            {"name": "actions", "title": ""}
        ];
        let base = this;
        this.invoiceTabledata.forEach(function(expense) {
            let row:any = {};
            _.each(base.tableColumns, function(key) {
                if(key == 'amount'){
                    let amount = parseFloat(expense[key]);
                    row[key] = {
                        'options': {
                            "classes": "currency-align"
                        },
                        value : amount.toFixed(2)
                    }
                }
                else {
                    row[key] = expense[key];
                }
                let currentDate=moment(new Date()).format("YYYY-MM-DD");
                let daysToPay =moment(expense['due_date'],"MM/DD/YYYY").diff(currentDate,'days');
                if(daysToPay<=0){
                    daysToPay='<span color="red" style="color: red">'+daysToPay+'</span>'
                }
                row['daysToPay']=daysToPay;
                row['actions'] = "<a class='action' data-action='edit' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a>";
            });
            base.tableData.rows.push(row);
        });
        this.credits.forEach(function(credit) {
            let row:any = {};
            let billAmount=credit['totalAmount']?credit['totalAmount']:0;
            let currency=credit['currency']?credit['currency']:'USD';
            row['bill_id'] = credit['customID'];
            row['bill_date'] = credit['creditDate'];
            row['vendor_name'] = credit['vendorName'];
            row['current_state'] = credit['current_state'];
            row['amount'] ={
                'options': {
                    "classes": "currency-align"
                },
                value : '-' + billAmount
            }
            row['actions'] = "<a class='action' data-action='creditPayment'><span class='icon badge je-badge'>JE</span></a><a class='action' data-action='Enter' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a><a class='action' data-action='delete' style='margin:0px 0px 0px 5px;'><i class='icon ion-trash-b'></i></a>";
            base.tableData.rows.push(row);
        });
        base.hasItemCodes = false;
        setTimeout(function(){
            base.hasItemCodes = true;
        }, 0)
        this.loadingService.triggerLoadingEvent(false);
    }

    ngOnDestroy(){
        this.routeSubscribe.unsubscribe();
    }

}

