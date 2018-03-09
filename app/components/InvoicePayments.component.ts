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
  selector: 'invoices-payments',
  templateUrl: '../views/invoicePayments.html',
})

export class InvoicePayments{
  paymentTableData:any = {};
  paymentTableOptions: any = {search: true, pageSize: 10};
  currentCompany:any;
  companyCurrency:string;
  payments:Array<any>=[];
  routeSub:any;
  localeFortmat:string='en-US';
  routeSubscribe:any;
  dateFormat:string;
  serviceDateformat:string;
  invoiceID:string;
  hasPayments:boolean;

  constructor(private switchBoard: SwitchBoard, private toastService: ToastService, private loadingService:LoadingService,
              private invoiceService:InvoicesService,private _router:Router, private _route: ActivatedRoute,
              private numeralService:NumeralService, private stateService: StateService,private titleService:pageTitleService,
              private dateFormater:DateFormater){
    this.titleService.setPageTitle("Payments");
    let companyId = Session.getCurrentCompany();
    this.dateFormat = dateFormater.getFormat();
    this.serviceDateformat = dateFormater.getServiceDateformat();
    this.localeFortmat=CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]?CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]:'en-US';
    this.companyCurrency = Session.getCurrentCompanyCurrency();
    this.loadingService.triggerLoadingEvent(true);
    this.routeSub = this._route.params.subscribe(params => {
      if(params['invoiceID']){
        this.invoiceID=params['invoiceID'];
        this.getPayments();
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

  getPayments(){
    this.invoiceService.getInvoicePayments(this.invoiceID)
      .subscribe(payments => {
        this.buildPaymentsTableData(payments || []);
      }, error => this.handleError(error));
  }

  handleAction($event){
    let action = $event.action;
    if(action == 'edit') {
      this.addInvoiceState();
      let paymentID= $event.id;
      let link = ['payments/edit', paymentID];
      this._router.navigate(link);
    }
  }

  buildPaymentsTableData(payments) {
    this.payments = payments;
    this.paymentTableData.defSearch = true;
    this.paymentTableData.rows = [];
    this.paymentTableData.columns = [
      {"name": "id", "title": "id", "visible": false},
      {"name": "type", "title": "Payment type/#"},
      {"name": "receivedFrom", "title": "Received From"},
      {"name": "dateReceived", "title": "Date Received"},
      {"name": "amount", "title": "Amount/Status"},
      {"name": "actions", "title": "", "type": "html", "sortable": false, "filterable": false}
    ];
    let base = this;
    payments.forEach(function (payment) {
      let row:any = {};
      row['id'] = payment['id'];
      let paymentType=payment.type=='cheque'?'Check':payment.type;
      row['type'] = "<div>"+paymentType+"</div><div><small>"+payment.referenceNo+"</small></div>";
      row['receivedFrom'] = payment['customerName'];
      row['dateReceived'] = (payment['paymentDate']) ? base.dateFormater.formatDate(payment['paymentDate'],base.serviceDateformat,base.dateFormat) : payment['paymentDate'];
      let assignmentHtml = "";
      if(payment['payment_status']=='Assigned') {
        assignmentHtml = "<small style='color:#00B1A9'>"+"Applied"+"</small>"
      } else if(payment['payment_status']=='Partially Applied') {
        assignmentHtml = "<small style='color:#ff3219'>"+"Partially Applied"+"</small>"
      } else if(payment['payment_status']=='Unapplied') {
        assignmentHtml = "<small style='color:#ff3219'>"+"Unapplied"+"</small>"
      }
      base.numeralService.switchLocale(payment.currencyCode.toLowerCase());
      row['amount'] = "<div>"+base.numeralService.format("$0,0.00", payment.paymentAmount)+"</div><div>"+assignmentHtml+"</div>";
      row['actions'] = "<a class='action' data-action='edit' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a>";
      base.paymentTableData.rows.push(row);
    });
    setTimeout(function () {
      base.hasPayments = true;
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
    this.stateService.addState(new State("INVOICE_PAYMENTS", this._router.url, null, null));
  }

}

