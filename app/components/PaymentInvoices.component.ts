import {Component} from "@angular/core";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {Session} from "qCommon/app/services/Session";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {InvoicesService} from "../services/Invoices.service";
import {Router,ActivatedRoute} from "@angular/router";
import {NumeralService} from "qCommon/app/services/Numeral.service";
import {StateService} from "qCommon/app/services/StateService";
import {State} from "qCommon/app/models/State";
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {CURRENCY_LOCALE_MAPPER} from "qCommon/app/constants/Currency.constants";
import {DateFormater} from "qCommon/app/services/DateFormatter.service";

declare let jQuery:any;
declare let _:any;

@Component({
  selector: 'payment-invoices',
  templateUrl: '../views/paymentInvoices.html',
})

export class PaymentInvoices{
  invoiceTableData:any = {};
  invoiceTableOptions: any = {search: true, pageSize: 10};
  currentCompany:any;
  companyCurrency:string;
  invoices:Array<any>=[];
  routeSub:any;
  localeFortmat:string='en-US';
  routeSubscribe:any;
  dateFormat:string;
  serviceDateformat:string;
  paymentID:string;
  hasInvoices:boolean;

  constructor(private switchBoard: SwitchBoard, private toastService: ToastService, private loadingService:LoadingService,
              private invoiceService:InvoicesService,private _router:Router, private _route: ActivatedRoute,
              private numeralService:NumeralService, private stateService: StateService,private titleService:pageTitleService,
              private dateFormater:DateFormater){
    this.titleService.setPageTitle("Invoices");
    let companyId = Session.getCurrentCompany();
    this.dateFormat = dateFormater.getFormat();
    this.serviceDateformat = dateFormater.getServiceDateformat();
    this.localeFortmat=CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]?CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]:'en-US';
    this.companyCurrency = Session.getCurrentCompanyCurrency();
    this.loadingService.triggerLoadingEvent(true);
    this.routeSub = this._route.params.subscribe(params => {
      if(params['paymentID']){
        this.paymentID=params['paymentID'];
        this.getInvoices();
      }
    });
    this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => this.goToPreviousPage());
  }

  ngOnDestroy(){
    this.routeSubscribe.unsubscribe();
  }

  handleError(error){
    this.loadingService.triggerLoadingEvent(false);
    this.toastService.pop(TOAST_TYPE.error, "Could not perform operation");
  }


  ngOnInit(){

  }

  getInvoices(){
    this.invoiceService.getPaymentInvoices(this.paymentID)
      .subscribe(invoices => {
        this.buildInvoiceTableData(invoices || []);
      }, error => this.handleError(error));
  }

  handleAction($event){
    let action = $event.action;
    if(action == 'edit') {
      this.addInvoiceState();
      let invoiceId= $event.id;
      let link = ['invoices/edit', invoiceId];
      this._router.navigate(link);
    }
  }

  buildInvoiceTableData(invoices) {
    this.invoices = invoices;
    this.invoiceTableData.defSearch = true;
    this.invoiceTableData.rows = [];
    this.invoiceTableData.columns = [
      {"name": "id", "title": "id", "visible": false},
      {"name": "number", "title": "Number"},
      {"name": "customer", "title": "Customer"},
      {"name": "invoice_date", "title": "Invoice Date"},
      {"name": "due_date", "title": "Due Date"},
      {"name": "amount", "title": "Invoice Amount"},
      {"name": "amount_due", "title": "Due Amount"},
      {"name": "status", "title": "Status"},
      {"name": "actions", "title": "", "type": "html", "sortable": false, "filterable": false}
    ];
    let base = this;
    invoices.forEach(function (invoice) {
      let row: any = {};
      invoice['currency']='USD';
      row['id'] = invoice['id'];
      row['number'] = invoice['number'];
      row['customer'] = invoice['customer_name'];
      row['invoice_date'] = (invoice['invoice_date']) ? base.dateFormater.formatDate(invoice['invoice_date'],base.serviceDateformat,base.dateFormat) : invoice['invoice_date'];
      row['due_date'] = (invoice['due_date']) ? base.dateFormater.formatDate(invoice['due_date'],base.serviceDateformat,base.dateFormat) : invoice['due_date'];
      let amount=invoice['amount']?Number(invoice['amount']):0;
      let amount_due=invoice['amount_due']?Number(invoice['amount_due']):0;
      row['amount'] = amount.toLocaleString(CURRENCY_LOCALE_MAPPER[invoice['currency']], { style: 'currency', currency: invoice['currency'], minimumFractionDigits: 2, maximumFractionDigits: 2 });
      row['amount_due'] = amount_due.toLocaleString(CURRENCY_LOCALE_MAPPER[invoice['currency']], { style: 'currency', currency: invoice['currency'], minimumFractionDigits: 2, maximumFractionDigits: 2 });;
      if(invoice['state']=='partially_Paid'){
        row['status']="Partially Paid"
      }else {
        row['status'] = invoice['state']?_.startCase((invoice['state'])):"";
      }
      row['actions']="<a class='action' data-action='edit' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a>";
      base.invoiceTableData.rows.push(row);
    });
    setTimeout(function () {
      base.hasInvoices = true;
    }, 0);
    this.loadingService.triggerLoadingEvent(false);
  }

  goToPreviousPage(){
    let link:any;
    if(this.stateService.getPrevState()){
      link=this.stateService.getPrevState().url;
      this.stateService.pop();
    }else {
      link=Session.getLastVisitedUrl();
    }
    this._router.navigate([link]);
  }

  addInvoiceState(){
       this.stateService.addState(new State("PAYMENT_INVOICES", this._router.url, null, null));
  }

}

