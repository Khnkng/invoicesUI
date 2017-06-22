
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
import {ChartOfAccountsService} from "qCommon/app/services/ChartOfAccounts.service";
import {DAYS_OF_WEEK, DAYS_OF_MONTH,WEEK_OF_MONTH,MONTH_OF_QUARTER,MONTH_OF_YEAR} from "qCommon/app/constants/Date.constants";

declare let _:any;
declare let numeral:any;
declare let jQuery:any;
declare let moment:any;

@Component({
    selector: 'invoice',
    templateUrl: '../views/invoice.html'
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
    defaultDate:string;
    itemActive:boolean = false;
    dimensionFlyoutCSS:any;
    editItemForm: FormGroup;
    editItemIndex:number;
    paymentCOAName:string;
    invoiceCOAName:string;
    chartOfAccounts:Array<any> = [];
    maillIds:Array<string>=[];
    hasMilIds:boolean=true;
    dayOfWeek:Array<string>=DAYS_OF_WEEK;
    dayOfMonth:Array<string>=DAYS_OF_MONTH;
    weekOfMonth:Array<string>=WEEK_OF_MONTH;
    monthOfQuarter:Array<string>=MONTH_OF_QUARTER;
    monthOfYear:Array<string>=MONTH_OF_YEAR;

    constructor(private _fb: FormBuilder, private _router:Router, private _route: ActivatedRoute, private loadingService: LoadingService,
        private invoiceService: InvoicesService, private toastService: ToastService, private codeService: CodesService, private companyService: CompaniesService,
                private customerService: CustomersService, private _invoiceForm:InvoiceForm, private _invoiceLineForm:InvoiceLineForm, private _invoiceLineTaxesForm:InvoiceLineTaxesForm,
                private coaService: ChartOfAccountsService){

        let _form:any = this._invoiceForm.getForm();
        _form['invoiceLines'] = this.invoiceLineArray;
        this.invoiceForm = this._fb.group(_form);
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            this.defaultDate=moment(new Date()).format("MM/DD/YYYY");
            this.loadInitialData();
            this.loadCOA();
        });

    }

    loadCustomers(companyId:any) {
        this.loadingService.triggerLoadingEvent(true);
        this.customerService.customers(companyId)
            .subscribe(customers => {
                this.customers = customers;
                this.loadItemCodes(companyId);
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your customers");
                this.closeLoader();
            });
    }


    closeLoader(){
        this.loadingService.triggerLoadingEvent(false);
    }

    loadItemCodes(companyId:any) {
        this.codeService.itemCodes(companyId)
            .subscribe(itemCodes => {
                this.itemCodes = itemCodes;
                this.loadTaxList(companyId);
            },error=>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your Items");
                this.closeLoader();
            });
    }

    loadTaxList(companyId:any) {
        this.companyService.getTaxofCompany(companyId)
            .subscribe(taxesList  => {
                this.taxesList=taxesList;
                this.setupForm();
            },error=>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your Taxes");
                this.closeLoader();
            });
    }

    setupForm() {
        let base = this;
        this.setInvoiceDate(this.defaultDate);
        this.closeLoader();
        if(!this.invoiceID){
            this.newInvoice = true;
            this.addInvoiceList();

        } else {
            this.invoiceService.getInvoice(this.invoiceID).subscribe(invoice=>{
                let base=this;
                this.invoice = invoice;
                let _invoice = _.cloneDeep(invoice);
                delete _invoice.invoiceLines;
                if(!_.isEmpty(this.invoice.paymentSpringPlan)){
                    _invoice.createPlan=true;
                    _invoice.frequency=this.invoice.paymentSpringPlan.frequency;
                    _invoice.ends_after=this.invoice.paymentSpringPlan.ends_after;
                    _invoice.planName=this.invoice.paymentSpringPlan.name;
                }
                this._invoiceForm.updateForm(this.invoiceForm, _invoice);
                this.maillIds=invoice.recepientsMails;
                if(invoice.recepientsMails&&invoice.recepientsMails.length>0){
                    this.hasMilIds=false;
                    setTimeout(function(){
                        base.hasMilIds=true;
                    })
                }
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
        this.loadCustomers(companyId);
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

    setPlanEndDate(date){
        let planEndDateControl:any = this.invoiceForm.controls['ends_after'];
        planEndDateControl.patchValue(date);
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
            let priceVal = numeral(price).value();
            let quantityVal = numeral(quantity).value();
            return numeral((tax.taxRate * parseFloat(priceVal) * parseFloat(quantityVal))/100).format('$00.00');
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
                        let taxAmt = numeral(base.calcLineTax(tax.tax_id, 1, total)).value();
                        total = total + taxAmt;
                    });
                }
            });
        }
        return numeral(total).format('$00.00');
    }

    submit($event,sendMail){
        $event.preventDefault();
        $event.stopPropagation();


        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let customer = _.find(this.customers, {customer_id: invoiceData.customer_id});
        let recepientsMails = jQuery('#invoice-emails').tagit("assignedTags");
        let base = this;
        invoiceData.amount = numeral(this.calcTotal()).value();
        if(invoiceData.createPlan){
            if(!invoiceData.planName){
                this.toastService.pop(TOAST_TYPE.error, "Please give plan name");
                return
            }else if(!invoiceData.frequency){
                this.toastService.pop(TOAST_TYPE.error, "Please select frequency");
                return
            }else if(invoiceData.frequency!='daily'&&!invoiceData.day){
                this.toastService.pop(TOAST_TYPE.error, "Please select day");
                return
            }else if((invoiceData.frequency=='quarterly'||invoiceData.frequency=='yearly')&&!invoiceData.month){
                this.toastService.pop(TOAST_TYPE.error, "Please select month");
                return
            }else if(!invoiceData.ends_after){
                this.toastService.pop(TOAST_TYPE.error, "Please select end date");
                return
            }
            invoiceData.action="create_plan";
            let paymentSpringPlan:any={};
            paymentSpringPlan.frequency=invoiceData.frequency;
            paymentSpringPlan.name=invoiceData.planName;
            paymentSpringPlan.amount=invoiceData.amount+"";
            paymentSpringPlan.ends_after=moment(invoiceData.ends_after,'MM/DD/YYYY').format("YYYY-MM-DD");
            if(invoiceData.frequency=='weekly'||invoiceData.frequency=='monthly'){
                paymentSpringPlan.day=invoiceData.day;
            }else if(invoiceData.frequency=='quarterly'||invoiceData.frequency=='yearly'){
                let dayObj:any={};
                dayObj.month=invoiceData.month;
                dayObj.day=invoiceData.day;
                paymentSpringPlan.day_map=dayObj;
            }
            invoiceData.paymentSpringPlan=paymentSpringPlan;
            delete invoiceData.day;
            delete invoiceData.month;
            delete invoiceData.week;
            delete invoiceData.quarter;
        }
        invoiceData.recepientsMails=recepientsMails;
        //invoiceData.customer_name = customer.customer_name;
        //invoiceData.customer_email = customer.user_id;
        invoiceData.description = "desc";
        invoiceData.company_id = Session.getCurrentCompany();
        //invoiceData.company_name = Session.getCurrentCompanyName();
        invoiceData.invoiceLines.forEach(function(invoiceLine){
            let item = _.find(base.itemCodes, {id: invoiceLine.item_id});
            invoiceLine.item_name = item.name;
            invoiceLine.amount=invoiceLine.quantity*invoiceLine.price;
            let taxList=[];
            invoiceLine.invoiceLineTaxes.forEach(function(tax){
                if(tax.tax_id){
                    let taxItem = _.find(base.taxesList, {id: tax.tax_id});
                    tax.tax_rate = taxItem.tax_rate;
                    taxList.push(tax);
                }
            });
            invoiceLine.invoiceLineTaxes=taxList;
        });
        invoiceData.sendMail=sendMail;
        this.loadingService.triggerLoadingEvent(true);
        if(this.newInvoice) {
            this.invoiceService.createInvoice(invoiceData).subscribe(resp => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice created successfully");
                this.navigateToDashborad();
            }, error=>{
                if(error&&JSON.parse(error))
                this.toastService.pop(TOAST_TYPE.error, JSON.parse(error).message);
                else
                    this.toastService.pop(TOAST_TYPE.error, "Invoice creation  failed");
                this.closeLoader();
            });
        } else {
            this.invoiceService.updateInvoice(invoiceData).subscribe(resp => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice updated successfully");
                this.navigateToDashborad();
            }, error=>{
                this.toastService.pop(TOAST_TYPE.error, "Invoice update failed");
                this.closeLoader();
            });
        }
    }

    navigateToDashborad(){
        let link = ['invoices/dashboard',2];
        this._router.navigate(link);
    }

    selectTerm(term) {
        let days = term == 'custom' ? 0 : term.substring(3, term.length);
        let new_date = moment(this.invoiceForm.controls['invoice_date'].value, 'MM/DD/YYYY').add(days, 'days');

        let dueDateControl:any = this.invoiceForm.controls['payment_date'];
        dueDateControl.patchValue(moment(new_date).format('MM/DD/YYYY'));
    }

    itemChange(item,index){
        let itemCode = _.find(this.itemCodes, {'id': item});
        if(itemCode){
            let itemsControl:any = this.invoiceForm.controls['invoiceLines'];
            let itemControl = itemsControl.controls[index];
            itemControl.controls['description'].patchValue(itemCode.desc);
            itemControl.controls['price'].patchValue(itemCode.sales_price);
        }
    }


    onCustomerSelect(value){
        let customer = _.find(this.customers, {'customer_id': value});
        if(customer){
            this.maillIds=customer.email_ids;
            this.hasMilIds=false;
            let base=this;
            setTimeout(function(){
                base.hasMilIds=true;
            });
            if(customer.term){
                this.selectTerm(customer.term);
                let term:any = this.invoiceForm.controls['term'];
                term.patchValue(customer.term);
            }
        }
    }

    loadCOA(){
        this.coaService.chartOfAccounts(Session.getCurrentCompany())
            .subscribe(chartOfAccounts => {
                this.chartOfAccounts = chartOfAccounts;
            }, error =>{

            });
    }

    displayItemCodeCOA(itemId){
        if(itemId){
            let itemCode = _.find(this.itemCodes, {'id': itemId});
            this.updateCOADisplay(itemId);
            if(itemCode){
                this.editItemForm.controls['description'].patchValue(itemCode.desc);
                this.editItemForm.controls['price'].patchValue(itemCode.sales_price);
            }
        } else{
            this.paymentCOAName = "";
            this.invoiceCOAName = "";
        }
    }

    updateCOADisplay(itemId){
        let itemCode = _.find(this.itemCodes, {'id': itemId});
        let paymentCOA = _.find(this.chartOfAccounts, {'id': itemCode.payment_coa_mapping});
        let invoiceCOA = _.find(this.chartOfAccounts, {'id': itemCode.invoice_coa_mapping});
        if(paymentCOA && paymentCOA.name){
            this.paymentCOAName = paymentCOA.name;
        }
        if(invoiceCOA && invoiceCOA.name){
            this.invoiceCOAName = invoiceCOA.name;
        }
    }



    editInvoiceLine($event, index) {
        $event && $event.preventDefault();
        $event && $event.stopImmediatePropagation();
        let base = this,data,itemsControl:any;
        this.itemActive = true;
        this.dimensionFlyoutCSS = "expanded";
        itemsControl = this.invoiceForm.controls['invoiceLines'];
        data =this._invoiceLineForm.getData(itemsControl.controls[index]);
        this.editItemForm = this._fb.group(this._invoiceLineForm.getForm(data));
        if(data.item_id){
            this.updateCOADisplay(data.item_id);
        }

        this.editItemIndex = index;
    }

    hideFlyout(){
        this.dimensionFlyoutCSS = "collapsed";
        this.itemActive = false;
        this.editItemIndex = null;
    }

    saveItem(){
        let itemData = this._invoiceLineForm.getData(this.editItemForm);
        this.updateLineInView(itemData);
        this.hideFlyout();
    }

    updateLineInView(item){
        let itemsControl=this.invoiceForm.controls['invoiceLines'];
        let itemControl = itemsControl.controls[this.editItemIndex];
        itemControl.controls['description'].patchValue(item.description);
        itemControl.controls['price'].patchValue(item.price);
        itemControl.controls['quantity'].patchValue(item.quantity);
        itemControl.controls['item_id'].patchValue(item.item_id);
    }


}