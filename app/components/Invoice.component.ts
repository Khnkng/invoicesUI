
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
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {ReportService} from "reportsUI/app/services/Reports.service";
import {PAYMENTSPATHS} from "reportsUI/app/constants/payments.constants";
import {StateService} from "qCommon/app/services/StateService";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {NumeralService} from "qCommon/app/services/Numeral.service";
import {CURRENCY_LOCALE_MAPPER} from "qCommon/app/constants/Currency.constants";
import {DimensionService} from "qCommon/app/services/DimensionService.service";

declare let _:any;
declare let numeral:any;
declare let jQuery:any;
declare let moment:any;

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
    defaultDate:string;
    itemActive:boolean = false;
    dimensionFlyoutCSS:any;
    editItemForm: FormGroup;
    editItemIndex:number;
    paymentCOAName:string;
    invoiceCOAName:string;
    chartOfAccounts:Array<any> = [];
    maillIds:Array<string>=[];
    //hasMilIds:boolean=true;
    tasksLineArray:FormArray = new FormArray([]);
    taskTaxArray:Array<any>=[];
    amount:number=0;
    contact:any;
    customerContacts:Array<any>=[];
    selectedContact:any={};
    selectedCustomer:any={};
    companyCurrency: string;
    taxTotal:number=0;
    subTotal:number=0;
    localeFormat:string='en-us';
    taskItemCodes:Array<any>=[];
    itemItemCodes:Array<any>=[];
    discountEditMode:boolean=false;
    amountPaidEditMode:boolean=false;
    invoiceProcessedData:any;
    additionalMails:String;
    showPreview:boolean;
    preViewText:string="Preview Invoice";
    isDuplicate:boolean;
    routeSubscribe:any;
    companyAddress:any;
    coreValue:number=0;
    logoURL:string;
    hasPaid:boolean;
    amount_paid:any=0;
    editLineType:string;
    dimensions:Array<any> = [];
    selectedDimensions:Array<any> = [];
    totalAmount:number=0;
    remainder_name:string;

    constructor(private _fb: FormBuilder, private _router:Router, private _route: ActivatedRoute, private loadingService: LoadingService,
                private invoiceService: InvoicesService, private toastService: ToastService, private codeService: CodesService, private companyService: CompaniesService,
                private customerService: CustomersService, private _invoiceForm:InvoiceForm, private _invoiceLineForm:InvoiceLineForm, private _invoiceLineTaxesForm:InvoiceLineTaxesForm,
                private coaService: ChartOfAccountsService,private titleService:pageTitleService,private stateService: StateService, private reportService: ReportService,private switchBoard: SwitchBoard,private numeralService:NumeralService, private dimensionService: DimensionService){
        this.titleService.setPageTitle("Invoices");
        let _form:any = this._invoiceForm.getForm();
        _form['invoiceLines'] = this.invoiceLineArray;
        _form['taskLines'] = this.tasksLineArray;
        this.companyCurrency=Session.getCurrentCompanyCurrency();
        this.localeFormat=CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]?CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]:'en-US';
        this.invoiceForm = this._fb.group(_form);
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            this.defaultDate=moment(new Date()).format("MM/DD/YYYY");
            this.loadInitialData();
            this.loadCOA();
            this.getCompanyDetails();
        });
        this.getCompanyLogo();
        if(this._router.url.indexOf('duplicate')!=-1){
            this.isDuplicate=true;
        };
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            if(this.dimensionFlyoutCSS == "expanded"){
                this.hideFlyout();
            }else{
                this.gotoPreviousState();
            }

        });

        this.dimensionService.dimensions(Session.getCurrentCompany())
            .subscribe(dimensions =>{
                this.dimensions = dimensions;
            }, error => {

            });
    }

    gotoPreviousState() {
        let previousState=this.stateService.getPrevState();
        if(previousState&&previousState.key=="New-Payment-Invoice"){
            let link = [previousState.url];
            this._router.navigate(link);
        }else {
            this._router.navigate([previousState.url]);
        }
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

    getCompanyLogo() {
        this.invoiceService.getCompanyLogo(Session.getCurrentCompany(),Session.getUser().id)
            .subscribe(preference => this.processPreference(preference[0]), error => this.handleError(error));
    }

    processPreference(preference){
        if(preference && preference.temporaryURL){
            this.logoURL = preference.temporaryURL;
        }
    }

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Failed to perform operation");
    }

    closeLoader(){
        this.loadingService.triggerLoadingEvent(false);
    }

    loadItemCodes(companyId:any) {
        this.codeService.itemCodes(companyId)
            .subscribe(itemCodes => {
                this.itemCodes = itemCodes;
                this.taskItemCodes = _.filter(itemCodes, {'is_service': true});
                this.itemItemCodes = _.filter(itemCodes, {'is_service': false});
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
        if(!this.invoiceID){
            this.closeLoader();
            this.setInvoiceDate(this.defaultDate);
            this.setDefaultCurrency();
            this.numeralService.switchLocale(Session.getCurrentCompanyCurrency().toLowerCase());
            this.newInvoice = true;
            for(let i=0; i<2; i++){
                this.addInvoiceList(null,'item');
                this.addInvoiceList(null,'task');
            }
            this.titleService.setPageTitle("New Invoice");
        } else {
            this.titleService.setPageTitle("Edit Invoice");
            this.invoiceService.getInvoice(this.invoiceID).subscribe(invoice=>{
                let base=this;
                this.invoice = invoice;
                if(invoice.state=='paid'){
                    this.titleService.setPageTitle("View Invoice");
                    this.hasPaid=true;
                    this.amount=invoice.amount;
                };
                //this.numeralService.switchLocale(invoice.currency.toLowerCase());
                this.onCurrencySelect(invoice.currency);
                this.subTotal=invoice.sub_total;
                this.taxTotal=invoice.tax_amount;
                this.amount_paid=invoice.amount_paid;
                let _invoice = _.cloneDeep(invoice);
                delete _invoice.invoiceLines;
                let taskLines:Array<any> = [];
                let itemLines:Array<any> = [];
                taskLines =  _.filter(this.invoice.invoiceLines, function(invoice) { return invoice.type == 'task'; });
                itemLines =  _.filter(this.invoice.invoiceLines, function(invoice) { return invoice.type == 'item'; });

                if(taskLines.length==0){
                    for(let i=0; i<2; i++){
                        this.addInvoiceList(null,'task');
                    }
                }if(itemLines.length==0){
                    for(let i=0; i<2; i++){
                        this.addInvoiceList(null,'item');
                    }
                }
                this.coreValue=_.random(50,75)+'%';
                this.getCustomrtDetails(invoice.customer_id);
                this.loadContacts(invoice.customer_id);
                this._invoiceForm.updateForm(this.invoiceForm, _invoice);
                this.invoice.invoiceLines.forEach(function(invoiceLine:any){
                    base.addInvoiceList(invoiceLine,invoiceLine.type);
                });
            });
        }
    }



    loadInitialData() {
        let companyId = Session.getCurrentCompany();
        this.loadCustomers(companyId);
    }

    getCompanyDetails(){
        this.companyService.company(Session.getCurrentCompany())
            .subscribe(companyAddress => {
                if(companyAddress){
                    let address={
                        name:companyAddress.name,
                        address:companyAddress.addresses[0].line,
                        country:companyAddress.addresses[0].country,
                        state:companyAddress.addresses[0].stateCode,
                        zipcode:companyAddress.addresses[0].zipcode
                    };
                    this.companyAddress=address;
                }

            },error=>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your Company details");
            });

    }

    addInvoiceList(line?:any,type?:any) {
        let base = this;
        if(type=='task'){
            let _taskForm:any = this._invoiceLineForm.getForm(line);
            let tasksListForm = this._fb.group(_taskForm);
            this.tasksLineArray.push(tasksListForm);
        }else if(type=='item'){
            let _form:any = this._invoiceLineForm.getForm(line);
            let invoiceListForm = this._fb.group(_form);
            this.invoiceLineArray.push(invoiceListForm);
        }
    }

    deleteInvoiceLine(index,type) {
        if(type=='item'){
            this.invoiceLineArray.removeAt(index);
            this.taxArray.splice(index,1);
        }else if (type=='task'){
            this.tasksLineArray.removeAt(index);
            this.taskTaxArray.splice(index,1);
        }

    }

    deleteTaxLine(index, taxLineIndex,type){
        if(type=='task'){
            this.taskTaxArray[index].removeAt(taxLineIndex);
        }else if(type=='item'){
            this.taxArray[index].removeAt(taxLineIndex);
        }

    }

    ngOnInit(){
        if(!this.newInvoice){
            //Fetch existing invoice
        }
    }


    setDefaultCurrency(){
        let currencyControl:any = this.invoiceForm.controls['currency'];
        currencyControl.patchValue(Session.getCurrentCompanyCurrency());
    }

    setInvoiceDate(date){
        let invoiceDateControl:any = this.invoiceForm.controls['invoice_date'];
        invoiceDateControl.patchValue(date);
        let term=this.invoiceForm.controls['term'].value;
        if(term)
            this.selectTerm(term);
    }

    setPaymentDate(date){
        let paymentDateControl:any = this.invoiceForm.controls['due_date'];
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
        if(taxId && price && quantity && tax) {
            let priceVal = Number(price).toFixed(2);
            let quantityVal =Number(quantity).toFixed(4);
            return Number((tax.taxRate * parseFloat(priceVal) * parseFloat(quantityVal))/100);
        }
        return numeral(0).value();
    }

    calcAmt(price, quantity){
        if(price && quantity) {
            let priceVal = Number(price).toFixed(2);
            let quantityVal =Number(quantity).toFixed(4);
            return Number(parseFloat(priceVal) * parseFloat(quantityVal));
        }
        return numeral(0).value();
    }

    formattedLineTotal(price,quantity){
        let value=this.calcAmt(price,quantity);
        return this.numeralService.format('$0,0.00', value)
    }

    formattedTaxTotal(id,price,quantity){
        let value=this.calcLineTax(id,price,quantity);
        return this.numeralService.format('$0,0.00', value)
    }

    formatAmount(value){
        return this.numeralService.format('$0,0.00', value)
    }

    formatQuantity(value){
        return this.numeralService.formatNumber('0,0.0000', value);
    }

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

    calcSubTotal() {
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let total = 0;
        let base = this;
        let taskTotal=0;
        let baseTotal=0;

        if(invoiceData.invoiceLines) {
            invoiceData.invoiceLines.forEach(function (invoiceLine) {
                if(!invoiceLine.destroy){
                    total = total +base.calcAmt(invoiceLine.price, invoiceLine.quantity);
                }

            });
        }
        if(invoiceData.taskLines) {
            invoiceData.taskLines.forEach(function (invoiceLine) {
                if(!invoiceLine.destroy){
                    taskTotal = taskTotal + base.calcAmt(invoiceLine.price, invoiceLine.quantity);
                }
            });
        }
        baseTotal=Number(total.toFixed(2))+Number(taskTotal.toFixed(2));

        this.subTotal=baseTotal;
        return this.subTotal;
    }

    calTaxTotal(){
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let base = this;
        let lineTaxTotal=0;
        let itemTaxTotal=0;
        let baseTotal=0;

        if(invoiceData.invoiceLines) {
            invoiceData.invoiceLines.forEach(function (invoiceLine) {
                let total =  base.calcAmt(invoiceLine.price, invoiceLine.quantity);
                if(invoiceLine.tax_id) {
                    let taxAmt=base.calcLineTax(invoiceLine.tax_id, 1, total);
                    if(!invoiceLine.destroy){
                        itemTaxTotal=itemTaxTotal+taxAmt;
                    }
                }
            });
        }
        if(invoiceData.taskLines) {
            invoiceData.taskLines.forEach(function (invoiceLine) {
                let total = base.calcAmt(invoiceLine.price, invoiceLine.quantity);
                if(invoiceLine.tax_id) {
                    let taxAmt=base.calcLineTax(invoiceLine.tax_id, 1, total);
                    if(!invoiceLine.destroy){
                        lineTaxTotal=lineTaxTotal+taxAmt;
                    }
                }
            });
        }
        baseTotal=Number(lineTaxTotal.toFixed(2))+Number(itemTaxTotal.toFixed(2));
        this.taxTotal=baseTotal;
        return this.taxTotal;
    }


    submit($event,sendMail,action){
        $event.preventDefault();
        $event.stopPropagation();
        let itemLines=[];
        let taskLines=[];
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let base = this;
        invoiceData.amount = Number((this.amount).toFixed(2));
        delete invoiceData.invoiceLines;
        taskLines=this.getInvoiceLines('task');
        itemLines=this.getInvoiceLines('item');

        if(this.totalAmount<0){
            this.toastService.pop(TOAST_TYPE.error, "Invoice amount should grater than or equal to zero");
            return
        }

        if(taskLines.length==0&&itemLines.length==0){
            this.toastService.pop(TOAST_TYPE.error, "Please add Tasks or Item Lines");
            return
        }

        if(this.validateLines(itemLines,'item')||this.validateLines(taskLines,'task')){
            return;
        }
        invoiceData.sub_total=Number((this.subTotal).toFixed(2));
        invoiceData.amount_due=Number((this.totalAmount).toFixed(2));
        invoiceData.tax_amount=Number((this.taxTotal).toFixed(2));
        invoiceData.invoiceLines=itemLines.concat(taskLines);
        invoiceData.recepientsMails=this.maillIds;
        invoiceData.sendMail=sendMail;
        invoiceData.company=this.companyAddress;
        invoiceData.customer=this.selectedCustomer;
        invoiceData.user_id=Session.getUser().id;
        invoiceData.company_id=Session.getCurrentCompany();
        invoiceData.logoURL = this.logoURL;
        invoiceData.state=this.invoiceID?this.invoice.state:'draft';
        this.invoiceProcessedData=invoiceData;
        if(action=='email'){
            this.openEmailDailog();
        }else if (action=='draft'){
            this.saveInvoiceDetails(invoiceData);
        }else if(action=='save'){
            this.saveInvoiceDetails(invoiceData);
        }else if(action=='preview'){
            this.togelPreview();
        }else if(action=='download'){
            if(!this.showPreview)
            {
                this.togelPreview();
            }
            let base=this;
            setTimeout(function(){
                base.exportToPDF();
            })
        }
    }

    togelPreview(){
        this.showPreview=!this.showPreview;
        if(this.showPreview){
            this.preViewText="Close Preview"
        }else {
            this.preViewText="Preview Invoice"
        }
    }


    openEmailDailog(){
        jQuery('#invoice-email-conformation').foundation('open');
    }

    closeEmailDailog(){
        this.resetEmailDailogFields();
        jQuery('#invoice-email-conformation').foundation('close');
    }
    resetEmailDailogFields(){
        this.additionalMails=null;
        this.remainder_name=null;
    }

    sendInvoiceMails(){
        if(this.additionalMails){
            let mails=[];
            let mailsUi:Array<string>=this.additionalMails.split(',');
            _.forEach(mailsUi, function(value) {
                if(value)
                {
                    mails.push(value);
                }
            });
            this.invoiceProcessedData.recepientsMails=this.invoiceProcessedData.recepientsMails.concat(mails);
        }
        this.invoiceProcessedData.remainder_name=this.remainder_name;
        this.saveInvoiceDetails(this.invoiceProcessedData);
        this.closeEmailDailog();
    }

    saveInvoiceDetails(invoiceData){
        this.loadingService.triggerLoadingEvent(true);
        delete invoiceData.company;
        delete invoiceData.customer;
        delete invoiceData.taskLines;
        delete invoiceData.logoURL;
        if(this.newInvoice||this.isDuplicate) {
            this.invoiceService.createInvoice(invoiceData).subscribe(resp => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice created successfully");
                //this.navigateToDashborad();
                this.gotoPreviousState();
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
                if(error&&JSON.parse(error))
                    this.toastService.pop(TOAST_TYPE.error, JSON.parse(error).message);
                else
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

        let dueDateControl:any = this.invoiceForm.controls['due_date'];
        dueDateControl.patchValue(moment(new_date).format('MM/DD/YYYY'));
    }

    itemChange(item,index,type){
        let itemCode = _.find(this.itemCodes, {'id': item});
        let itemsControl:any;
        let itemControl:any;
        if(type=='item'){
            itemsControl=this.invoiceForm.controls['invoiceLines'];
        }else if(type=='task'){
            itemsControl=this.invoiceForm.controls['taskLines'];
        }
        if(itemCode){
            itemControl= itemsControl.controls[index];
            itemControl.controls['description'].patchValue(itemCode.desc);
            itemControl.controls['price'].patchValue(itemCode.sales_price);
        }

        this.calculateTotals();
    }


    onCustomerSelect(value){
        this.selectedContact=null;
        this.maillIds=[];
        this.getCustomerContacts(value);
        let customer = _.find(this.customers, {'customer_id': value});
        this.selectedCustomer=customer;
        if(customer){
            if(customer.term){
                this.selectTerm(customer.term);
                let term:any = this.invoiceForm.controls['term'];
                term.patchValue(customer.term);
            }
        }
    }

    getCustomrtDetails(value){
        //this.getCustomerContacts(value);
        let customer = _.find(this.customers, {'customer_id': value});
        this.selectedCustomer=customer;
    }

    onCustomerContactSelect(id){
        let contact = _.find(this.customerContacts, {'id': id});
        this.selectedContact=contact;
        this.maillIds.push(contact.email);
    }

    getCustomerContacts(id){
        this.loadingService.triggerLoadingEvent(true);
        this.loadContacts(id);
    }

    loadContacts(id){
        this.loadingService.triggerLoadingEvent(true);
        this.customerService.customer(id,Session.getCurrentCompany())
            .subscribe(customers => {
                this.loadingService.triggerLoadingEvent(false);
                if(customers.customer_contact_details){
                    this.customerContacts=customers.customer_contact_details;
                    if(this.invoiceID){
                        let contact = _.find(this.customerContacts, {'id': this.invoice.send_to});
                        if(contact){
                            this.selectedContact=contact;
                            this.maillIds.push(contact.email);
                        }

                    }
                }
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your customers");
                this.closeLoader();
            });
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



    editInvoiceLine($event, index,type) {
        $event && $event.preventDefault();
        $event && $event.stopImmediatePropagation();
        let base = this,data,itemsControl:any;
        this.itemActive = true;
        this.dimensionFlyoutCSS = "expanded";
        this.editLineType=type;
        if(type=="taskLines"){
            itemsControl = this.invoiceForm.controls['taskLines'];
        }else {
            itemsControl = this.invoiceForm.controls['invoiceLines'];
        }

        data =this._invoiceLineForm.getData(itemsControl.controls[index]);
        this.selectedDimensions = data.dimensions;
        this.editItemForm = this._fb.group(this._invoiceLineForm.getForm(data));
        /*if(data.item_id){
            this.updateCOADisplay(data.item_id);
        }*/
        this.editItemIndex = index;
    }

    hideFlyout(){
        this.dimensionFlyoutCSS = "collapsed";
        this.itemActive = false;
        this.editItemIndex = null;
        this.selectedDimensions = [];
    }

    saveItem(){
        let dimensions = this.editItemForm.controls['dimensions'];
        dimensions.patchValue(this.selectedDimensions);
        let itemData = this._invoiceLineForm.getData(this.editItemForm);
        this.updateLineInView(itemData);
        this.hideFlyout();
    }

    updateLineInView(item){
        let itemsControl:any;
        if(this.editLineType=="taskLines"){
            itemsControl=this.invoiceForm.controls['taskLines'];
        }else {
            itemsControl=this.invoiceForm.controls['invoiceLines'];
        }
        let itemControl = itemsControl.controls[this.editItemIndex];
        itemControl.controls['description'].patchValue(item.description);
        itemControl.controls['price'].patchValue(item.price);
        itemControl.controls['quantity'].patchValue(item.quantity);
        itemControl.controls['item_id'].patchValue(item.item_id);
        itemControl.controls['tax_id'].patchValue(item.tax_id);
        itemControl.controls['dimensions'].patchValue(item.dimensions);
        this.calculateTotals();
    }


    /*Table implementation*/

    editItem(index, itemForm,type){
        let linesControl:any;
        if(!this.hasPaid&&type=='item'){
            linesControl= this.invoiceForm.controls['invoiceLines'];
            this.resetAllLinesFromEditing(linesControl);
            itemForm.editable = !itemForm.editable;
        }else if(!this.hasPaid&&type=='task'){
            linesControl= this.invoiceForm.controls['taskLines'];
            this.resetAllLinesFromEditing(linesControl);
            itemForm.editable = !itemForm.editable;
        }
        if(!this.hasPaid&&index == this.getLastActiveLineIndex(linesControl)){
            this.addInvoiceList(null,type);
        }
    }

    resetAllLinesFromEditing(linesControl){
        _.each(linesControl.controls, function(lineControl){
            lineControl.editable = false;
        });
    }

    getLastActiveLineIndex(linesControl){
        let result = false;
        _.each(linesControl.controls, function(lineControl, index){
            if(!lineControl.controls['destroy'].value){
                result = index;
            }
        });
        return result;
    }

    getLineCount(){
        let linesControl:any = this.invoiceForm.controls['invoiceLines'];
        let activeLines = [];
        _.each(linesControl.controls, function(lineControl){
            if(!lineControl.controls['destroy'].value){
                activeLines.push(lineControl);
            }
        });
        return activeLines.length;
    }

    getTaxName(taxId){
        let tax = _.find(this.taxesList, {'id': taxId});
        return tax? tax.name+"-"+tax.taxRate: '';
    }

    getItemCodeName(id){
        let itemcode = _.find(this.itemCodes, {'id': id});
        return itemcode? itemcode.name: '';
    }

    onCurrencySelect(currency){
        //this.companyCurrency=currency;
        if(currency=='USD'){
            this.localeFormat='en-Us';
        }else if(currency=='INR'){
            this.localeFormat='ind';
        }else if(currency=='IDR'){
            this.localeFormat='id-id'
        }
        this.numeralService.switchLocale(currency);
    }

    calculateAmount(paidAmount){
        this.amount=Number(this.subTotal+this.taxTotal);
        this.totalAmount=Number(this.subTotal+this.taxTotal-(Number(this.amount_paid)));
        return this.totalAmount;
    }


    validateTaskLines() {
        let status = true;
        if(this.subTotal<=0){
            status = false;
        }
        return status;
    }

    getInvoiceLines(type){
        let base = this;
        let lines = [];
        let lineListControl:any;
        if(type=='task'){
            lineListControl=this.invoiceForm.controls['taskLines'];
        }else if(type=='item'){
            lineListControl=this.invoiceForm.controls['invoiceLines'];
        }
        let defaultLine = this._invoiceLineForm.getData(this._fb.group(this._invoiceLineForm.getForm()));
        _.each(lineListControl.controls, function(lineListForm){
            let lineData = base._invoiceLineForm.getData(lineListForm);
            if(!base.invoiceID){
                if(!_.isEqual(lineData, defaultLine)){
                    let item={};
                    lineData.item=item;
                    lineData.item.name=base.getItemCodeName(lineData.item_id);
                    lineData.type=type;
                    lineData.quantity=lineData.quantity.toFixed(4);
                    lineData.price=lineData.price.toFixed(2);
                    lineData.amount=Number((lineData.quantity*lineData.price).toFixed(2));
                    if(!lineData.destroy){
                        lines.push(lineData);
                    }
                }
            }else {
                if (lineData.id) {
                    let item={};
                    lineData.item=item;
                    lineData.item.name=base.getItemCodeName(lineData.item_id);
                    lineData.quantity=lineData.quantity.toFixed(4);
                    lineData.price=lineData.price.toFixed(2);
                    lineData.amount=Number((lineData.quantity*lineData.price).toFixed(2));
                    if(!lineData.destroy){
                        lines.push(lineData);
                    }
                } else if (!_.isEqual(lineData, defaultLine)) {
                    let item={};
                    lineData.item=item;
                    lineData.item.name=base.getItemCodeName(lineData.item_id);
                    lineData.type=type;
                    lineData.quantity=lineData.quantity.toFixed(4);
                    lineData.price=lineData.price.toFixed(2);
                    lineData.amount=Number((lineData.quantity*lineData.price).toFixed(2));
                    if(!lineData.destroy){
                        lines.push(lineData);
                    }
                }
            }
        });
        return lines;
    }

    validateLines(lines,type){
        let base = this;
        let result = false;
        _.each(lines, function(line){
            if(!line.destroy){
                if(!line.item_id){
                    if(type=='task'){
                        base.toastService.pop(TOAST_TYPE.error, "Please select task");
                    }else {
                        base.toastService.pop(TOAST_TYPE.error, "Please select item");
                    }
                    result = true;
                    return false;
                }
                if(!line.quantity){
                    if(type=='task'){
                        base.toastService.pop(TOAST_TYPE.error, "Hours should grater than zero");
                    }else {
                        base.toastService.pop(TOAST_TYPE.error, "Quantity should grater than zero");
                    }
                    result = true;
                    return false;
                }
                if(!line.price){
                    if(type=='task'){
                        base.toastService.pop(TOAST_TYPE.error, "Rate should grater than zero");
                    }else {
                        base.toastService.pop(TOAST_TYPE.error, "Unit cost grater than zero");
                    }
                    result = true;
                    return false;
                }
            }
        });
        return result;
    }


    exportToPDF(){
        let imgString = jQuery('#company-img').clone().html();
        let html = jQuery('<div>').append(jQuery('style').clone()).append(jQuery('#payment-preview').clone()).html();
        if(imgString)
        html = html.replace(imgString,imgString.replace('>','/>'));
        let pdfReq={
            "version" : "1.1",
            "genericReport": {
                "payload": html,
                "width":612,
                "height":792
            },
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


    ngOnDestroy(){
        if(jQuery('#invoice-email-conformation'))
            jQuery('#invoice-email-conformation').remove();
        if(this.routeSubscribe){
            this.routeSubscribe.unsubscribe();
        }
        this.numeralService.switchLocale(Session.getCurrentCompanyCurrency());
    }


    deleteLineItem($event,index,type){
        $event && $event.stopImmediatePropagation();
        let itemsList:any = this.invoiceForm.controls[type];
        let itemControl = itemsList.controls[index];
        itemControl.controls['destroy'].patchValue(true);
        let base=this;
         setTimeout(function(){
         base.calculateTotals();
         });
    }

    calculateTotals(){
        this.calcSubTotal();
        this.calTaxTotal();
    }

    isDimensionSelected(dimensionName){
        let selectedDimensionNames = _.map(this.selectedDimensions, 'name');
        return selectedDimensionNames.indexOf(dimensionName) != -1;
    }

    doNothing($event){
        $event && $event.preventDefault();
        $event && $event.stopPropagation();
        $event && $event.stopImmediatePropagation();
    }

    selectDimension($event, dimensionName){
        $event && $event.preventDefault();
        $event && $event.stopPropagation();
        $event && $event.stopImmediatePropagation();
        let selectedDimensionNames = _.map(this.selectedDimensions, 'name');
        if(selectedDimensionNames.indexOf(dimensionName) == -1){
            this.selectedDimensions.push({
                "name": dimensionName,
                "values": []
            });
        } else{
            this.selectedDimensions.splice(selectedDimensionNames.indexOf(dimensionName), 1);
        }
    }

    isValueSelected(dimension, value){
        let currentDimension = _.find(this.selectedDimensions, {'name': dimension.name});
        if(!_.isEmpty(currentDimension)){
            if(currentDimension.values.indexOf(value) != -1){
                return true;
            }
            return false;
        }
        return false;
    }

    selectValue($event, dimension, value){
        $event && $event.stopPropagation();
        $event && $event.stopImmediatePropagation();
        _.each(this.selectedDimensions, function (selectedDimension) {
            if(selectedDimension.name == dimension.name){
                if(selectedDimension.values.indexOf(value) == -1){
                    selectedDimension.values.push(value);
                } else{
                    selectedDimension.values.splice(selectedDimension.values.indexOf(value), 1);
                }
            }
        });
    }

}

