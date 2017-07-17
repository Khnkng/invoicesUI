
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
import {YEARS, MONTHS} from "qCommon/app/constants/Date.constants";
import {CreditCardType} from "qCommon/app/models/CreditCardType";
import {CustomersService} from "qCommon/app/services/Customers.service";
import {ReportService} from "reportsUI/app/services/Reports.service";
import {PAYMENTSPATHS} from "reportsUI/app/constants/payments.constants";

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
    invoiceForm: FormGroup;
    invoiceLineArray:FormArray = new FormArray([]);
    taxArray:Array<any> = [];
    invoice:any;
    isPaid:boolean;
    card_number:string;
    card_exp_month:string;
    card_exp_year:string;
    card_owner_name:string;
    csc:string;
    months:Array<string>=MONTHS;
    years:Array<string>=YEARS;
    publicKey:string;
    cards:Array<string>=[];
    paymentCard:string;
    hasInvoice:boolean=false;
    invoiceData:any;
    constructor(private _fb: FormBuilder, private _router:Router, private _route: ActivatedRoute, private loadingService: LoadingService,
                private invoiceService: InvoicesService, private toastService: ToastService, private codeService: CodesService, private companyService: CompaniesService,
                private _invoiceForm:InvoiceForm, private _invoiceLineForm:InvoiceLineForm, private _invoiceLineTaxesForm:InvoiceLineTaxesForm
                ,private customersService: CustomersService, private reportService: ReportService){

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
            if(invoice){
                if(invoice){
                    this.invoiceData=invoice;
                    this.hasInvoice=true;
                    this.card_exp_month="";
                    this.card_exp_year="";
                }

                this.invoice = invoice;
                if(this.invoice.state=='paid'){
                    this.isPaid=true;
                }
                if(invoice.payment_spring_customer_id){
                    this.getSavedOldCardDetails(invoice.company_id,invoice.payment_spring_customer_id)
                }
                /*let _invoice = _.cloneDeep(invoice);
                delete _invoice.invoiceLines;
                _invoice.customer_name=_invoice.customer.customer_name;
                this._invoiceForm.updateForm(this.invoiceForm, _invoice);
                this.invoice.invoiceLines.forEach(function(invoiceLine:any){
                    invoiceLine.name=invoiceLine.item.name;
                    base.addInvoiceList(invoiceLine);
                });*/
            }
            this.loadingService.triggerLoadingEvent(false);
        },error=>this.handleError(error));
    }

    loadInitialData() {
        this.loadingService.triggerLoadingEvent(true);
        this.setupForm();
    }

    /*addInvoiceList(line?:any) {
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
    }*/

    ngOnInit(){
    }

    /*calcLineTax(tax_rate, price, quantity) {
        if(tax_rate && price && quantity) {
            let priceVal = numeral(price).value();
            let quantityVal = numeral(quantity).value();
            return numeral((tax_rate * parseFloat(priceVal) * parseFloat(quantityVal))/100).format('$00.00');
        }
        return numeral(0).format('$00.00');
    }*/

    /*calcAmt(price, quantity){
        if(price && quantity) {
            let priceVal = numeral(price).value();
            let quantityVal = numeral(quantity).value();
            return numeral(parseFloat(priceVal) * parseFloat(quantityVal)).format('$00.00');
        }
        return numeral(0).format('$00.00');
    }*/

    /*calcSubTotal() {
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let subTotal = 0;
        let base = this;
        if(invoiceData.invoiceLines) {
            invoiceData.invoiceLines.forEach(function(invoiceLine){
                subTotal = subTotal + numeral(base.calcAmt(invoiceLine.price, invoiceLine.quantity)).value();
            });
        }
        return numeral(subTotal).format('$00.00');
    }*/

    /*calcTotal() {
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let total = 0;
        let base = this;

        if(invoiceData.invoiceLines) {
            invoiceData.invoiceLines.forEach(function (invoiceLine) {
                total = total + numeral(base.calcAmt(invoiceLine.price, invoiceLine.quantity)).value();

                if(invoiceLine.invoiceLineTaxes) {
                    invoiceLine.invoiceLineTaxes.forEach(function (tax) {
                        let taxAmt = numeral(base.calcLineTax(tax.tax_rate, 1, total)).value();
                        total = total + taxAmt;
                    });
                }
            });
        }
        return numeral(total).format('$00.00');
    }*/

    payInvoice(event){
            this.openCreditCardFlyout();
    }

    pay(action,paymentSpringToken){
       // this.loadingService.triggerLoadingEvent(true);
        let data={
            "amountToPay":this.invoice.amount,
            "action":action,
            "payment_spring_token":paymentSpringToken,
            "payment_type":"Credit Card"
        };
        this.invoiceService.payInvoice(data,this.invoiceID).subscribe(res => {
            this.loadingService.triggerLoadingEvent(false);
            this.resetCardFields();
            this.toastService.pop(TOAST_TYPE.success, "Invoice paid successfully");
            this.isPaid=true;
        }, error=>{
            this.loadingService.triggerLoadingEvent(false);
            this.resetCardFields();
            this.toastService.pop(TOAST_TYPE.error, "Invoice Payment failed");
        });
    }

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Failed to perform operation");
    }

    openCreditCardFlyout(){
        jQuery('#creditcard-details-conformation').foundation('open');
    }

    closeCreditCardFlyout(){
        this.resetCardFields();
        jQuery('#creditcard-details-conformation').foundation('close');
    }

    checkValidation(){
        if(this.card_number&&this.card_exp_month&&this.card_exp_year&&this.csc&&this.card_owner_name)
            return true;
        else return false;
    }

    getToken(){
        this.loadingService.triggerLoadingEvent(true);
        this.customersService.getPaymentSpringToken(this.invoice.company_id)
            .subscribe(res  => {
                if(!_.isEmpty(res)){
                    this.publicKey=res.public_key;
                    this.getCardTokenDetails();
                }else {
                    this.loadingService.triggerLoadingEvent(false);
                    this.toastService.pop(TOAST_TYPE.error, "Add company to payment spring");
                }
            }, error =>  this.handleError(error));
    }

    getCardTokenDetails(){
        let data={
            "card_number": this.card_number,
            "card_exp_month": this.card_exp_month,
            "card_exp_year": this.card_exp_year,
            "card_owner_name":this.card_owner_name,
            "csc":this.csc
        };
        this.customersService.getCreditCardToken(data,this.publicKey)
            .subscribe(res  => {
                this.pay("one_time_charge",res.id);
                this.closeCreditCardFlyout();
            }, error =>  {
                let err=JSON.parse(error);
                this.loadingService.triggerLoadingEvent(false);
                this.toastService.pop(TOAST_TYPE.error, err.errors[0].message);
            });
    }

     saveCard(){
        /* if(this.paymentCard=='newCard'){
             this.getToken();
         }else {
             this.closeCreditCardFlyout();
             this.pay("one_time_customer_charge",this.invoice.payment_spring_customer_id);
         }*/
         this.getToken();
     }


    ngOnDestroy(){
        this.routeSub.unsubscribe();
        jQuery('#creditcard-details-conformation').remove();
    }

    resetCardFields(){
            this.card_number=null;
            this.card_exp_month=null;
            this.card_exp_year=null;
            this.card_owner_name=null;
            this.csc=null;
            this.paymentCard=null;
    }

    getSavedOldCardDetails(companyID,springToken){
        this.customersService.getSavedCardDetails(companyID,springToken)
            .subscribe(res  => {
                if(res){
                    this.cards.push(this.invoice.customer.card_name+"(XXXX-XXXX-XXXX-"+res.last_4+")");
                }

            }, error =>  this.handleError(error));
    }

    downloadInvoice(){
        let html = jQuery('<div>').append(jQuery('style').clone()).append(jQuery('#payment-preview').clone()).html();
        let pdfReq={
            "version" : "1.1",
            "genericReport": {
                "payload": html
            }
        };
        this.reportService.exportReportIntoFile(PAYMENTSPATHS.PDF_SERVICE, pdfReq)
            .subscribe(data =>{
                var blob=new Blob([data._body], {type:"application/pdf"});
                var link= jQuery('<a></a>');
                link[0].href= URL.createObjectURL(blob);
                link[0].download= "Invoice.pdf";
                link[0].click();
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to Export report into PDF");
            });
    }

    printInvoice() {
        window.print();
    }

}