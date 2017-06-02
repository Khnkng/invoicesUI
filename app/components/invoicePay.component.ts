
import {Component} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Session} from "qCommon/app/services/Session";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {InvoicesService} from "../services/Invoices.service";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {CodesService} from "qCommon/app/services/CodesService.service";
import {CompaniesService} from "qCommon/app/services/Companies.service";
import {InvoiceForm} from "../forms/Invoice.form";
import {FormGroup, FormBuilder, FormArray} from "@angular/forms";
import {InvoiceLineForm, InvoiceLineTaxesForm} from "../forms/InvoiceLine.form";

declare let _:any;
declare let numeral:any;
declare let jQuery:any;

@Component({
    selector: 'invoice-pay',
    templateUrl: '/app/views/invoicePay.html'
})

export class InvoicePayComponent{
    routeSub:any;
    invoiceID:string;
    newInvoice:boolean;
    invoiceForm: FormGroup;
    invoiceLineArray:FormArray = new FormArray([]);
    taxArray:Array<any> = [];
    itemCodes:any;
    taxesList:any;
    invoice:any;

    constructor(private _fb: FormBuilder, private _router:Router, private _route: ActivatedRoute, private loadingService: LoadingService,
                private invoiceService: InvoicesService, private toastService: ToastService, private codeService: CodesService, private companyService: CompaniesService,
                private _invoiceForm:InvoiceForm, private _invoiceLineForm:InvoiceLineForm, private _invoiceLineTaxesForm:InvoiceLineTaxesForm){

        let _form:any = this._invoiceForm.getForm();
        _form['invoiceLines'] = this.invoiceLineArray;
        this.invoiceForm = this._fb.group(_form);
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            this.loadInitialData();
        });
    }

    setupForm() {
        let base = this;
        this.invoiceService.getPaymentInvoice(this.invoiceID).subscribe(invoice=>{
            this.invoice = invoice;
            let _invoice = _.cloneDeep(invoice);
            delete _invoice.invoiceLines;
            _invoice.customer_name=_invoice.customer.customer_name;
            this._invoiceForm.updateForm(this.invoiceForm, _invoice);
            this.invoice.invoiceLines.forEach(function(invoiceLine:any){
                invoiceLine.name=invoiceLine.item.name;
                base.addInvoiceList(invoiceLine);
            });
            this.loadingService.triggerLoadingEvent(false);
        },error=>this.handleError(error));
    }

    loadInitialData() {
        this.loadingService.triggerLoadingEvent(true);
        this.setupForm();
    }

    addInvoiceList(line?:any) {
        let base = this;
        let _form:any = this._invoiceLineForm.getForm(line);
        let taxesLineArray:FormArray = new FormArray([]);

        _form['invoiceLineTaxes'] = taxesLineArray;
        let invoiceListForm = this._fb.group(_form);
        this.invoiceLineArray.push(invoiceListForm);
        this.taxArray.push(taxesLineArray);
        if(line && line.invoiceLineTaxes) {
            line.invoiceLineTaxes.forEach(function(taxLine){
                base.addTaxLine(base.taxArray.length-1, taxLine);
            });
        } else {
            this.addTaxLine(this.taxArray.length-1);
        }
    }

    addTaxLine(index, tax?:any) {
        let _form:any = this._invoiceLineTaxesForm.getForm(tax);
        let invoiceTaxForm = this._fb.group(_form);
        this.taxArray[index].push(invoiceTaxForm);
    }

    ngOnInit(){
    }

    calcLineTax(tax_rate, price, quantity) {
        if(tax_rate && price && quantity) {
            let priceVal = numeral(price).value();
            let quantityVal = numeral(quantity).value();
            return numeral((tax_rate * parseFloat(priceVal) * parseFloat(quantityVal))/100).format('$00.00');
        }
        return numeral(0).format('$00.00');
    }

    calcAmt(price, quantity){
        if(price && quantity) {
            let priceVal = numeral(price).value();
            let quantityVal = numeral(quantity).value();
            return numeral(parseFloat(priceVal) * parseFloat(quantityVal)).format('$00.00');
        }
        return numeral(0).format('$00.00');
    }

    calcSubTotal() {
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let subTotal = 0;
        let base = this;
        if(invoiceData.invoiceLines) {
            invoiceData.invoiceLines.forEach(function(invoiceLine){
                subTotal = subTotal + numeral(base.calcAmt(invoiceLine.price, invoiceLine.quantity)).value();
            });
        }
        return numeral(subTotal).format('$00.00');
    }

    calcTotal() {
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let total = 0;
        let base = this;

        if(invoiceData.invoiceLines) {
            invoiceData.invoiceLines.forEach(function (invoiceLine) {
                total = total + numeral(base.calcAmt(invoiceLine.price, invoiceLine.quantity)).value();

                if(invoiceLine.invoiceLineTaxes) {
                    invoiceLine.invoiceLineTaxes.forEach(function (tax) {
                        let taxAmt = numeral(base.calcLineTax(tax.tax_rate, 1, total)).value();
                        total = total - taxAmt;
                    });
                }
            });
        }
        return numeral(total).format('$00.00');
    }

    payInvoice(event){
        if(this.invoice.payment_spring_customer_id){
            let data={
                "amountToPay":this.invoice.amount,
                "action":"one_time_customer_charge ",
                "payment_spring_token":this.invoice.payment_spring_customer_id
            };
            this.invoiceService.payInvoice(data,this.invoiceID).subscribe(res => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice paid successfully");
            }, error=>{
                this.toastService.pop(TOAST_TYPE.error, "Invoice Payemnt failed");
            });
        }
    }

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this._toastService.pop(TOAST_TYPE.error, "Failed to perform operation");
    }
}