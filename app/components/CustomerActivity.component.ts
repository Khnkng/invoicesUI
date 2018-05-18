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
    dateFilter: any = {};
    filterObj:any = {};
    filters: Array<any> = [];

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

    getFormattedAmount(amount){
        return this.numeralService.format("$0,0.00", amount);
    }

    getCustomerActivityData(data, closePopup?) {
        let base = this;
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.getCustomersData(this.currentCustomerId, data).subscribe(customersData  => {
            this.loadingService.triggerLoadingEvent(false);
            this.customerActivityData = customersData.data;
            this.hasCustomerDataLoaded = true;
            this.customerActivityData.forEach(function (activity) {
                activity.date = base.dateFormater.formatDate(activity.date, base.serviceDateformat, base.dateFormat);
                activity.amount = base.getFormattedAmount(activity.amount);
                activity.dueAmount = base.getFormattedAmount(activity.dueAmount);
                if(activity.type === 'Invoice') {
                    activity.status = base.statusMessage[activity.status];
                }
            });
            this.totalAmount = base.getFormattedAmount(customersData.total);
            if(closePopup){
                this.closeReveal();
            }
        }, error =>  {
            this.loadingService.triggerLoadingEvent(false);
            this.handleError(error);
        });
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
    }

    setDates(value) {
        let data = {};
        if(value){
            switch(value){
                case "As Of Today":
                    data['asOfDate'] = this.todaysDate;
                    break;
                case "Last Month":
                    data['startDate'] = moment().subtract(1, 'months').startOf('month').format(this.serviceDateformat);
                    data['asOfDate'] = moment().subtract(1, 'months').endOf('month').format(this.serviceDateformat);
                    break;

                case "Last 3 Months":
                    data['startDate'] = moment().subtract(3, 'months').startOf('month').format(this.serviceDateformat);
                    data['asOfDate'] = moment().subtract(3, 'months').endOf('month').format(this.serviceDateformat);
                    break;

                case "Last 6 Months":
                    data['startDate'] = moment().subtract(6, 'months').startOf('month').format(this.serviceDateformat);
                    data['asOfDate'] = moment().subtract(6, 'months').endOf('month').format(this.serviceDateformat);
                    break;

                case "Last Year":
                    data['startDate'] = moment().subtract(1, 'year').startOf('year').format(this.serviceDateformat);
                    data['asOfDate'] = moment().subtract(1, 'year').endOf('year').format(this.serviceDateformat);
                    break;
            }
            this.getCustomerActivityData(data);
        }
    }

    setFilterDate($event, dateKey){
        this.dateFilter[dateKey] = this.dateFormater.formatDate($event, this.dateFormat, this.serviceDateformat);
    }

    applyFilters(){
        let data: any = {};
        data.filters = [];
        if(this.dateFilter.startDate){
            data['startDate'] = this.dateFilter.startDate;
        }
        if(this.dateFilter.asOfDate){
            data['asOfDate'] = this.dateFilter.asOfDate;
        } else{
            data['asOfDate'] = this.todaysDate;
        }

        if(this.filterObj.amountCondition != 'between' && this.filterObj.amount){
            data.filters.push({
                "filterName": "amount",
                "operator": this.filterObj.amountCondition,
                "values": [this.filterObj.amount]
            });
        }
        if(this.filterObj.amountCondition == 'between' && this.filterObj.lowerBound && this.filterObj.upperBound){
            data.filters.push({
                "filterName": "amount",
                "operator": "between",
                "values": [this.filterObj.lowerBound, this.filterObj.upperBound]
            });
        }
        if(this.filterObj.type && this.filterObj.type != 'All'){
            data.filters.push({
                "filterName": "type",
                "values": [this.filterObj.type]
            });
        }
        this.getCustomerActivityData(data, true);
    }

    setFilter(filterName, value){
        this.filterObj[filterName] = value;
    }

    closeReveal(){
        this.dateFilter = {};
        this.filterObj = {};
        jQuery('#filter-reveal').foundation('close');
    }
}

