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
import {CustomersService} from "qCommon/app/services/Customers.service";

declare let jQuery:any;
declare let _:any;
declare var moment:any;

@Component({
    selector: 'customer-activity',
    templateUrl: '../views/customerActivity.html',
})

export class CustomerActivityComponent{
    // currentCompany:any;
    companyCurrency:string;
    routeSub:any;
    localeFortmat:string='en-US';
    routeSubscribe:any;
    dateFormat:string;
    serviceDateformat:string;
    currentCustomer:string;
    currentCustomerId:string;
    customerActivityData: any;
    totalAmount:any;
    companyId:string;
    customersData: any;
    todaysDate:any;
    searchTerm:string;
    statusMessage = {'partially_paid' : 'Partially Paid', 'paid' : 'Paid', 'sent' : 'Sent', 'draft' : 'Draft', "past_due":"Past Due", 'Applied' : 'Applied'};
    hasCustomerDataLoaded: boolean = false;

    constructor(private switchBoard: SwitchBoard, private toastService: ToastService, private loadingService:LoadingService,
                private invoiceService:InvoicesService,private _router:Router, private _route: ActivatedRoute,
                private numeralService:NumeralService, private stateService: StateService,private titleService:pageTitleService,
                private dateFormater:DateFormater, private customersService: CustomersService){
        this.titleService.setPageTitle("Customer Activity");
        this.companyId = Session.getCurrentCompany();
        this.dateFormat = dateFormater.getFormat();
        this.serviceDateformat = dateFormater.getServiceDateformat();
        this.todaysDate = moment(new Date()).format('MM/DD/YYYY');
        this.searchTerm = 'As Of Today';
        console.log("Today's Date == ", this.todaysDate);
        this.localeFortmat=CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]?CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]:'en-US';
        this.companyCurrency = Session.getCurrentCompanyCurrency();
        this.routeSub = this._route.params.subscribe(params => {
            this.currentCustomerId = params['customerId'];
        });
        this.customersService.customers(this.companyId).subscribe(customers => {
            this.customersData = customers;
            this.currentCustomer = _.filter(this.customersData, {customer_id: this.currentCustomerId})[0].customer_name;
            console.log("Current Customers == ", this.currentCustomer);
        }, error => this.handleError(error));
        let data = {"asOfDate":this.todaysDate};
        this.getCustomerActivityData(data);
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            let link = ['customers'];
            this._router.navigate(link);
        });
    }

    getCustomerActivityData(data) {
        let base = this;
        this.invoiceService.getCustomersData(this.currentCustomerId, data).subscribe(customersData  => {
            this.customerActivityData = customersData.data;
            this.hasCustomerDataLoaded = true;
            console.log("CustomersData == ", customersData);
            this.customerActivityData.forEach(function (customer) {
                customer.date = base.dateFormater.formatDate(customer.date,base.serviceDateformat,base.dateFormat);
                customer.amount = parseFloat(customer.amount).toLocaleString(base.localeFortmat, { style: 'currency', currency: base.companyCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
                customer.dueAmount = parseFloat(customer.dueAmount).toLocaleString(base.localeFortmat, { style: 'currency', currency: base.companyCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
                if(customer.type === 'Invoice') {
                    customer.status = base.statusMessage[customer.status];
                }
            });
            this.totalAmount = parseFloat(customersData.total).toLocaleString(base.localeFortmat, { style: 'currency', currency: base.companyCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
            this.loadingService.triggerLoadingEvent(false);
        }, error =>  this.handleError(error));
    }

    ngOnDestroy(){
        // this.routeSubscribe.unsubscribe();
    }

    handleError(error){
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Could Not Perform Operation");
    }


    ngOnInit(){

    }

    getCurrentCustomerActivityData(customerName, searchItem) {
        this.loadingService.triggerLoadingEvent(true);

        if(searchItem) {
            this.setDates(searchItem);
        } else if(customerName) {
            this.currentCustomerId = _.filter(this.customersData, {customer_name: customerName})[0].customer_id;
            this.setDates(this.searchTerm);
        }
        console.log("Change Value == ", customerName);
        console.log("search term == ", this.searchTerm);
        console.log("Customer Id == ", this.currentCustomerId);
    }

    setDates(value) {
        // this.loadingService.triggerLoadingEvent(true);
        let data = {};
        if(value){
            switch(value){
                case "As Of Today":
                    data['asOfDate'] = this.todaysDate;
                    break;

                case "Last Month":
                    data['startDate'] = moment().subtract(1, 'months').startOf('month').format(this.serviceDateformat);
                    data['asOfDate'] = moment().subtract(1, 'months').endOf('month').format(this.serviceDateformat);
                    console.log("Start date == ", data['startDate']);
                    console.log("End date == ", data['asOfDate']);
                    break;

                case "Last 3 Months":
                    data['startDate'] = moment().subtract(3, 'months').startOf('month').format(this.serviceDateformat);
                    data['asOfDate'] = moment().subtract(3, 'months').endOf('month').format(this.serviceDateformat);
                    console.log("Start date == ", data['startDate']);
                    console.log("End date == ", data['asOfDate']);
                    break;

                case "Last 6 Months":
                    data['startDate'] = moment().subtract(6, 'months').startOf('month').format(this.serviceDateformat);
                    data['asOfDate'] = moment().subtract(6, 'months').endOf('month').format(this.serviceDateformat);
                    console.log("Start date == ", data['startDate']);
                    console.log("End date == ", data['asOfDate']);
                    break;

                case "Last Year":
                    data['startDate'] = moment().subtract(1, 'year').startOf('year').format(this.serviceDateformat);
                    data['asOfDate'] = moment().subtract(1, 'year').endOf('year').format(this.serviceDateformat);
                    console.log("Start date == ", data['startDate']);
                    console.log("End date == ", data['asOfDate']);
                    break;

                /*
                        case "Custom":
                          if(targetObj.startDate){
                            targetObj.startDate=moment(targetObj.startDate, this.dateFormat).format(this.dateFormat);
                          }
                          if(targetObj.asOfDate){
                            targetObj.asOfDate=moment(targetObj.asOfDate, this.dateFormat).format(this.dateFormat);
                          }
                          break;
                */
            }
            this.getCustomerActivityData(data);

        }
    }
    /*
      handleAction($event){
        let action = $event.action;
        if(action == 'edit') {
          let invoiceId= $event.id;
          let link = ['invoices/edit', invoiceId];
          this._router.navigate(link);
        }
      }
    */


}

