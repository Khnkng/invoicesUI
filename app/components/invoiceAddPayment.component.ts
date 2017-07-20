/**
 * Created by seshagirivellanki on 06/07/17.
 */

import {Component} from "@angular/core";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {CustomersService} from "qCommon/app/services/Customers.service";
import {ToastService} from "qCommon/app/services/Toast.service";
import {NumeralService} from "qCommon/app/services/Numeral.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {Session} from "qCommon/app/services/Session";
import {InvoicesService} from "../services/Invoices.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {InvoicePaymentForm} from "../forms/invoicePayment.form";
import {ActivatedRoute, Router} from "@angular/router";
import {StateService} from "qCommon/app/services/StateService";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {FinancialAccountsService} from "qCommon/app/services/FinancialAccounts.service";
import {State} from "qCommon/app/models/State";

declare let _:any;
declare let numeral:any;
declare let jQuery:any;
declare let moment:any;

@Component({
    selector: 'invoice-payments',
    templateUrl: '/app/views/invoiceAddPayment.html'
})

export class InvoiceAddPaymentComponent {

    customers: Array<any> = [];
    invoices: Array<any> = [];
    invoicePaymentForm: FormGroup;
    paymentLines: Array<any> = [];
    type: string = 'cheque';
    showInvoices: boolean = false;
    currentClientName:string = "";
    currentLocale:string = "";
    routeSub:any;
    paymentId:string;
    payment:any;
    routeSubscribe:any;
    accounts: Array<any> = [];

    constructor(private _fb: FormBuilder, private loadingService:LoadingService,
                private customerService:CustomersService,
                private toastService: ToastService, private invoiceService: InvoicesService,
                private _invoicePaymentForm:InvoicePaymentForm, private _router:Router,
                private numeralService:NumeralService, private _route: ActivatedRoute,
                private stateService: StateService,private switchBoard: SwitchBoard,
                private accountsService: FinancialAccountsService) {
        this.loadCustomers(Session.getCurrentCompany());
        this.invoicePaymentForm = _fb.group(_invoicePaymentForm.getForm());
        this.routeSub = this._route.params.subscribe(params => {
            this.paymentId = params['paymentID'];
            if(this.paymentId) {
                this.loadPayment();
            }
        });
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            this.gotoPreviousState();
        });

        let previousState=this.stateService.getPrevState();
        if(previousState&&previousState.key=="New-Payment-Invoice"){
            this.invoicePaymentForm.setValue(previousState.data);
            this.loadInvoices();
            this.stateService.pop();
        };

        this.loadAccounts();
    }

    loadAccounts() {
        this.accountsService.financialAccounts(Session.getCurrentCompany())
            .subscribe(accounts=> {
                this.accounts = accounts.accounts;
            }, error => {

            });
    }

    gotoPreviousState() {
        /*let prevState = this.stateService.getPrevState();
         if (prevState) {
         this._router.navigate([prevState.url]);
         }*/
        let link = ['invoices/dashboard', 1];
        this._router.navigate(link);
    }

    loadPayment() {
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.payment(this.paymentId).subscribe(payment => {
            this.payment = payment;
            let paymentFormValues:any = _.clone(this.payment);

            if(!paymentFormValues.memo) {
                paymentFormValues.memo = "";
            }
            if(!paymentFormValues.id) {
                paymentFormValues.id = "";
            }
            if(!paymentFormValues.paymentNote) {
                paymentFormValues.paymentNote = "";
            }
            if(!paymentFormValues.depositedTo) {
                paymentFormValues.depositedTo = null;
            }
            delete paymentFormValues['paymentLines'];

            this.invoicePaymentForm.setValue(paymentFormValues);
            setTimeout(() => {
                this.loadInvoices();
            }, 50);
        })
    }

    loadCustomers(companyId:any) {
        this.loadingService.triggerLoadingEvent(true);
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
                this.closeLoader();
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your customers");
                this.closeLoader();
            });
    }

    loadInvoices() {
        let clientID = this.invoicePaymentForm.controls['receivedFrom'].value;
        this.invoiceService.invoicesByClientId(clientID).subscribe(invoices => {
            this.invoices = invoices;
            this.addPaymentLines(this.invoices);
            this.closeLoader();
        }, error => {
            this.handleError(error);
            this.closeLoader();
        });
    }

    setType(type) {
        this.type = type;
        this.invoicePaymentForm.controls['type'].setValue(type);
    }

    handleError(error){
        this.toastService.pop(TOAST_TYPE.error, "Could not perform operation");
    }

    closeLoader(){
        this.loadingService.triggerLoadingEvent(false);
    }

    setPaymentDate(date) {
        let paymentDateControl:any = this.invoicePaymentForm.controls['paymentDate'];
        paymentDateControl.setValue(date);
    }

    save() {
        let payment:any = this.invoicePaymentForm.value;
        payment.paymentLines = this.paymentLines;
        console.log("pament--", payment);
        this.invoiceService.addPayment(payment).subscribe(response => {
            this.toastService.pop(TOAST_TYPE.success, "Payment created successfully");
            let link = ['invoices/dashboard',1];
            this._router.navigate(link);
        }, error => {
            this.toastService.pop(TOAST_TYPE.error, "Failed to create payment");
        })
        this.invoicePaymentForm.reset();
        this.paymentLines = [];
    }

    setCustomerName() {
        this.loadInvoices();
        setTimeout(() => {
            let clientId = this.invoicePaymentForm.controls['receivedFrom'].value;
            if(clientId) {
                let customer = _.find(this.customers, function(customer) {
                    return customer.customer_id == clientId;
                });
                this.currentClientName = customer.customer_name;
            } else {
                this.currentClientName = "";
            }
        }, 100);
    }

    addPaymentLines(_invoices) {
        this.paymentLines = [];

        let invoices = _.sortBy(_invoices, function(_invoice) {
            return _invoice.amount_paid|| 0;
        }).reverse();
        invoices.forEach((invoice) => {

            let paymentLine:any = {};
            paymentLine.invoiceId = invoice.id;
            paymentLine.number = invoice.number;
            paymentLine.invoiceAmount = invoice.amount;
            paymentLine.amount = invoice.amount_paid || "";
            paymentLine.dueAmount = invoice.amount_due || "";
            paymentLine.invoiceDate = invoice.invoice_date;
            paymentLine.state = invoice.state;
            let date:any = new Date(invoice.invoice_date);
            let termDays =  invoice.term ? parseInt(invoice.term.replace("net")) : 0;
            date.setDate(date + termDays);
            //paymentLine.dueDate =  termDays ? date.toString() : "";
            paymentLine.dueDate =  invoice.due_date;
            if(!this.paymentId) {
                if(invoice.state != "paid" && invoice.state != "draft") {
                    this.paymentLines.push(paymentLine);
                }
            } else {
                let line =  _.find(this.payment.paymentLines, function(_line) {
                    return _line.invoiceId === invoice.id;
                });

                let appliedAmount = this.getAppliedAmount();
                let paymentAmount = parseFloat(this.invoicePaymentForm.controls['paymentAmount'].value) || 0;

                if(appliedAmount >= paymentAmount) {
                    if(line) {
                        this.paymentLines.push(paymentLine);
                    }
                } else if((invoice.state != "paid" && invoice.state != "draft") || line) {
                    this.paymentLines.push(paymentLine);
                }
            }
        });
    }

    getAppliedAmount() {
        let appliedAmount:number = 0;
        this.paymentLines.forEach((line) => {
            appliedAmount += line.amount ? parseFloat(line.amount) : 0;
        })
        return appliedAmount;
    }

    getAppliedText() {
        let appliedAmount:number = this.getAppliedAmount();
        let text = this.numeralService.format("$0,0.00", appliedAmount);
        text += " of ";
        let paymentAmount = this.invoicePaymentForm.controls['paymentAmount'].value || 0;
        text += this.numeralService.format("$0,0.00", paymentAmount) +" applied";
        return text;
    }

    getOutstandingBalance() {
        let outstanding = 0;
        this.paymentLines.forEach((line) => {
            outstanding += line.dueAmount ? parseFloat(line.dueAmount) : 0;
        });
        return this.numeralService.format("$0,0.00", outstanding || 0);
    }

    gotoInvoice() {
        let tempData=this.invoicePaymentForm.value;
        this.stateService.addState(new State('New-Payment-Invoice', this._router.url, tempData, null));
        let link = ['invoices/NewInvoice'];
        this._router.navigate(link);
    }

    setLocale() {
        this.currentLocale = this.invoicePaymentForm.controls['currencyCode'].value;
        this.numeralService.switchLocale(this.currentLocale)
    }

    ngAfterViewInit() {
        debugger;
        this.invoicePaymentForm.controls['type'].setValue("cheque");
        this.invoicePaymentForm.controls['currencyCode'].setValue("USD");
        this.numeralService.switchLocale("USD")
    }

    ngOnDestroy(){
        this.routeSubscribe.unsubscribe();
    }

}