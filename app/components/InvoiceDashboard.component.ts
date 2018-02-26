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
import {CURRENCY_LOCALE_MAPPER} from "qCommon/app/constants/Currency.constants";
import {DateFormater} from "qCommon/app/services/DateFormatter.service";

declare let _:any;
declare let jQuery:any;
declare let moment:any;
declare let Highcharts: any;

@Component({
    selector: 'invoice-dashboard',
    templateUrl: '../views/invoiceDashboard.html',
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
    reportCurrency: string = 'USD';
    localeFortmat: string = 'en-US';
    customers: Array<any> = [];
    payments: Array<any> = [];
    actions:Array<any> = [];
    historyFlyoutCSS:any;
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
    paidInvoiceActions:Array<any>=[{
        'className': 'ion-android-send',
        'name': 'View',
        'value': 'edit'

    }];
    draftInvoiceActions:Array<any>=[
        {
            'className': 'ion-edit',
            'name': 'Edit',
            'value': 'edit'
        },
        {'className': 'ion-ios-copy-outline',
            'name': 'Duplicate',
            'value': 'duplicate'
        }, {
            'className': 'ion-android-send',
            'name': 'Mark as sent',
            'value': 'sent'
        }, {'className': 'ion-ios-trash', 'name': 'Delete', 'value': 'delete'}
    ]
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
    historyList:Array<any>=[];
    count: any = 0;
    detailedReportChartOptions:any;
    hasTotalReceivableData:boolean = false;
    groupedTotalReceivablesChartOptions: any;
    totalReceivablesChartOptions: any;
    hasAgingByCustomerData:boolean = false;
    agingByCustomer:any;
    hasARAgingSummaryData: boolean = false;
    customerAgingSummary:any;
    dateFormat:string;
    serviceDateformat:string;
    invoicesTableColumns: Array<any> = ['Number', 'Customer','Invoice Date', 'Due Date', 'Invoice Amount', 'Due Amount', 'Status'];
    paymentsTableColumns: Array<any> = ['Payment type/#', 'Received From', 'Date Received', 'Amount/Status'];
    // proposalsTableColumns: Array<any> = ['Number', 'Customer', 'Due Date', 'Invoice Amount', 'Due Amount', 'Status'];
    pdfTableData: any = {"tableHeader": {"values": []}, "tableRows" : {"rows": []} };
    showDownloadIcon:string = "hidden";
    searchString: string;

    constructor(private _router: Router, private _route: ActivatedRoute,
                private toastService: ToastService, private loadingService: LoadingService,
                private companiesService: CompaniesService, private invoiceService: InvoicesService,
                private customerService: CustomersService, private titleService: pageTitleService,
                private stateService: StateService,private numeralService:NumeralService, private switchBoard:SwitchBoard,
                private reportService: ReportService, private dateFormater: DateFormater) {
        this.currentCompanyId = Session.getCurrentCompany();
        this.companyCurrency = Session.getCurrentCompanyCurrency();
        this.setReportCurrency();
        this.dateFormat = dateFormater.getFormat();
        this.serviceDateformat = dateFormater.getServiceDateformat();
        this.localeFortmat=CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]?CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]:'en-US';
        this.loadCustomers(this.currentCompanyId);
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
            this.hideFlyout();
            this.selectedTab = params['tabId'];
            this.selectTab(this.selectedTab, "");
            this.hasInvoices = false;
            this.hasPaidInvoices = false;
            this.showDownloadIcon = "hidden";
        });
        this.localBadges = JSON.parse(sessionStorage.getItem("localInvoicesBadges"));
        if (!this.localBadges) {
            this.localBadges = {proposal_count: 0, payment_count: 0, invoice_count: 0, unappliedPaymentsCount: 0};
            sessionStorage.setItem('localInvoicesBadges', JSON.stringify(this.localBadges));
        } else {
            this.localBadges = JSON.parse(sessionStorage.getItem("localInvoicesBadges"));
        }
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            if(this.historyFlyoutCSS == "expanded"){
                this.count = 0;
                this.hideFlyout();
            } else if(this.showDetailedChart){
                this.showDetailedChart = !this.showDetailedChart;
                this.detailedReportChartOptions.yAxis.title = {text: null,style: {fontSize:'15px'}};
            }
        });
        this.getBadgesCount();

        let prevState = this.stateService.pop();
        if(prevState){
            let data = prevState.data || {};
            this.searchString = data.searchString;
        }
        this.stateService.clearAllStates();
    }

    goToTools(key){
        if(key == 'unapplied'){
            this.stateService.addState(new State("INVOICE_DASHBOARD", this._router.url, null, null));
            let link = ['payments/unapplied'];
            this._router.navigate(link);
        }
    }

    setBookCurrency(){
        this.numeralService.switchLocale(this.companyCurrency);
    }

    setReportCurrency(){
        this.reportCurrency = Session.getCompanyReportCurrency()? Session.getCompanyReportCurrency(): this.companyCurrency;
        this.numeralService.switchLocale(this.reportCurrency);
    }

    setSearchString($event){
        this.searchString = $event;
    }

    addInvoiceState(){
        let data = {
            "searchString": this.searchString
        };
        this.stateService.addState(new State("INVOICE_DASHBOARD", this._router.url, data, null));
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
        let base = this;
        this.selectedTab = tabNo;
        this.selectedColor = color;
        this.selectedTableRows = [];
        this.addInvoiceDashboardState();
        this.loadingService.triggerLoadingEvent(true);
        this.tabDisplay.forEach(function (tab, index) {
            base.tabDisplay[index] = {'display': 'none'}
        });
        this.tabDisplay[tabNo] = {'display': 'block'};
        this.tabBackground = this.bgColors[tabNo];
        this.setBookCurrency();
        if (this.selectedTab == 0) {
            this.setReportCurrency();
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
                if (invoices) {
                    let sortedCollection = _.sortBy(invoices, function(item){
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
        reportRequest.type = "cashBalance";
        let cashBalance = this.reportService.generateAccountReport(reportRequest, this.currentCompanyId);

        Observable.forkJoin(boxData, cashBalance).subscribe(results => {
            this.hasBoxData = true;
            this.metrics["totalReceivable"] = this.formatAmount(results[0].totalReceivableAmount);
            this.metrics["totalPastDue"] = this.formatAmount(results[0].totalPastDueAmount);
            this.metrics["avgReceivableDays"] = this.numeralService.format('0', results[0].avgReceivableDays);
            this.metrics["openedInvoices"] = this.numeralService.format('0', results[0].openedInvoices);
            this.metrics["sentInvoices"] = this.numeralService.format('0', results[0].sentInvoices);
            this.metrics["totalReceivedLast30Days"] = this.formatAmount(results[0].totalReceivedLast30Days);
            this.metrics["cashBalance"] = this.formatAmount(results[1].cashBalance || 0);
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
            this.detailedReportChartOptions.yAxis.title = {text: 'Payable Amount',style: {fontSize:'15px'}};
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
                let series = [];
                _.each(data, function(value, key){
                    let array = [];
                    _.each(columns, function (column) {
                        array.push(value[column]);
                    });
                    let valueArray = base.removeCurrency(array);
                    series.push({
                        name: key,
                        data: valueArray
                    });
                });
                this.agingByCustomer={
                    colors: this.chartColors,
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
                        pointFormatter: function(){
                            return '<span style="color:'+this.series.color+'">'+this.series.name+': '+base.formatAmount(this.y)+'</span><br/>'
                        },
                        shared: true
                    },
                    yAxis: {
                        gridLineWidth: 0,
                        minorGridLineWidth: 0,
                        min: 0,
                        title: {
                            text: '',
                            style: {
                                fontSize:'15px'
                            }
                        },

                        stackLabels: {
                            enabled: true,
                            formatter: function () {
                                return base.formatAmount(this.total)
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
                                format: '{y}',
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

    unFormatAmount(amount){
        return this.numeralService.value(amount);
    }

    getCustomerAgingSummary(){
        let base = this;
        this.reportRequest.metricsType = 'customerAgingSummary';
        this.reportService.generateMetricReport(this.reportRequest, this.currentCompanyId)
            .subscribe(metricData => {
                this.hasARAgingSummaryData = true;
                let columns = metricData.columns;
                let data = metricData.data;
                let series = [];
                _.each(columns, function(column){
                    series.push({
                        name: column,
                        y: base.unFormatAmount(data[column])
                    });
                });
                this.customerAgingSummary={
                    colors: this.chartColors,
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
                            text: '',
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
                                    return base.formatAmount(this.y);
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
                        pointFormatter: function(){
                            return '<span style="color:'+this.series.color+'">'+this.series.name+': '+base.formatAmount(this.y)+'</span><br/>'
                        }
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
        let hasPaidInvoices=false;
        this.selectedTableRows.forEach(function (invoice) {
            if(invoice.status=='Paid'||invoice.status=='Partially Paid'){
                hasPaidInvoices=true;
            }
        });
        let selectedIds = _.map(this.selectedTableRows, 'id');
        if(!hasPaidInvoices){
            this.invoiceService.deleteInvoice(selectedIds).subscribe(success => {
                    this.toastService.pop(TOAST_TYPE.success, "Invoice deleted successfully.");
                    this.hasInvoices = false;
                    this.selectTab(2, "");
                },
                error => {
                    this.toastService.pop(TOAST_TYPE.error, "Invoice deletion failed.")
                });
        }else {
            this.toastService.pop(TOAST_TYPE.error, "cannot delete paid or partially paid invoices");
        }

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
                if(error&&JSON.parse(error))
                    this.toastService.pop(TOAST_TYPE.error, JSON.parse(error).message);
                else
                    this.toastService.pop(TOAST_TYPE.error, "Invoice mark as sent failed.")

            });
    }

    showPayment(){
        this.addInvoiceState();
        let link = ['payments/edit', this.selectedTableRows[0].id];
        this._router.navigate(link);
    }

    showInvoice(invoice) {
        this.addInvoiceState();
        let link = ['invoices/edit', invoice.id];
        this._router.navigate(link);
    }

    showDuplicate(invoice) {
        this.addInvoiceState();
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
        this.searchString = "";
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
        this.routeSubscribe.unsubscribe();
        this.setBookCurrency();
    }

    addNewInvoice() {
        this.addInvoiceState();
        let link = ['invoices/NewInvoice'];
        this._router.navigate(link);
    }

    addNewProposal() {
        this.addInvoiceState();
        let link = ['invoices/NewProposal'];
        this._router.navigate(link);
    }

    addNewPayment(){
        this.addInvoiceState();
        let link = ['invoices/addPayment'];
        this._router.navigate(link);
    }

    buildInvoiceTableData(invoices) {
        this.hasInvoices = false;
        this.invoices = invoices;
        this.invoiceTableData.defSearch = true;
        this.invoiceTableData.defSearchString = this.searchString;
        this.invoiceTableData.rows = [];
        this.invoiceTableData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {
                "name": "selectCol",
                "title": "<input type='checkbox' class='global-checkbox'>",
                "type": "html",
                "sortable": false,
                "filterable": false
            },
            {"name": "journalId", "title": "Journal ID", 'visible': false, 'filterable': false},
            {"name": "paymentId", "title": "Payment ID", 'visible': false, 'filterable': false},
            {"name": "number", "type": "html", "title": "Number"},
            {"name": "customer", "title": "Customer"},
            {"name": "invoice_date", "title": "Invoice Date"},
            {"name": "due_date", "title": "Due Date"},
            {
                "name": "amount", "title": "Invoice Amount"
            },
            {
                "name": "amount_due", "title": "Due Amount"
            },
            {"name": "status", "title": "Status"},
            {"name": "actions", "title": "", "type": "html", "sortable": false, "filterable": false}
        ];
        let base = this;
        invoices.forEach(function (invoice) {
            let row: any = {};
            row['id'] = invoice['id'];
            row['journalId'] = invoice['journalID'];
            row['paymentId'] = invoice['payment_ids'];
            row['selectCol'] = "<input type='checkbox' class='checkbox'/>";
            row['number'] = "<a class='actionOnId' data-action='viewInvoice'><span class='icon'>"+invoice['number']+"</span></a>";
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
            let paymentsString="";
            let historyBadge="<a class='action' data-action='history'><span class='icon badge je-badge'>H</span></a>";
            if(invoice['state']=='paid'||invoice['state']=='partially_paid'){
                if(invoice['payment_ids']){
                    let paymentsList=invoice['payment_ids'].split(',');
                    if(paymentsList.length>0){
                        if(paymentsList.length==1){
                            let paymentIdString='paymentAction-'+0;
                            paymentsString+="<a class='action' data-action="+paymentIdString+"><span class='icon badge je-badge'>P</span></a>"
                        }else {
                            for (var i = 0; i < paymentsList.length; i++) {
                                let paymentIdString='paymentAction-'+i;
                                paymentsString+="<a class='action' data-action="+paymentIdString+"><span class='icon badge je-badge'>P"+(i+1)+"</span></a>"
                            }
                        }
                    }
                }
            }
            let JeString="";
            if(invoice.journalID){
                JeString= "<a class='action' data-action='navigation'><span class='icon badge je-badge'>JE</span></a>";
            }
            let postString = "<a class='action' data-action='invoiceCollaboration'><span class='comment-badge'><i class='material-icons'>comment</i></span></a>";
            if(paymentsString&&JeString){
                row['actions']=historyBadge+paymentsString+JeString+postString;
            }else if(paymentsString){
                row['actions']=historyBadge+paymentsString+postString;
            }else if(JeString){
                row['actions']=historyBadge+JeString+postString;
            }else {
                row['actions']=historyBadge+postString;
            }
            base.invoiceTableData.rows.push(row);
        });

        setTimeout(function () {
            base.hasInvoices = true;
        }, 0);
        this.displayFooTableDropdown();
        this.loadingService.triggerLoadingEvent(false);
    }

    buildPaymentsTableData() {
        this.hasPaidInvoices = false;
        this.paidInvoiceTableData.defSearch = true;
        this.paidInvoiceTableData.defSearchString = this.searchString;
        this.paidInvoiceTableData.rows = [];
        this.paidInvoiceTableData.columns = [
            {"name": "id", "title": "id", "visible": false},
            {
                "name": "selectCol",
                "title": "<input type='checkbox' class='global-checkbox'>",
                "type": "html",
                "sortable": false,
                "filterable": false
            },
            {"name": "journalId", "title": "Journal ID", 'visible': false, 'filterable': false},
            {"name": "invoiceIds", "title": "Invoice ID", 'visible': false, 'filterable': false},
            {"name": "type", "title": "Payment type/#", "type": "html"},
            {"name": "receivedFrom", "title": "Received From"},
            {"name": "dateReceived", "title": "Date Received"},
            {"name": "amount", "title": "Amount/Status"},
            {"name": "payment_applied_amount", "title": "Applied Amount"},
            {"name": "actions", "title": "", "type": "html", "sortable": false, "filterable": false}
        ];

        let base = this;
        this.payments.forEach(function(payment) {
            let row:any = {};
            row['id'] = payment['id'];
            row['journalId'] = payment['journalID'];
            row['selectCol'] = "<input type='checkbox' class='checkbox'/>";
            let paymentType=payment.type=='cheque'?'Check':payment.type;
            // row['type'] = "<div>"+paymentType+"</div>";
            let type = (payment.referenceNo) ? (paymentType+'<br><small>'+payment.referenceNo+'</small>') : paymentType;
            /*if(payment.referenceNo){
              row['type'] += "<div><small>"+payment.referenceNo+"</small></div>";
            }*/
            row['type'] = "<a class='actionOnId' data-action='viewPayment'><span class='icon'>"+type+"</span></a>";
            row['receivedFrom'] = payment['customerName'];
            row['dateReceived'] = (payment['paymentDate']) ? base.dateFormater.formatDate(payment['paymentDate'],base.serviceDateformat,base.dateFormat) : payment['paymentDate'];
            let assignStatus = "";
            let assignedAmount = 0;
            let invoicesIds=[];
            payment.paymentLines.forEach((line) => {
                assignedAmount += line.amount ? parseFloat(line.amount) : 0;
                if(line.amount>0){
                    invoicesIds.push(line.invoiceId);
                }
            });
            let assignmentHtml = "";
            let invoicesString="";

            if(assignedAmount >= payment.paymentAmount) {
                assignStatus = "Assigned";
                assignmentHtml = "<small style='color:#00B1A9'>"+"Applied"+"</small>"

            } else if(assignedAmount > 0) {
                assignStatus = "Partially Assigned";
                assignmentHtml = "<small style='color:#ff3219'>"+"Partially Applied"+"</small>"
            } else {
                assignStatus = "Unassigned";
                assignmentHtml = "<small style='color:#ff3219'>"+"Not Applied"+"</small>"
            }
            row["invoiceIds"]=invoicesIds.toString();
            if(invoicesIds.length>0){
                if(invoicesIds.length==1){
                    let paymentIdString='invoiceAction-'+0;
                    invoicesString+="<a class='action' data-action="+paymentIdString+"><span class='icon badge je-badge'>I</span></a>"
                }else {
                    for (var i = 0; i < invoicesIds.length; i++) {
                        let paymentIdString='invoiceAction-'+i;
                        invoicesString+="<a class='action' data-action="+paymentIdString+"><span class='icon badge je-badge'>I"+(i+1)+"</span></a>"
                    }
                }
            }
            let JeString="";
            if(payment.journalID){
                JeString= "<a class='action' data-action='navigation'><span class='icon badge je-badge'>JE</span></a>";
            }
            let postString = "<a class='action' data-action='paymentsCollaboration'><span class='comment-badge'><i class='material-icons'>comment</i></span></a>";
            if(invoicesString&&JeString){
                row['actions']=invoicesString+JeString+postString;
            }else if(invoicesString){
                row['actions']=invoicesString+postString;
            }else if(JeString){
                row['actions']=JeString+postString;
            }
            base.numeralService.switchLocale(payment.currencyCode.toLowerCase());
            row['amount'] = "<div>"+base.numeralService.format("$0,0.00", payment.paymentAmount)+"</div><div>"+assignmentHtml+"</div>";
            row['payment_applied_amount'] = "<div>"+base.numeralService.format("$0,0.00", payment.payment_applied_amount)+"</div>";
            /*if(payment.journalID){
             row['actions'] = "<a class='action' data-action='navigation'><span class='icon badge je-badge'>JE</span></a>";
             }*/
            base.paidInvoiceTableData.rows.push(row);
        });

        setTimeout(function(){
            base.hasPaidInvoices = true;
        }, 0);
        this.displayFooTableDropdown();
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
        let selectedTab=this.selectedTab.toString();
        switch (selectedTab) {
            case "2":
                if (this.selectedTableRows.length > 1) {
                    base.actions = base.invoiceMultipleSelect;
                }else{
                    let invoice=this.selectedTableRows[0];
                    if(invoice&&invoice.status=='Paid'){
                        base.actions = base.paidInvoiceActions;
                    }else if(invoice&&invoice.status=='Draft'){
                        base.actions=base.draftInvoiceActions;
                    }else {
                        base.actions = base.invoiceActions;
                    }
                }
                break;
            case "3":
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
            this.addInvoiceState();
            let link = ['journalEntry', $event.journalId];
            this._router.navigate(link);
        }else if(action.indexOf("paymentAction")!=-1){
            this.addInvoiceState();
            let paymentIds=$event.paymentId.split(',');
            let paymentIdIndex=action.split('-')[1];
            let paymentId=paymentIds[paymentIdIndex];
            let link = ['payments/edit', paymentId];
            this._router.navigate(link);
        } else if(action=='history'){
            this.handleHistory($event);
        } else if(action.indexOf("invoiceAction")!=-1){
            this.addInvoiceState();
            let invoiceIds=$event.invoiceIds.split(',');
            let invoiceIdIndex=action.split('-')[1];
            let invoiceId=invoiceIds[invoiceIdIndex];
            let link = ['invoices/edit', invoiceId];
            this._router.navigate(link);
        } else if(action == 'invoiceCollaboration'){
            console.log($event);
            let link = ['collaboration', 'invoice', $event.id,];
            this._router.navigate(link);
        } else if(action == 'paymentsCollaboration'){
            console.log($event);
            let link = ['collaboration', 'payments', $event.id,];
            this._router.navigate(link);
        } else if(action == 'viewInvoice'){
            this.addInvoiceState();
            let invoiceId= $event.id;
            let link = ['invoices/edit', invoiceId];
            this._router.navigate(link);
        } else if(action == 'viewPayment'){
            this.addInvoiceState();
            let paymentId = $event.id;
            let link = ['payments/edit', paymentId];
            this._router.navigate(link);
        }
    }

    handleHistory(invoice){
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.history(invoice.id).subscribe(history => {
            this.historyFlyoutCSS="expanded";
            this.historyList=history;
            this.updateCredits(this.historyList);
            this.titleService.setPageTitle("Invoice History");
            this.loadingService.triggerLoadingEvent(false);
        }, error => {
            this.toastService.pop(TOAST_TYPE.error, "Failed to load invoice history");
            this.loadingService.triggerLoadingEvent(false);
        });
    }

    hideFlyout(){
        this.historyFlyoutCSS = "collapsed";
        if(this.selectedTab==2)
            this.titleService.setPageTitle("Invoices");
    }


    getCircleColor() {
        let colors = ["2px solid #44B6E8", "2px solid #18457B", "2px solid #00B1A9", "2px solid #F06459", "2px solid #22B473","2px solid #384986","2px solid #4554A4 "];
        if (this.count < 7) {
            this.count++;
            return colors[this.count - 1];
        } else {
            this.count = 0;
            return colors[this.count];
        }
    };


    updateCredits(credits) {
        for(var i in credits){
            credits[i]["color"] = this.getCircleColor();
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
        } else if (this.selectedTab == "3") {
            return this.paidInvoiceTableData;
        } else {
            return this.proposalsTableData;
        }
    }

    getNativeElement() {
        if (this.selectedTab == "2") {
            return this.invoicesTable.nativeElement;
        } else if (this.selectedTab == "3") {
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
        } else if (this.selectedTab == "3") {
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
        jQuery('#invoice-dropdown').foundation('close');
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

    getInvoicesTableData(inputData) {
        let tempData = _.cloneDeep(inputData);
        let newTableData: Array<any> = [];
        let tempJsonArray: any;

        for( var i in  tempData) {
            tempJsonArray = {};
            tempJsonArray["Number"] = tempData[i].number;
            tempJsonArray["Customer"] = tempData[i].customer;
            tempJsonArray["Invoice Date"] = tempData[i].invoice_date;
            tempJsonArray["Due Date"] = tempData[i].due_date;
            tempJsonArray["Invoice Amount"] = tempData[i].amount;
            tempJsonArray["Due Amount"] = tempData[i].amount_due;
            tempJsonArray["Status"] = tempData[i].status;

            newTableData.push(tempJsonArray);
        }

        return newTableData;
    }

    getPaymentsTableData() {
        let tempData = _.cloneDeep(this.payments);
        let newTableData: Array<any> = [];
        let tempJsonArray: any;

        for( var i in  tempData) {
            let paymentType=tempData[i].type=='cheque'?'Check':tempData[i].type;
            let paymentTypeString = paymentType.concat(' ','(', tempData[i].referenceNo,')');
            tempJsonArray = {};
            let assignStatus = "";
            let assignedAmount = 0;
            tempData[i].paymentLines.forEach((line) => {
                assignedAmount += line.amount ? parseFloat(line.amount) : 0;
            });

            if(assignedAmount >= tempData[i].paymentAmount) {
                assignStatus = "Assigned";
            } else if(assignedAmount > 0) {
                assignStatus = "Partially Assigned";
            } else {
                assignStatus = "Unassigned";
            }
            let amountOrStatus = this.numeralService.format("$0,0.00", tempData[i].paymentAmount).concat(' ', '(', assignStatus, ')');

            tempJsonArray["Payment type/#"] = paymentTypeString;
            tempJsonArray["Received From"] = tempData[i].customerName;
            tempJsonArray["Date Received"] = (tempData[i].paymentDate) ? this.dateFormater.formatDate(tempData[i].paymentDate,this.serviceDateformat,this.dateFormat) : tempData[i].paymentDate;
            tempJsonArray["Amount/Status"] = amountOrStatus;

            newTableData.push(tempJsonArray);
        }

        return newTableData;
    }

    buildPdfTabledata(tabId, fileType){
        this.pdfTableData['documentHeader'] = "Header";
        this.pdfTableData['documentFooter'] = "Footer";
        this.pdfTableData['fileType'] = fileType;
        this.pdfTableData['name'] = "Name";
        if(tabId == "invoices") {
            this.pdfTableData.tableHeader.values = this.invoicesTableColumns;
            this.pdfTableData.tableRows.rows = this.getInvoicesTableData(this.invoiceTableData.rows);
        }else if(tabId == "payments") {
            this.pdfTableData.tableHeader.values = this.paymentsTableColumns;
            this.pdfTableData.tableRows.rows = this.getPaymentsTableData();
        }
        // else if(tabId == "proposals") {
        //     this.pdfTableData.tableHeader.values = this.proposalsTableColumns;
        //     this.pdfTableData.tableRows.rows = this.getProposalsTableData(this.invoiceTableData.rows);
        // }
    }

    exportToExcel(tabId) {
        this.buildPdfTabledata(tabId, "excel");
        this.reportService.exportFooTableIntoFile(this.currentCompanyId, this.pdfTableData)
            .subscribe(data =>{
                let blob = new Blob([data._body], {type:"application/vnd.ms-excel"});
                let link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link['download'] = tabId+".xls";
                link.click();
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to Export table into Excel");
            });
        // jQuery('#example-dropdown').foundation('close');

    }

    exportToPDF(tabId) {
        this.buildPdfTabledata(tabId, "pdf");

        this.reportService.exportFooTableIntoFile(this.currentCompanyId, this.pdfTableData)
            .subscribe(data =>{
                var blob = new Blob([data._body], {type:"application/pdf"});
                var link = jQuery('<a></a>');
                link[0].href = URL.createObjectURL(blob);
                link[0].download = tabId+".pdf";
                link[0].click();
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to Export table into PDF");
            });

    }

    displayFooTableDropdown(){
        let base = this;
        setTimeout(function() {
            base.showDownloadIcon = "visible";
        },700);
    }

    receivablesClick(receivableclick){
        let link = ['invoice', receivableclick];
        this._router.navigate(link);
    }

    pastDueClick(pastDueclick){
        let link = ['invoice', pastDueclick];
        this._router.navigate(link);
    }

    openedInvoicesClick(openedInvClick){
        let link = ['invoice', openedInvClick];
        this._router.navigate(link);
    }

    sentInvoicesDueClick(sentInvClick){
        let link = ['invoice', sentInvClick];
        this._router.navigate(link);
    }

    receivedInvoicesClick(receivedInvClick){
        let link = ['invoice', receivedInvClick];
        this._router.navigate(link);
    }

}

