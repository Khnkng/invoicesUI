/**
 * Created by seshu on 26-02-2016.
 */

import {Component} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {Session} from "qCommon/app/services/Session";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {CompaniesService} from "qCommon/app/services/Companies.service";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {InvoicesService} from "../services/Invoices.service";
import {CustomersService} from "qCommon/app/services/Customers.service";

declare let _:any;
declare let jQuery:any;
declare let moment:any;

@Component({
    selector: 'invoice-dashboard',
    templateUrl: '/app/views/invoiceDashboard.html',
})

export class InvoiceDashboardComponent{
    tabBackground:string = "#d45945";
    selectedTabColor:string = "#d45945";
    tabDisplay:Array<any> = [{'display':'none'},{'display':'none'},{'display':'none'}];
    bgColors:Array<string>=[
        '#d45945',
        '#d47e47',
        '#2980b9',
        '#3dc36f'
    ];

    proposalsTableData:any = {};
    proposalsTableOptions:any = {search:false, pageSize:10};
    paidInvoiceTableData:any = {};
    piadInvoiceTableOptions:any = {search:false, pageSize:10};
    invoiceTableData:any = {};
    invoiceTableOptions:any = {search:false, pageSize:10};
    paidInvoiceTableOptions:any = {search:false, pageSize:10};

    tabHeight:string;
    badges:any = [];
    selectedTab:any=0;
    isLoading:boolean=true;
    localBadges:any={};
    boxInfo;
    routeSub:any;
    hideBoxes :boolean = true;
    selectedColor:any='red-tab';
    hasInvoices:boolean = false;
    hasPaidInvoices:boolean = false;
    hasProposals:boolean = false;
    invoices:any;
    companyCurrency:string='USD';
    localeFortmat:string='en-US';
    customers: Array<any> = [];
    payments: Array<any> = [];

    constructor(private _router:Router,private _route: ActivatedRoute,
                private toastService: ToastService, private loadingService:LoadingService,
                private companiesService: CompaniesService, private invoiceService: InvoicesService,
                private customerService: CustomersService) {

        this.routeSub = this._route.params.subscribe(params => {
            this.selectedTab=params['tabId'];
            this.selectTab(this.selectedTab,"");
            this.hasInvoices = false;
            this.companyCurrency=Session.getCurrentCompanyCurrency();
            this.loadCustomers(Session.getCurrentCompany());
        });
        this.localBadges=JSON.parse(sessionStorage.getItem("localInvoicesBadges"));
        if(!this.localBadges){
            this.localBadges = {proposal_count:0,invoice_unpaid:0,invoice_paid:0};
            sessionStorage.setItem('localInvoicesBadges', JSON.stringify(this.localBadges));
        } else{
            this.localBadges = JSON.parse(sessionStorage.getItem("localInvoicesBadges"));
        }
    }

    loadCustomers(companyId:any) {
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your customers");
                this.loadingService.triggerLoadingEvent(false);
            });
    }


    animateBoxInfo(boxInfo) {
        this.animateValue('payables', boxInfo.payables);
        this.animateValue('pastDue', boxInfo.pastDue);
        this.animateValue('dueToday', boxInfo.dueToday);
        this.animateValue('dueThisWeek', boxInfo.dueThisWeek);
    }

    animateValue(param, value) {
        let base = this;
        jQuery({val: value/2}).stop(true).animate({val: value}, {
            duration : 2000,
            easing: "easeOutExpo",
            step: function () {
                var _val = this.val;
                base.boxInfo[param] = Number(_val.toFixed(2));
            }
        }).promise().done(function () {
            base.boxInfo[param] = value;
        });
    }

    selectTab(tabNo, color) {
        this.selectedTab=tabNo;
        this.selectedColor=color;
        let base = this;
        this.loadingService.triggerLoadingEvent(true);
        this.tabDisplay.forEach(function(tab, index){
            base.tabDisplay[index] = {'display':'none'}
        });
        this.tabDisplay[tabNo] = {'display':'block'};
        this.tabBackground = this.bgColors[tabNo];
        if(this.selectedTab == 0){
            this.isLoading = false;
            this.loadingService.triggerLoadingEvent(false);
        } else if(this.selectedTab == 1){
            this.isLoading = false;
            this.invoiceService.getPayments().subscribe(payments => {
                this.payments = payments;
                this.buildPaymentsTableData();
            }, error => this.handleError(error));
        } else if(this.selectedTab == 2){
            this.isLoading = false;
            this.invoiceService.invoices('unpaid').subscribe(invoices => {
                if(invoices.invoices){
                    this.buildInvoiceTableData(invoices.invoices);
                    sessionStorage.setItem("localInvoicesBadges",JSON.stringify(invoices.badges));
                    this.localBadges=JSON.parse(sessionStorage.getItem("localInvoicesBadges"));
                }else {
                    this.closeLoading();
                }
            }, error => this.handleError(error));
        }
    }

    closeLoading(){
        this.loadingService.triggerLoadingEvent(false);
    }

    handleAction($event){
        let action = $event.action;
        delete $event.action;
        delete $event.actions;
        if(action == 'edit') {
            this.showInvoice($event);
        } else if(action == 'delete'){
            this.removeInvoice($event);
        }
    }

    handleProposalAction($event){
        let action = $event.action;
        delete $event.action;
        delete $event.actions;
        if(action == 'edit') {
            //Show proposal
        } else if(action == 'delete'){
            //delete proposal
        }
    }

    removeInvoice(invoice){
        let base = this;
        this.invoiceService.deleteInvoice(invoice.id).subscribe(success => {this.toastService.pop(TOAST_TYPE.success, "Invoice deleted successfully.");
                this.hasInvoices = false;
                this.selectTab(2,"");
        },
            error => {this.toastService.pop(TOAST_TYPE.error, "Invoice deletion failed.")});
    }

    showInvoice(invoice){
        let link = ['invoices/edit', invoice.id];
        this._router.navigate(link);
    }

    handleError(error){
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Could not perform action.")
    }

    handleBadges(length, selectedTab){
        if(selectedTab == 2){
            this.badges.invoices = length;
            this.localBadges['invoices'] = length;
            sessionStorage.setItem('localInvoicesBadges', JSON.stringify(this.localBadges));
        }
    }

    reRoutePage(tabId) {
        let link = ['invoices/dashboard', tabId];
        this._router.navigate(link);
    }

    ngOnInit() {

    }

    updateTabHeight(){
        let base = this;
        let topOfDiv = jQuery('.tab-content').offset().top;
        topOfDiv = topOfDiv<150? 170:topOfDiv;
        let bottomOfVisibleWindow = Math.max(jQuery(document).height(), jQuery(window).height());
        base.tabHeight = (bottomOfVisibleWindow - topOfDiv -25)+"px";
        jQuery('.tab-content').css('height', base.tabHeight);
        switch(this.selectedTab){
            case 0:
                base.proposalsTableOptions.pageSize = Math.floor((bottomOfVisibleWindow - topOfDiv - 75)/42)-3;
                break;
            case 1:
                base.piadInvoiceTableOptions.pageSize = Math.floor((bottomOfVisibleWindow - topOfDiv - 75)/42)-3;
                break;
            case 2:
                base.invoiceTableOptions.pageSize = Math.floor((bottomOfVisibleWindow - topOfDiv - 75)/42)-3;
                break;
        }
    }
    ngAfterViewInit() {
        let base = this;
        jQuery(document).ready(function() {
            base.updateTabHeight();
        });
    }

    ngOnDestroy(){
        this.routeSub.unsubscribe();
    }

    addNewInvoice(){
        let link = ['invoices/NewInvoice'];
        this._router.navigate(link);
    }

    addNewProposal(){
        let link = ['invoices/NewProposal'];
        this._router.navigate(link);
    }

    addNewPayment(){
        let link = ['invoices/addPayment'];
        this._router.navigate(link);
    }

    buildInvoiceTableData(invoices) {
        this.hasInvoices = false;
        this.invoices = invoices;
        this.invoiceTableData.rows = [];
        this.invoiceTableOptions.search = true;
        this.invoiceTableOptions.pageSize = 9;
        this.invoiceTableData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {"name": "number", "title": "Number"},
            {"name": "customer", "title": "Customer"},
            {"name": "payment_date", "title": "Due Date"},
            {"name": "amount", "title": "Invoice Amount",type:'number',"formatter": (amount)=>{
                amount = parseFloat(amount);
                return amount.toLocaleString(base.localeFortmat, { style: 'currency', currency: base.companyCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }},
            {"name": "amount_due", "title": "Due Amount",type:'number',"formatter": (amount)=>{
                amount = parseFloat(amount);
                return amount.toLocaleString(base.localeFortmat, { style: 'currency', currency: base.companyCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }},
            {"name": "status", "title": "Status"},
            {"name": "actions", "title": ""}
        ];
        let base = this;
        invoices.forEach(function(invoice) {
            let row:any = {};
            row['id'] = invoice['id'];
            row['number'] = invoice['number'];
            row['customer']=base.getCustomerName(invoice['customer_id']);
            row['payment_date'] = invoice['payment_date'];
            row['amount'] = invoice['amount'];
            row['amount_due'] = invoice['amount_due'];
            row['status'] = invoice['state'];
            row['actions'] = "<a class='action' data-action='edit' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a><a class='action' data-action='delete' style='margin:0px 0px 0px 5px;'><i class='icon ion-trash-b'></i></a>";
            base.invoiceTableData.rows.push(row);
        });

        setTimeout(function(){
            base.hasInvoices = true;
        }, 0)
        this.loadingService.triggerLoadingEvent(false);
    }

    buildPaymentsTableData() {
        this.hasPaidInvoices = false;
        this.paidInvoiceTableData.rows = [];
        this.paidInvoiceTableOptions.search = true;
        this.paidInvoiceTableOptions.pageSize = 9;
        this.paidInvoiceTableData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {"name": "type", "title": "Payment type/#"},
            {"name": "receivedFrom", "title": "Received From"},
            {"name": "dateReceived", "title": "Date Received"},
            {"name": "amount", "title": "Amount/Status"}
        ];

        let base = this;
        this.payments.forEach(function(payment) {
            let row:any = {};
            row['id'] = payment['id'];
            row['type'] = "<div>"+payment.type+"</div><div><small>"+payment.referenceNo+"</small></div>";
            row['receivedFrom'] = base.getCustomerName(payment.receivedFrom);
            row['dateReceived'] = payment.paymentDate;
            let assignStatus = "";
            let assignedAmount = 0;
            payment.paymentLines.forEach((line) => {
                assignedAmount += line.amount ? parseFloat(line.amount) : 0;
            });
            let assignmentHtml = "";

                if(assignedAmount >= payment.paymentAmount) {
                    assignStatus = "Assigned";
                    assignmentHtml = "<small style='color:#00B1A9'>"+assignStatus+"</small>"

                } else if(assignedAmount > 0) {
                    assignStatus = "Partially Assigned";
                    assignmentHtml = "<small style='color:#ff3219'>"+assignStatus+"</small>"
                } else {
                    assignStatus = "Unassigned";
                    assignmentHtml = "<small style='color:#ff3219'>"+assignStatus+"</small>"
                }



            row['amount'] = "<div>"+payment.paymentAmount+"</div><div>"+assignmentHtml+"</div>";
            base.paidInvoiceTableData.rows.push(row);
        });

        setTimeout(function(){
            base.hasPaidInvoices = true;
        }, 0)
        this.loadingService.triggerLoadingEvent(false);
    }

    buildPaidInvoiceTableData(invoices) {
        this.hasPaidInvoices = false;
        this.invoices = invoices;
        this.paidInvoiceTableData.rows = [];
        this.paidInvoiceTableOptions.search = true;
        this.paidInvoiceTableOptions.pageSize = 9;
        this.paidInvoiceTableData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {"name": "number", "title": "Number"},
            {"name": "customer", "title": "Customer"},
            {"name": "payment_date", "title": "Due Date"},
            {"name": "amount", "title": "Amount",type:'number',"formatter": (amount)=>{
                amount = parseFloat(amount);
                return amount.toLocaleString(base.localeFortmat, { style: 'currency', currency: base.companyCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }}/*,
            {"name": "actions", "title": ""}*/
        ];
        let base = this;
        invoices.forEach(function(invoice) {
            let row:any = {};
            row['id'] = invoice['id'];
            row['number'] = invoice['number'];
            row['customer']=base.getCustomerName(invoice['customer_id']);
            row['payment_date'] = invoice['payment_date'];
            row['amount'] = invoice['amount'];
            /*row['actions'] = "<a class='action' data-action='edit' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a><a class='action' data-action='delete' style='margin:0px 0px 0px 5px;'><i class='icon ion-trash-b'></i></a>";*/
            base.paidInvoiceTableData.rows.push(row);
        });

        setTimeout(function(){
            base.hasPaidInvoices = true;
        }, 0)
        this.loadingService.triggerLoadingEvent(false);
    }

    getCustomerName(id){
        let customer = _.find(this.customers, {'customer_id': id});
        return customer? customer.customer_name: '';
    }


}
