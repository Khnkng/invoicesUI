/**
 * Created by seshu on 26-02-2016.
 */

import {Component,ViewChild} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {Session} from "qCommon/app/services/Session";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {CompaniesService} from "qCommon/app/services/Companies.service";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {InvoicesService} from "../services/Invoices.service";
import {CustomersService} from "qCommon/app/services/Customers.service";
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {StateService} from "qCommon/app/services/StateService";
import {State} from "qCommon/app/models/State";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {NumeralService} from "qCommon/app/services/Numeral.service";
import {ReportService} from "reportsUI/app/services/Reports.service";
import {Observable} from "rxjs/Rx";

declare let _:any;
declare let jQuery:any;
declare let moment:any;
declare let Highcharts: any;

@Component({
    selector: 'invoice-dashboard',
    templateUrl: '/app/views/invoiceDashboard.html',
})

export class InvoiceDashboardComponent {
    tabBackground: string = "#d45945";
    selectedTabColor: string = "#d45945";
    tabDisplay: Array<any> = [{'display': 'none'}, {'display': 'none'}, {'display': 'none'}, {'display': 'none'}];
    bgColors: Array<string> = [
        '#d45945',
        '#d47e47',
        '#2980b9',
        '#3dc36f'
    ];
    statesOrder:Array<string>=["draft","sent","opened","partially_Paid","paid"];

    proposalsTableData: any = {};
    proposalsTableOptions: any = {search: true, pageSize: 10};
    paidInvoiceTableData: any = {};
    paidInvoiceTableOptions: any = {search: true, pageSize: 10};
    invoiceTableData: any = {};
    invoiceTableOptions: any = {search: true, pageSize: 10, selectable: false};

    tabHeight: string;
    badges: any = [];
    selectedTab: any = 0;
    isLoading: boolean = true;
    localBadges: any = {};
    boxInfo;
    routeSub: any;
    hideBoxes: boolean = true;
    selectedColor: any = 'red-tab';
    hasInvoices: boolean = false;
    hasPaidInvoices: boolean = false;
    hasProposals: boolean = false;
    invoices: any;
    companyCurrency: string = 'USD';
    localeFortmat: string = 'en-US';
    customers: Array<any> = [];
    payments: Array<any> = [];
    actions:Array<any> = [];
    invoiceActions: Array<any> = [{
        'className': 'ion-edit',
        'name': 'Edit',
        'value': 'edit'
    },
        {'className': 'ion-ios-copy-outline',
            'name': 'Duplicate',
            'value': 'duplicate'
        }, {
            'className': 'ion-social-usd',
            'name': 'Mark as paid',
            'value': 'paid'
        }, {
            'className': 'ion-android-send',
            'name': 'Mark as sent',
            'value': 'sent'
        }, {'className': 'ion-ios-trash', 'name': 'Delete', 'value': 'delete'}];
    invoiceMultipleSelect: Array<any> = [ {
        'className': 'ion-android-send',
        'name': 'Mark as sent',
        'value': 'sent'
    }, {'className': 'ion-ios-trash','name': 'Delete', 'value': 'delete'}];
    paymentActions: Array<any> = [{
        'className': 'ion-edit',
        'name': 'Edit',
        'value': 'edit'
    }];
    selectedTableRows: Array<any> = [];
    @ViewChild('invoicesTable') invoicesTable;
    @ViewChild('paidTable') paidTable;
    @ViewChild('proposalsTable') proposalsTable;

    asOfDate: any;
    hasBoxData:boolean = false;
    reportRequest: any = {};
    currentFiscalStart: any;
    currentCompanyId: string;
    showDetailedChart: boolean = false;
    routeSubscribe: any = {};
    metrics: any = {};
    chartColors:Array<any> = ['#44B6E8','#18457B','#00B1A9','#F06459','#22B473','#384986','#4554A4','#808CC5'];

    detailedReportChartOptions:any;
    hasTotalReceivableData:boolean = false;
    groupedTotalReceivablesChartOptions: any;
    totalReceivablesChartOptions: any;
    hasAgingByCustomerData:boolean = false;
    agingByCustomer:any;
    hasARAgingSummaryData: boolean = false;
    customerAgingSummary:any;

    constructor(private _router: Router, private _route: ActivatedRoute,
                private toastService: ToastService, private loadingService: LoadingService,
                private companiesService: CompaniesService, private invoiceService: InvoicesService,
                private customerService: CustomersService, private titleService: pageTitleService,
                private stateService: StateService,private numeralService:NumeralService, private switchBoard:SwitchBoard,
                private reportService: ReportService) {
        this.currentCompanyId = Session.getCurrentCompany();
        this.loadCustomers(this.currentCompanyId);
        this.stateService.clearAllStates();
        let today = moment();
        let fiscalStartDate = moment(Session.getFiscalStartDate(), 'MM/DD/YYYY');
        this.currentFiscalStart = moment([today.get('year'),fiscalStartDate.get('month'),1]);
        if(today < fiscalStartDate){
            this.currentFiscalStart = moment([today.get('year')-1,fiscalStartDate.get('month'),1]);
        }
        this.currentFiscalStart = this.currentFiscalStart.format('MM/DD/YYYY');
        this.asOfDate = moment().format('MM/DD/YYYY');
        this.reportRequest = {
            "type": "aging",
            "companyID": this.currentCompanyId,
            "companyCurrency": this.companyCurrency,
            "asOfDate": this.asOfDate,
            "daysPerAgingPeriod": "30",
            "numberOfPeriods": "3",
        };
        this.routeSub = this._route.params.subscribe(params => {
            this.selectedTab = params['tabId'];
            this.selectTab(this.selectedTab, "");
            this.hasInvoices = false;
            this.hasPaidInvoices = false;
            this.companyCurrency = Session.getCurrentCompanyCurrency();
        });
        this.localBadges = JSON.parse(sessionStorage.getItem("localInvoicesBadges"));
        if (!this.localBadges) {
            this.localBadges = {proposal_count: 0, payment_count: 0, invoice_count: 0};
            sessionStorage.setItem('localInvoicesBadges', JSON.stringify(this.localBadges));
        } else {
            this.localBadges = JSON.parse(sessionStorage.getItem("localInvoicesBadges"));
        }
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            if(this.showDetailedChart){
                this.showDetailedChart = !this.showDetailedChart;
            }
        });
        this.getBadgesCount();
    }


    getBadgesCount(){
        this.invoiceService.getInvoicesCount().subscribe(badges => {
            sessionStorage.setItem("localInvoicesBadges", JSON.stringify(badges.badges));
            this.localBadges = JSON.parse(sessionStorage.getItem("localInvoicesBadges"));
        }, error => this.handleError(error));
    }


    addInvoiceDashboardState() {
        this.stateService.addState(new State('Invoices', this._router.url, null, this.selectedTab));
    }

    loadCustomers(companyId: any) {
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
            }, error => {
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
        jQuery({val: value / 2}).stop(true).animate({val: value}, {
            duration: 2000,
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
        this.selectedTab = tabNo;
        this.selectedColor = color;
        this.selectedTableRows = [];
        let base = this;
        this.addInvoiceDashboardState();
        this.loadingService.triggerLoadingEvent(true);
        this.tabDisplay.forEach(function (tab, index) {
            base.tabDisplay[index] = {'display': 'none'}
        });
        this.tabDisplay[tabNo] = {'display': 'block'};
        this.tabBackground = this.bgColors[tabNo];
        if (this.selectedTab == 0) {
            this.isLoading = true;
            this.loadingService.triggerLoadingEvent(true);
            this.getDashboardData();
            this.titleService.setPageTitle("Invoice Dashboard");
        } else if (this.selectedTab == 1) {
            this.isLoading = false;
            this.loadingService.triggerLoadingEvent(false);
            this.titleService.setPageTitle("Proposals");
        } else if (this.selectedTab == 2) {
            this.isLoading = false;
            this.titleService.setPageTitle("invoices");
            this.invoiceService.allInvoices().subscribe(invoices => {
                if (invoices.invoices) {
                    var sortedCollection = _.sortBy(invoices.invoices, function(item){
                        return base.statesOrder.indexOf(item.state);
                    });
                    this.buildInvoiceTableData(sortedCollection);
                } else {
                    this.closeLoading();
                }
            }, error => this.handleError(error));
        } else if (this.selectedTab == 3) {
            this.isLoading = false;
            this.titleService.setPageTitle("Payments");
            this.invoiceService.getPayments().subscribe(payments => {
                this.payments = payments;
                this.buildPaymentsTableData();
            }, error => this.handleError(error));
        }
    }

    getDashboardData(){
        let reportRequest = _.clone(this.reportRequest);
        reportRequest.startDate = this.currentFiscalStart;
        reportRequest.asOfDate = this.asOfDate;
        let boxData = this.invoiceService.getDashboardBoxData(this.currentCompanyId, this.currentFiscalStart, this.asOfDate);
        reportRequest.type = "cashFlowStatement";
        let cashFlowstatement = this.reportService.generateAccountReport(reportRequest, this.currentCompanyId);

        Observable.forkJoin(boxData, cashFlowstatement).subscribe(results => {
            this.hasBoxData = true;
            this.metrics["totalReceivable"] = this.formatAmount(results[0].totalReceivableAmount);
            this.metrics["totalPastDue"] = this.formatAmount(results[0].totalPastDueAmount);
            this.metrics["invoiceCount"] = this.numeralService.format('0', results[0].invoiceCount);
            this.metrics["openedInvoices"] = this.numeralService.format('0', results[0].openedInvoices);
            this.metrics["sentInvoices"] = this.numeralService.format('0', results[0].sentInvoices);
            this.metrics["totalReceivedLast30Days"] = this.formatAmount(results[0].totalReceivedLast30Days);
            this.metrics["cashBalance"] = this.formatAmount(results[1].cashAtEndOfPeriod || 0);
            this.loadingService.triggerLoadingEvent(false);
        }, error => {
            this.loadingService.triggerLoadingEvent(false);
            this.toastService.pop(TOAST_TYPE.error, "Failed to get box data");
        });
        this.getTotalReceivablesByCustomer();
        this.getAgingTotalReceivablesByCustomer();
        this.getCustomerAgingSummary();
    }

    getTotalReceivablesByCustomer(){
        let base = this;
        this.reportRequest.metricsType = 'totalReceivablesByCustomer';
        this.reportService.generateMetricReport(this.reportRequest, this.currentCompanyId)
            .subscribe(metricData => {
                this.hasTotalReceivableData = true;
                this.totalReceivablesChartOptions = {
                    colors: this.chartColors,
                    credits: {
                        enabled: false
                    },
                    legend: {
                        enabled: true
                    },
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie',
                        style: {
                            fontFamily: 'NiveauGroteskRegular'
                        }
                    },
                    title: {
                        text: 'Total Receivables By Customer',
                        style: {
                            color: '#878787',
                            fontFamily: 'NiveauGroteskLight',
                            fontSize:'24'
                        }
                    },
                    tooltip: {
                        pointFormatter: function(){
                            return '<b>Total: '+base.formatAmount(this.y)+'</b><b>('+base.getFormattedPercentage(this.percentage)+'%)</b>';
                        }
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: false
                            },
                            showInLegend: true
                        }
                    },
                    series: [{
                        colorByPoint: true,
                        data: base.getOpexData(metricData.data)
                    }]
                };
                this.groupedTotalReceivablesChartOptions = {
                    colors: this.chartColors,
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie',
                        style: {
                            fontFamily: 'NiveauGroteskRegular'
                        }
                    },
                    title: {
                        text: 'Total Receivables By Customer',
                        align:'left',
                        style: {
                            color: '#878787',
                            fontFamily: 'NiveauGroteskLight',
                            fontSize:'24'
                        }
                    },
                    subtitle: {
                        text: ''
                    },
                    credits: {
                        enabled: false
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        pointFormatter: function(){
                            return '<b>Total: '+base.formatAmount(this.y)+'</b><b>('+base.getFormattedPercentage(this.percentage)+'%)</b>';
                        }
                    },
                    pie: {
                        dataLabels: {
                            enabled: true,
                            inside: true,
                            formatter: function(){
                                return this.y;
                            },
                            distance: -40,
                            color: 'white'
                        },
                        showInLegend: true
                    },
                    series: [{
                        colorByPoint: true,
                        data: base.getOpexData(metricData.groupedData)
                    }]
                };
                this.loadingService.triggerLoadingEvent(false);
            }, error =>{
                this.loadingService.triggerLoadingEvent(false);
            });
    }

    showOtherCharts(type){
        this.showDetailedChart = true;
        if(type=='totalReceivablesChart'){
            this.detailedReportChartOptions = _.clone(this.totalReceivablesChartOptions);
            this.detailedReportChartOptions.legend = {enabled: true};
        } else if(type == 'agingByCustomer'){
            this.detailedReportChartOptions = _.clone(this.agingByCustomer);
            this.detailedReportChartOptions.legend = {enabled: true};
        } else if(type == 'customerAgingSummary'){
            this.detailedReportChartOptions = _.clone(this.customerAgingSummary);
        }
    }

    getOpexData(data){
        let result = [];
        _.each(data, function(valueObj){
            _.each(valueObj, function(value, key){
                result.push({
                    'name': key,
                    'y': value
                });
            });
        });
        return result;
    }

    getAgingTotalReceivablesByCustomer(){
        let base = this;
        this.reportRequest.metricsType = 'ageingtotalReceivablesByCustomer';
        this.reportService.generateMetricReport(this.reportRequest, this.currentCompanyId)
            .subscribe(metricData => {
                this.hasAgingByCustomerData = true;
                let columns = metricData.columns;
                let data = metricData.data;
                let keys=Object.keys(data);
                let series = [];
                for (let key of keys) {
                    if(key!='TOTAL') {
                        let customer = data[key];
                        let customerName = customer['CustomerName'];
                        delete customer['TOTAL'];
                        delete customer['type'];
                        let values = Object.values(customer);
                        values = this.removeCurrency(values);
                        series.push({
                            name : customerName,
                            data : values
                        });
                    }
                }
                this.agingByCustomer={
                    chart: {
                        type: 'bar',
                        marginRight: 50,
                        style: {
                            fontFamily: 'NiveauGroteskRegular'
                        }
                    },
                    title: {
                        text: 'Aging By Customer',
                        align: 'left',
                        style: {
                            color: '#878787',
                            fontFamily: 'NiveauGroteskLight',
                            fontSize:'24'
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        gridLineWidth: 0,
                        minorGridLineWidth: 0,
                        categories: columns
                    },
                    tooltip: {
                        headerFormat: '<b>{point.x}</b><br/>',
                        pointFormat: '<span style="color:{series.color}">{series.name}: ${point.y:,.2f}</span><br/>',
                        shared: true
                    },
                    yAxis: {
                        gridLineWidth: 0,
                        minorGridLineWidth: 0,
                        min: 0,
                        title: {
                            text: 'Payable Amount',
                            style: {
                                fontSize:'15px'
                            }
                        },

                        stackLabels: {
                            enabled: true,
                            formatter: function () {
                                return '$'+Highcharts.numberFormat(this.total,2);
                            },
                            style: {
                                fontSize:'13px',
                                fontWeight:'bold',
                                color:'#878787',
                                fill:'#878787'
                                // color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                            }
                        },
                        labels: {
                            style: {
                                fontSize:'13px',
                                fontWeight:'bold',
                                color:'#878787',
                                fill:'#878787'

                            }
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    plotOptions: {
                        enabled: true,
                        series: {
                            stacking: 'normal',
                            dataLabels: {
                                enabled: false,
                                format: '${y}',
                                fontSize:'13px',
                                color:'#878787',
                                fill:'#878787',
                                style: {
                                    fontSize:'13px'
                                },
                                // color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
                            }
                        },

                    },
                    series:series
                };
                this.loadingService.triggerLoadingEvent(false);
            }, error => {
                this.loadingService.triggerLoadingEvent(false);
            });
    }

    removeCurrency(values) {
        let _values = [];
        let base = this;
        values.forEach(function(value) {
            _values.push(base.numeralService.value(value));
        });
        return _values;
    }

    getCustomerAgingSummary(){
        let base = this;
        this.reportRequest.metricsType = 'customerAgingSummary';
        this.reportService.generateMetricReport(this.reportRequest, this.currentCompanyId)
            .subscribe(metricData => {
                this.hasARAgingSummaryData = true;
                let columns = metricData.columns;
                let data = metricData.data;
                let keys=Object.keys(data);
                let series = [];
                for (let key of keys) {
                    if(key=='TOTAL') {
                        let customer = data[key];
                        delete customer['CustomerName'];
                        let values = Object.values(customer);
                        let v=Object.keys(customer);
                        values = this.removeCurrency(values);
                        for(var i=0;i<values.length;i++){
                            series.push({
                                name : v[i],
                                y : values[i]
                            });
                        }
                    }
                }
                this.customerAgingSummary={
                    chart: {
                        type: 'column',
                        style: {
                            fontFamily: 'NiveauGroteskRegular'
                        }
                    },
                    title: {
                        text: 'AR Aging Summary',
                        align: 'left',
                        style: {
                            color: '#878787',
                            fontFamily: 'NiveauGroteskLight',
                            fontSize:'24'
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        type: 'category',
                        labels: {
                            style: {
                                fontSize:'13px',
                                fontWeight:'bold',
                                color:'#878787',
                                fill:'#878787'

                            }
                        }
                    },
                    yAxis: {
                        title: {
                            text: 'Receivable Amount',
                            style: {
                                fontSize:'15px'

                            }
                        },
                        labels: {
                            style: {
                                fontSize:'13px'

                            }
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    plotOptions: {
                        series: {
                            borderWidth: 0,
                            dataLabels: {
                                enabled: true,
                                formatter: function () {
                                    return '$'+Highcharts.numberFormat(this.y,2);
                                },
                                fontSize:'13px',
                                color:'#878787',
                                fill:'#878787',
                                style: {
                                    fontSize:'13px'
                                }
                            }
                        }
                    },
                    tooltip: {
                        pointFormat: '<span style="color:{point.color};font-size: 13px">TOTAL</span>: <b>${point.y:,.2f}</b><br/>',
                    },
                    series: [{
                        colorByPoint: true,
                        data: series
                    }],
                };
                this.loadingService.triggerLoadingEvent(false);
            }, error => {
                this.loadingService.triggerLoadingEvent(false);
            });
    }

    getFormattedPercentage(value){
        return this.numeralService.format("0,0.00", value);
    }

    formatAmount(amount){
        return this.numeralService.format("$0,0.00", amount);
    }

    closeLoading() {
        this.loadingService.triggerLoadingEvent(false);
    }

    removeInvoice() {
        let base = this;
        let selectedIds = _.map(this.selectedTableRows, 'id');
        this.invoiceService.deleteInvoice(selectedIds).subscribe(success => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice deleted successfully.");
                this.hasInvoices = false;
                this.selectTab(2, "");
            },
            error => {
                this.toastService.pop(TOAST_TYPE.error, "Invoice deletion failed.")
            });
    }

    invoiceMarkAsSent() {
        let base = this;
        let selectedIds = _.map(this.selectedTableRows, 'id');
        this.invoiceService.markAsSentInvoice(selectedIds).subscribe(success => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice mark as sent successfully.");
                this.hasInvoices = false;
                this.selectTab(2, "");
            },
            error => {
                this.toastService.pop(TOAST_TYPE.error, "Invoice mark as sent failed.")
            });
    }

    showPayment(){
        let link = ['payments/edit', this.selectedTableRows[0].id];
        this._router.navigate(link);
    }

    showInvoice(invoice) {
        let link = ['invoices/edit', invoice.id];
        this._router.navigate(link);
    }

    showDuplicate(invoice) {
        let link = ['invoices/duplicate', invoice.id];
        this._router.navigate(link);
    }

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Could not perform action.")
    }

    handleBadges(length, selectedTab) {
        if (selectedTab == 2) {
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

    updateTabHeight() {
        let base = this;
        let topOfDiv = jQuery('.tab-content').offset().top;
        topOfDiv = topOfDiv < 150 ? 150 : topOfDiv;
        let bottomOfVisibleWindow = Math.max(jQuery(document).height(), jQuery(window).height());
        base.tabHeight = (bottomOfVisibleWindow - topOfDiv - 25) + "px";
        jQuery('.tab-content').css('min-height', base.tabHeight);
        base.proposalsTableOptions.pageSize = Math.floor((bottomOfVisibleWindow - topOfDiv - 75) / 42) - 3;
        base.paidInvoiceTableOptions.pageSize = Math.floor((bottomOfVisibleWindow - topOfDiv - 75) / 62) - 3;
        base.invoiceTableOptions.pageSize = Math.floor((bottomOfVisibleWindow - topOfDiv - 75) / 42) - 3;
    }

    ngAfterViewInit() {
        let base = this;
        jQuery(document).ready(function () {
            base.updateTabHeight();
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }

    addNewInvoice() {
        let link = ['invoices/NewInvoice'];
        this._router.navigate(link);
    }

    addNewProposal() {
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
        this.invoiceTableData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {"name": "journalId", "title": "Journal ID", 'visible': false, 'filterable': false},
            {
                "name": "selectCol",
                "title": "<input type='checkbox' class='global-checkbox'>",
                "type": "html",
                "sortable": false,
                "filterable": false
            },
            {"name": "number", "title": "Number"},
            {"name": "customer", "title": "Customer"},
            {"name": "due_date", "title": "Due Date"},
            {
                "name": "amount", "title": "Invoice Amount", type: 'number', "formatter": (amount) => {
                amount = parseFloat(amount);
                return amount.toLocaleString(base.localeFortmat, {
                    style: 'currency',
                    currency: base.companyCurrency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            }
            },
            {
                "name": "amount_due", "title": "Due Amount", type: 'number', "formatter": (amount) => {
                amount = parseFloat(amount);
                return amount.toLocaleString(base.localeFortmat, {
                    style: 'currency',
                    currency: base.companyCurrency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            }
            },
            {"name": "status", "title": "Status"},
            {"name": "actions", "title": "", "type": "html", "sortable": false, "filterable": false}
        ];
        let base = this;
        invoices.forEach(function (invoice) {
            let row: any = {};
            row['id'] = invoice['id'];
            row['journalId'] = invoice['journalID'];
            row['selectCol'] = "<input type='checkbox' class='checkbox'/>";
            row['number'] = invoice['number'];
            row['customer'] = base.getCustomerName(invoice['customer_id']);
            row['due_date'] = invoice['due_date'];
            row['amount'] = invoice['amount'];
            row['amount_due'] = invoice['amount_due'];
            if(invoice['state']=='partially_Paid'){
                row['status']="Partially Paid"
            }else {
                row['status'] = invoice['state']?_.startCase((invoice['state'])):"";
            }

            if(invoice.journalID){
                row['actions'] = "<a class='action' data-action='navigation'><span class='icon badge je-badge'>JE</span></a>";
            }

            base.invoiceTableData.rows.push(row);
        });

        setTimeout(function () {
            base.hasInvoices = true;
        }, 0)
        this.loadingService.triggerLoadingEvent(false);
    }

    buildPaymentsTableData() {
        this.hasPaidInvoices = false;
        this.paidInvoiceTableData.rows = [];
        this.paidInvoiceTableData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {"name": "journalId", "title": "Journal ID", 'visible': false, 'filterable': false},
            {
                "name": "selectCol",
                "title": "<input type='checkbox' class='global-checkbox'>",
                "type": "html",
                "sortable": false,
                "filterable": false
            },
            {"name": "type", "title": "Payment type/#"},
            {"name": "receivedFrom", "title": "Received From"},
            {"name": "dateReceived", "title": "Date Received"},
            {"name": "amount", "title": "Amount/Status"},
            {"name": "actions", "title": "", "type": "html", "sortable": false, "filterable": false}
        ];

        let base = this;
        this.payments.forEach(function(payment) {
            let row:any = {};
            row['id'] = payment['id'];
            row['journalId'] = payment['journalID'];
            row['selectCol'] = "<input type='checkbox' class='checkbox'/>";
            let paymentType=payment.type=='cheque'?'Check':payment.type;
            row['type'] = "<div>"+paymentType+"</div><div><small>"+payment.referenceNo+"</small></div>";
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



            row['amount'] = "<div>"+base.numeralService.format("$0,0.00", payment.paymentAmount)+"</div><div>"+assignmentHtml+"</div>";
            if(payment.journalID){
                row['actions'] = "<a class='action' data-action='navigation'><span class='icon badge je-badge'>JE</span></a>";
            }
            base.paidInvoiceTableData.rows.push(row);
        });

        setTimeout(function(){
            base.hasPaidInvoices = true;
        }, 0)
        this.loadingService.triggerLoadingEvent(false);
    }

    /*buildPaidInvoiceTableData(invoices) {
     this.hasPaidInvoices = false;
     this.invoices = invoices;
     this.paidInvoiceTableData.rows = [];
     this.paidInvoiceTableOptions.search = true;
     this.paidInvoiceTableOptions.pageSize = 9;
     this.paidInvoiceTableData.columns = [
     {"name": "id", "title": "id", "visible": false},
     {"name": "number", "title": "Number"},
     {"name": "customer", "title": "Customer"},
     {"name": "due_date", "title": "Due Date"},
     {"name": "amount", "title": "Amount",type:'number',"formatter": (amount)=>{
     amount = parseFloat(amount);
     return amount.toLocaleString(base.localeFortmat, { style: 'currency', currency: base.companyCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
     }}/!*,
     {"name": "actions", "title": ""}*!/
     ];
     let base = this;
     invoices.forEach(function (invoice) {
     let row: any = {};
     row['id'] = invoice['id'];
     row['selectCol'] = "<input type='checkbox' class='checkbox'/>";
     row['selectCol'] = "<input type='checkbox' class='checkbox'/>";
     row['number'] = invoice['number'];
     row['customer'] = base.getCustomerName(invoice['customer_id']);
     row['due_date'] = invoice['due_date'];
     row['amount'] = invoice['amount'];
     /!*row['actions'] = "<a class='action' data-action='edit' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a><a class='action' data-action='delete' style='margin:0px 0px 0px 5px;'><i class='icon ion-trash-b'></i></a>";*!/
     base.paidInvoiceTableData.rows.push(row);
     });

     setTimeout(function () {
     base.hasPaidInvoices = true;
     }, 0)
     this.loadingService.triggerLoadingEvent(false);
     }*/

    getCustomerName(id) {
        let customer = _.find(this.customers, {'customer_id': id});
        return customer ? customer.customer_name : '';
    }

    updateOptions() {
        let base = this;
        switch (this.selectedTab) {
            case "2":
                if (this.selectedTableRows.length > 1) {
                    base.actions = base.invoiceMultipleSelect;
                }else{
                    base.actions = base.invoiceActions;
                }
                break;
            case "1":
                if (this.selectedTableRows.length > 1) {
                    base.actions = base.paymentActions;
                }else{
                    base.actions = base.paymentActions;
                }
                break;
            case "0":
                if (this.selectedTableRows.length > 1) {
                    base.actions = base.invoiceMultipleSelect;
                }else{
                    base.actions = base.invoiceActions;
                }
                break;
        }

    }

    handleAction($event){
        let action = $event.action;
        delete $event.action;
        delete $event.actions;
        if(action == 'navigation'){
            let link = ['journalEntry', $event.journalId];
            this._router.navigate(link);
        }
    }

    handleSelect(event: any) {
        let base = this;
        if (typeof  event !== "object") {
            this.selectedTableRows = [];
            this.updateDashboardTable(event);
        } else {
            this.handleRowSelect(event)
        }
    }

    getSelectedTabData() {
        if (this.selectedTab == "2") {
            return this.invoiceTableData;
        } else if (this.selectedTab == "1") {
            return this.paidInvoiceTableData;
        } else {
            return this.proposalsTableData;
        }
    }

    getNativeElement() {
        if (this.selectedTab == "2") {
            return this.invoicesTable.nativeElement;
        } else if (this.selectedTab == "1") {
            return this.paidTable.nativeElement;
        } else {
            return this.proposalsTable.nativeElement;
        }
    }

    updateTableData(tableData) {
        let base = this;
        if (this.selectedTab == "2") {
            this.invoiceTableData.rows = tableData.rows;
            this.invoiceTableData = _.clone(base.invoiceTableData);
        } else if (this.selectedTab == "1") {
            this.paidInvoiceTableData.rows = tableData.rows;
            this.paidInvoiceTableData = _.clone(base.paidInvoiceTableData);
        } else {
            this.paidInvoiceTableData.rows = tableData.rows;
            this.paidInvoiceTableData = _.clone(base.paidInvoiceTableData);
        }
    }

    updateDashboardTable(state) {
        let tableData = this.getSelectedTabData();
        if (state) {
            for (var i in tableData.rows) {
                tableData.rows[i].selectCol = "<input type='checkbox' checked  class='checkbox'/>";
                tableData.rows[i].tempIsSelected = true;
            }
            this.handleRowSelect(tableData.rows);
            tableData.columns[1].title = "<input type='checkbox' class='global-checkbox' checked>";
        } else {
            for (var i in tableData.rows) {
                tableData.rows[i].selectCol = "<input type='checkbox' class='checkbox'/>";
                tableData.rows[i].tempIsSelected = false;
            }
            this.handleRowSelect([]);
            tableData.columns[1].title = "<input type='checkbox' class='global-checkbox'>";
        }
        this.updateTableData(tableData);
    }

    handleRowSelect(selectedRows) {
        let base = this;
        let unCheckedRowsInPage = [];
        let selectedTable = this.getNativeElement();
        jQuery(selectedTable).find("tbody tr input.checkbox").each(function (idx, cbox) {
            let row = jQuery(cbox).closest('tr').data('__FooTableRow__');
            var obj = row.val();
            if (!jQuery(cbox).is(":checked")) {
                _.remove(base.selectedTableRows, {id: obj.id})
            }
        });
        _.each(selectedRows, function (invoices) {
            base.selectedTableRows.push(invoices);
        });
        this.selectedTableRows = _.uniqBy(this.selectedTableRows, 'id');
        _.remove(this.selectedTableRows, {'tempIsSelected': false});
        this.updateOptions();
    }


    handleInvoiceStateChange(action) {
        switch (action) {
            case 'edit':
                this.showInvoice(this.selectedTableRows[0]);
                break;
            case 'duplicate':
                this.showDuplicate(this.selectedTableRows[0]);
                break;
            case 'sent':
                this.invoiceMarkAsSent();
                break;
            case 'paid':
                let link = ['invoices',this.selectedTableRows[0].id];
                this._router.navigate(link);
                break;
            case 'delete':
                this.removeInvoice();
                break;
        }
    }
}

