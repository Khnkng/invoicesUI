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

    constructor(private _fb: FormBuilder, private loadingService:LoadingService,
                private customerService:CustomersService,
                private toastService: ToastService, private invoiceService: InvoicesService,
                private _invoicePaymentForm:InvoicePaymentForm, private _router:Router,
                private numeralService:NumeralService, private _route: ActivatedRoute,
                private stateService: StateService,private switchBoard: SwitchBoard) {
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
    }

    gotoPreviousState() {
        let prevState = this.stateService.getPrevState();
        if (prevState) {
            this._router.navigate([prevState.url]);
        }
    }

    loadPayment() {
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.payment(this.paymentId).subscribe(payment => {
            this.payment = payment;
            let paymentFormValues:any = this.payment;
            this.paymentLines = this.payment.paymentLines;
            if(!paymentFormValues.memo) {
                paymentFormValues.memo = "";
            }
            if(!paymentFormValues.id) {
                paymentFormValues.id = "";
            }if(!paymentFormValues.paymentNote) {
                paymentFormValues.paymentNote = "";
            }
            delete paymentFormValues['paymentLines'];

            this.invoicePaymentForm.setValue(paymentFormValues);
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

    addPaymentLines(invoices) {
        this.paymentLines = [];
        invoices.forEach((invoice) => {
            let paymentLine:any = {};
            paymentLine.invoiceId = invoice.id;
            paymentLine.number = invoice.number;
            paymentLine.invoiceAmount = invoice.amount;
            paymentLine.amount = "";
            paymentLine.invoiceDate = invoice.invoice_date;
            let date:any = new Date(invoice.invoice_date);
            let termDays =  invoice.term ? parseInt(invoice.term.replace("net")) : 0;
            date.setDate(date + termDays);
            //paymentLine.dueDate =  termDays ? date.toString() : "";
            paymentLine.dueDate =  invoice.due_date;
            this.paymentLines.push(paymentLine);
        });
    }

    getAppliedText() {
        let appliedAmount:number = 0;
        this.paymentLines.forEach((line) => {
            appliedAmount += line.amount ? parseFloat(line.amount) : 0;
        })
        let text = this.numeralService.format("$0,0.00", appliedAmount);
        text += " of ";
        let paymentAmount = this.invoicePaymentForm.controls['paymentAmount'].value || 0;
        text += this.numeralService.format("$0,0.00", paymentAmount) +" applied";
        return text;
    }

    getOutstandingBalance() {
        let outstanding = 0;
        this.paymentLines.forEach((line) => {
            outstanding += line.invoiceAmount ? parseFloat(line.invoiceAmount) : 0;
        });
        return this.numeralService.format("$0,0.00", outstanding || 0);
    }

    gotoInvoice() {
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