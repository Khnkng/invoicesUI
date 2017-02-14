
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
declare let jQuery:any;

@Component({
    selector: 'invoice',
    templateUrl: '/app/views/invoice.html'
})

export class InvoiceComponent{
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
        this.addInvoiceList();
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            debugger;
            if(!this.invoiceID){
                this.newInvoice = true;
            } else {
                this.invoiceService.getInvoice(this.invoiceID).subscribe(invoice=>{
                    this.invoice = invoice;
                    this._invoiceForm.updateForm(this.invoiceForm, this.invoice);
                });
            }
        });


    }

    addInvoiceList() {
        let _form:any = this._invoiceLineForm.getForm();
        let taxesLineArray:FormArray = new FormArray([]);

        _form['invoiceLineTaxes'] = taxesLineArray;
        let invoiceListForm = this._fb.group(_form);
        this.invoiceLineArray.push(invoiceListForm);
        this.taxArray.push(taxesLineArray);
        this.addTaxLine(this.taxArray.length-1);
    }

    addTaxLine(index) {
        let _form:any = this._invoiceLineTaxesForm.getForm();
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



        let companyId = Session.getCurrentCompany();
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your customers");
            });
        this.invoiceService.getPreference(companyId)
            .subscribe(preference => {
                this.preference = preference;
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load Invoice settings.");
            });

        this.codeService.itemCodes(companyId)
            .subscribe(itemCodes => this.itemCodes = itemCodes);

        this.companyService.getTaxofCompany(companyId)
            .subscribe(taxesList  => {
                this.taxesList=taxesList;
            });

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

    calcLineTax(taxId, price, quantity) {
        let tax = _.find(this.taxesList, {id: taxId});
        if(taxId && price && quantity) {
            return (tax.taxRate * parseInt(price) * parseInt(quantity))/100;
        }
        return 0;
    }

    calcAmt(price, quantity){
        if(price && quantity) {
            return parseInt(price) * parseInt(quantity);
        }
        return 0;
    }

    calcSubTotal() {
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let subTotal = 0;
        let base = this;
        invoiceData.invoiceLines.forEach(function(invoiceLine){
            subTotal = subTotal + base.calcAmt(invoiceLine.price, invoiceLine.quantity);
        });
        return subTotal;
    }

    calcTotal() {
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let total = 0;
        let base = this;
        invoiceData.invoiceLines.forEach(function(invoiceLine){
            total = total + base.calcAmt(invoiceLine.price, invoiceLine.quantity);

            invoiceLine.invoiceLineTaxes.forEach(function(tax){
                let taxAmt = base.calcLineTax(tax.tax_id, 1, total);
                total = total - taxAmt;
            });
        });
        return total;
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

        this.invoiceService.createInvoice(invoiceData).subscribe(resp => {
            console.log("invoice created successfully", resp);
            this.toastService.pop(TOAST_TYPE.success, "Invoice created successfully");
        }, error=>{
            this.toastService.pop(TOAST_TYPE.error, "Invoice created failed");
        });
        return false;
    }
}