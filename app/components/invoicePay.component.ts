
import {Component} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {Session} from "qCommon/app/services/Session";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {InvoicesService} from "../services/Invoices.service";
import {ToastService} from "qCommon/app/services/Toast.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {CustomersService} from "qCommon/app/services/Customers.service";
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
    preference:any = {};
    customers: Array<any> = [];
    invoiceForm: FormGroup;
    invoiceLineArray:FormArray = new FormArray([]);
    taxArray:Array<any> = [];
    itemCodes:any;
    taxesList:any;
    invoice:any;

    constructor(private _fb: FormBuilder, private _router:Router, private _route: ActivatedRoute, private loadingService: LoadingService,
                private invoiceService: InvoicesService, private toastService: ToastService, private codeService: CodesService, private companyService: CompaniesService,
                private customerService: CustomersService, private _invoiceForm:InvoiceForm, private _invoiceLineForm:InvoiceLineForm, private _invoiceLineTaxesForm:InvoiceLineTaxesForm){

        let _form:any = this._invoiceForm.getForm();
        _form['invoiceLines'] = this.invoiceLineArray;
        this.invoiceForm = this._fb.group(_form);
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            this.loadInitialData();
        });


    }

    loadCustomers(companyId:any) {
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
                this.loadItemCodes(companyId);
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your customers");
            });
    }

    loadItemCodes(companyId:any) {
        this.codeService.itemCodes(companyId)
            .subscribe(itemCodes => {
                this.itemCodes = itemCodes;
                this.loadTaxList(companyId);
            });
    }

    loadTaxList(companyId:any) {
        this.companyService.getTaxofCompany(companyId)
            .subscribe(taxesList  => {
                this.taxesList=taxesList;
                this.setupForm();
            });
    }

    setupForm() {
        let base = this;
        if(!this.invoiceID){
            this.newInvoice = true;
            this.addInvoiceList();

        } else {
            this.invoiceService.getPaymentInvoice(this.invoiceID).subscribe(invoice=>{
                this.invoice = invoice;
                let _invoice = _.cloneDeep(invoice);
                delete _invoice.invoiceLines;
                _invoice.customer_name=_invoice.customer.customer_name;
                this._invoiceForm.updateForm(this.invoiceForm, _invoice);
                this.invoice.invoiceLines.forEach(function(invoiceLine:any){
                    base.addInvoiceList(invoiceLine);
                });
                /*this.invoice.invoiceLines.forEach(function (invoiceLine:any) {
                 this.addInvoiceList(invoiceLine);
                 });*/
            });
        }
    }



    loadInitialData() {
        let companyId = Session.getCurrentCompany();
        this.setupForm();
        //this.loadCustomers(companyId);
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

    deleteInvoiceLine(index) {

        this.invoiceLineArray.removeAt(index);
        this.taxArray.splice(index,1);
    }

    deleteTaxLine(index, taxLineIndex){
        this.taxArray[index].removeAt(taxLineIndex);
    }

    ngOnInit(){





        if(!this.newInvoice){
            //Fetch existing invoice
        }
    }

    setInvoiceDate(date){
        let invoiceDateControl:any = this.invoiceForm.controls['invoice_date'];
        invoiceDateControl.patchValue(date);
    }

    setPaymentDate(date){
        let paymentDateControl:any = this.invoiceForm.controls['payment_date'];
        paymentDateControl.patchValue(date);
    }

    populateCustomers(){

    }

    gotoCustomersPage() {
        let link = ['/customers'];
        this._router.navigate(link);
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

    submit($event){
        $event.preventDefault();
        $event.stopPropagation();


        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let customer = _.find(this.customers, {customer_id: invoiceData.customer_id});
        let base = this;
        invoiceData.amount = this.calcTotal();
        //invoiceData.customer_name = customer.customer_name;
        //invoiceData.customer_email = customer.user_id;
        invoiceData.description = "desc";
        invoiceData.company_id = Session.getCurrentCompany();
        //invoiceData.company_name = Session.getCurrentCompanyName();
        invoiceData.invoiceLines.forEach(function(invoiceLine){

            let item = _.find(base.itemCodes, {id: invoiceLine.item_id});
            invoiceLine.item_name = item.name;

            invoiceLine.invoiceLineTaxes.forEach(function(tax){
                let taxItem = _.find(base.taxesList, {id: tax.tax_id});
                tax.tax_rate = taxItem.tax_rate;
            });
        });

        if(this.newInvoice) {

            this.invoiceService.createInvoice(invoiceData).subscribe(resp => {
                console.log("invoice created successfully", resp);
                this.toastService.pop(TOAST_TYPE.success, "Invoice created successfully");
            }, error=>{
                this.toastService.pop(TOAST_TYPE.error, "Invoice created failed");
            });
        } else {
            this.invoiceService.updateInvoice(invoiceData).subscribe(resp => {
                console.log("invoice created successfully", resp);
                this.toastService.pop(TOAST_TYPE.success, "Invoice updated successfully");
            }, error=>{
                this.toastService.pop(TOAST_TYPE.error, "Invoice update failed");
            });
        }
        return false;
    }

    getCustomerName(id){
        let customer = _.find(this.customers, {'customer_id': id});
        return customer? customer.customer_name: '';
    }
}