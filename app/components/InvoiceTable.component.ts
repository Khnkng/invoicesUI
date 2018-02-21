/**
 * Created by Nagaraju Thota on 07-11-2017.
 */

import {Component, ViewChild} from "@angular/core";
import {Session} from "qCommon/app/services/Session";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {InvoicesService} from "../services/Invoices.service";
import {Router,ActivatedRoute} from "@angular/router";
import {FTable} from "qCommon/app/directives/footable.directive";
import {StateService} from "qCommon/app/services/StateService";
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {CURRENCY_LOCALE_MAPPER} from "qCommon/app/constants/Currency.constants";
import {DateFormater} from "qCommon/app/services/DateFormatter.service";
import {ReportService} from "reportsUI/app/services/Reports.service";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {State} from "qCommon/app/models/State";

declare let jQuery:any;
declare let _:any;
declare let moment:any;

@Component({
    selector: 'invoices',
    templateUrl: '../views/invoiceTable.html'
})

export class InvoiceTableComponent {
    tableData:any = {};
    tableOptions:any = {};
    companyCurrency:string;
    hasItemCodes: boolean = false;
    companyId:string;
    showFlyout:boolean = true;
    taxesList:any;
    routeSub:any;
    currentpayment:any;
    invoiceTabledata:any;
    invoiceState:any;
    @ViewChild('fooTableDir') fooTableDir:FTable;
    @ViewChild('createtaxes') createtaxes;
    routeSubscribe:any;
    dateFormat:string;
    serviceDateformat:string;
    pdfTableData: any = {"tableHeader": {"values": []}, "tableRows" : {"rows": []} };
    invoicesTableColumns: Array<any> = ["Number","Customer","Invoice Date","Due Date","Invoice Amount","Paid Amount","Due Amount"];

    constructor(private _router: Router,private _route: ActivatedRoute,private invoicesService: InvoicesService,
                private loadingService:LoadingService, private stateService: StateService,
                private titleService:pageTitleService,_switchBoard:SwitchBoard,private dateFormater: DateFormater,
                private reportService: ReportService,private _toastService: ToastService) {
        this.companyId = Session.getCurrentCompany();
        this.companyCurrency = Session.getCurrentCompanyCurrency();
        this.dateFormat = dateFormater.getFormat();
        this.serviceDateformat = dateFormater.getServiceDateformat();
        this.routeSub = this._route.params.subscribe(params => {
            this.currentpayment = params['invoiceTableID'];
            if(this.currentpayment=='receivables'){
                this.invoiceState='Receivables';
            } else if(this.currentpayment=='past_due'){
                this.invoiceState='Past Due';
            } else if(this.currentpayment=='opened'){
                this.invoiceState='Opened';
            } else if(this.currentpayment=='sent'){
                this.invoiceState='Sent';
            } else if(this.currentpayment=='recvdin30days'){
                this.invoiceState='Received Invoices';
            } else{
                console.log("error");
            }
            this.titleService.setPageTitle(this.invoiceState);
        });

        this.loadingService.triggerLoadingEvent(true);
        this.invoicesService.getInvoiceTable(this.companyId,this.currentpayment)
            .subscribe(invoiceTabledata  => {
                this.loadingService.triggerLoadingEvent(false);
                this.invoiceTabledata=invoiceTabledata;
                this.buildTableData();
            }, error =>{
                this.loadingService.triggerLoadingEvent(false);
            });
        this.routeSubscribe =  _switchBoard.onClickPrev.subscribe(title => this.hideFlyout());
    }

    hideFlyout(){
        let prevState = this.stateService.getPrevState();
        let link = ['invoices/dashboard','0'];
        if(prevState){
            this.stateService.pop();
            link = [prevState.url];
        }
        this._router.navigate(link);
    }

    buildTableData() {
        this.hasItemCodes = false;
        this.tableData.rows = [];
        this.tableOptions.search = true;
        this.tableOptions.pageSize = 9;
        this.tableData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {"name": "journalId", "title": "Journal ID", 'visible': false, 'filterable': false},
            {"name": "paymentId", "title": "Payment ID", 'visible': false, 'filterable': false},
            {"name": "number", "title": "Number"},
            {"name": "customer", "title": "Customer"},
            {"name": "invoice_date", "title": "Invoice Date"},
            {"name": "due_date", "title": "Due Date"},
            {"name": "amount", "title": "Invoice Amount"},
            {"name": "amount_paid", "title": "Paid Amount"},
            {"name": "amount_due", "title": "Due Amount"}
        ];
        let base = this;
        this.invoiceTabledata.forEach(function(invoice) {
            let row: any = {};
            row['id'] = invoice['id'];
            row['journalId'] = invoice['journalID'];
            row['paymentId'] = invoice['payment_ids'];
            row['selectCol'] = "<input type='checkbox' class='checkbox'/>";
            row['number'] = invoice['number'];
            row['customer'] = invoice['customer_name'];
            row['invoice_date'] = (invoice['invoice_date']) ? base.dateFormater.formatDate(invoice['invoice_date'],base.serviceDateformat,base.dateFormat) : invoice['invoice_date'];
            row['due_date'] = (invoice['due_date']) ? base.dateFormater.formatDate(invoice['due_date'],base.serviceDateformat,base.dateFormat) : invoice['due_date'];
            let amount=invoice['amount']?Number(invoice['amount']):0;
            let paid_amount=invoice['amount_paid']?Number(invoice['amount_paid']):0;
            let amount_due=invoice['amount_due']?Number(invoice['amount_due']):0;
            row['amount'] = amount.toLocaleString(CURRENCY_LOCALE_MAPPER[invoice['currency']], { style: 'currency', currency: invoice['currency'], minimumFractionDigits: 2, maximumFractionDigits: 2 });
            row['amount_paid'] = paid_amount.toLocaleString(CURRENCY_LOCALE_MAPPER[invoice['currency']], { style: 'currency', currency: invoice['currency'], minimumFractionDigits: 2, maximumFractionDigits: 2 });
            row['amount_due'] = amount_due.toLocaleString(CURRENCY_LOCALE_MAPPER[invoice['currency']], { style: 'currency', currency: invoice['currency'], minimumFractionDigits: 2, maximumFractionDigits: 2 });;
            base.tableData.rows.push(row);
        });
        base.hasItemCodes = false;
        setTimeout(function(){
            base.hasItemCodes = true;
        }, 0)
        this.loadingService.triggerLoadingEvent(false);
    }

    handleAction(invoice){
        this.stateService.addState(new State("RECEIVABLES", this._router.url, null, null, null));
        let link = ['invoices/edit/', invoice.id];
        this._router.navigate(link);
    }

    ngOnDestroy() {
      this.routeSubscribe.unsubscribe();
    }

    buildPdfTabledata(fileType){
        this.pdfTableData['documentHeader'] = "Header";
        this.pdfTableData['documentFooter'] = "Footer";
        this.pdfTableData['fileType'] = fileType;
        this.pdfTableData['name'] = "Name";

        this.pdfTableData.tableHeader.values = this.invoicesTableColumns;
        this.pdfTableData.tableRows.rows = this.getInvoicesTableData();
    }

    getInvoicesTableData() {
        let tempData = _.cloneDeep(this.tableData.rows);
        let newTableData: Array<any> = [];
        let tempJsonArray: any;

        for( var i in  tempData) {
            tempJsonArray = {};
            tempJsonArray["Number"] = tempData[i].number;
            tempJsonArray["Customer"] = tempData[i].customer;
            tempJsonArray["Invoice Date"] = tempData[i].invoice_date;
            tempJsonArray["Due Date"] = tempData[i].due_date;
            tempJsonArray["Invoice Amount"] = tempData[i].amount;
            tempJsonArray["Paid Amount"] = tempData[i].amount_paid;
            tempJsonArray["Due Amount"] = tempData[i].amount_due;
            newTableData.push(tempJsonArray);
        }
        return newTableData;
    }

    exportToExcel() {
        this.buildPdfTabledata("excel");
        this.reportService.exportFooTableIntoFile(this.companyId, this.pdfTableData)
            .subscribe(data =>{
                let blob = new Blob([data._body], {type:"application/vnd.ms-excel"});
                let link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link['download'] = "InvoicesDetails.xls";
                link.click();
            }, error =>{
                this._toastService.pop(TOAST_TYPE.error, "Failed to Export table into Excel");
            });
        // jQuery('#example-dropdown').foundation('close');

    }

    exportToPDF() {
        this.buildPdfTabledata("pdf");

        this.reportService.exportFooTableIntoFile(this.companyId, this.pdfTableData)
            .subscribe(data =>{
                var blob = new Blob([data._body], {type:"application/pdf"});
                var link = jQuery('<a></a>');
                link[0].href = URL.createObjectURL(blob);
                link[0].download = "InvoicesDetails.pdf";
                link[0].click();
            }, error =>{
                this._toastService.pop(TOAST_TYPE.error, "Failed to Export table into PDF");
            });

    }

}

