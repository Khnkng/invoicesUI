/**
 * Created by seshagirivellanki on 13/02/17.
 */


import {Component,ViewChild} from "@angular/core";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {Session} from "qCommon/app/services/Session";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {InvoicesService} from "../services/Invoices.service";

declare let jQuery:any;
declare let _:any;

@Component({
    selector: 'itemcodes',
    templateUrl: '../views/itemCodes.html'
})

export class InvoicesComponent{
    invoices = [];
    hasInvoices: boolean = false;
    tableData:any = {};
    tableOptions:any = {};
    row:any;
    tableColumns:Array<string> = ['name', 'id', 'payment_coa_mapping', 'invoice_coa_mapping', 'desc'];

    constructor(private switchBoard: SwitchBoard,
                private toastService: ToastService, private loadingService:LoadingService,
                private invoiceService: InvoicesService){
        let companyId = Session.getCurrentCompany();
        this.invoiceService.invoices("unpaid").subscribe(invoices => {
            debugger;
            this.invoices = invoices;

        }, error => this.handleError(error));
    }

    handleError(error){
        this.row = {};
        this.toastService.pop(TOAST_TYPE.error, "Could not perform operation");
    }



    ngOnInit(){

    }

    handleAction($event){
        let action = $event.action;
        delete $event.action;
        delete $event.actions;
        if(action == 'edit') {

        } else if(action == 'delete'){
        }
    }


    buildTableData(invoices) {
        this.hasInvoices = false;
        this.invoices = invoices;
        this.tableData.rows = [];
        this.tableOptions.search = true;
        this.tableOptions.pageSize = 9;
        this.tableData.columns = [
            {"name": "name", "title": "Name"},
            {"name": "desc", "title": "Description"},
            {"name": "paymentCOAName", "title": "Payment COA"},
            {"name": "payment_coa_mapping", "title": "payment COA id", "visible": false},
            {"name": "invoiceCOAName", "title": "Invoice COA"},
            {"name": "invoice_coa_mapping", "title": "invoice COA id", "visible": false},
            {"name": "companyID", "title": "Company ID", "visible": false},
            {"name": "id", "title": "Id", "visible": false},
            {"name": "actions", "title": ""}
        ];
        let base = this;
        invoices.forEach(function(invoice) {
            let row:any = {};
            _.each(base.tableColumns, function(key) {
                row[key] = invoice[key];
                row['actions'] = "<a class='action' data-action='edit' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a><a class='action' data-action='delete' style='margin:0px 0px 0px 5px;'><i class='icon ion-trash-b'></i></a>";
            });
            base.tableData.rows.push(row);
        });
        setTimeout(function(){
            base.hasInvoices = true;
        }, 0)
    }

}
