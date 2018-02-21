
import {Component,ViewChild} from "@angular/core";
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
import {FormGroup, FormBuilder, FormArray,Validators} from "@angular/forms";
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
import {DateFormater} from "qCommon/app/services/DateFormatter.service";
import {FileUploader, FileUploaderOptions} from "ng2-file-upload";
import {UUID} from "angular2-uuid/index";
import {LateFeesService} from "qCommon/app/services/LateFeesService.service";
import {ComboBox} from "qCommon/app/directives/comboBox.directive";
import {DiscountService} from "qCommon/app/services/Discounts.service";
import {State} from "qCommon/app/models/State";

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
    additionalMails:string;
    showPreview:boolean;
    preViewText:string="Preview Invoice";
    isDuplicate:boolean;
    routeSubscribe:any;
    companyAddress:any;
    coreValue:string="0";
    logoURL:string;
    hasPaid:boolean;
    amount_paid:any=0;
    editLineType:string;
    dimensions:Array<any> = [];
    selectedDimensions:Array<any> = [];
    totalAmount:number=0;
    remainder_name:string="";
    dateFormat:string;
    serviceDateformat:string;
    PdfData:any;
    isPastDue:boolean;
    tasks:string="Task";
    showTask:boolean=true;
    UOM:string="Quantity";
    showUOM:boolean=true;
    unitCost:string="Price";
    showUnitCost:boolean=true;
    showDescription:boolean=true;
    showItemName:boolean=true;
    showInvoice:boolean;
    templateType:string;
    historyFlyoutCSS:any;
    historyList:Array<any>=[];
    count:any=0;
    uploader: FileUploader;
    hasBaseDropZoneOver: boolean = false;
    document: any;
    attachments:Array<any>=[];
    billUploadResp: any;
    sourceId:string;
    storedAttachments:Array<any>=[];
    showInvoiceHistory:boolean;

    showCommission:boolean;
    vendors:Array<string>=[];
    commissionObj:any={vendor_id:"",event_type:"",event_at:"",event_date:"",updateBill:false,item_id:"",item_name:"",amount_type:"",amount:0};
    commissions:Array<any>=[];
    showAddCommission:boolean;
    editCommissionIndex:any;
    isEditCommissionMode:boolean;
    commission:any={};
    displayCommission:boolean;
    deletedCommissions:Array<any>=[];
    lateFees:Array<any>=[];
    lateFeeAmount:any=0;
    email_notes:string;
    isOtherTemplate:boolean;
    recurringFrequency:string;
    recurringEnddate:string;
    @ViewChild("customerComboBoxDir") customerComboBox: ComboBox;
    discounts:Array<any>=[];
    discountAmount:any=0;
    showInvoicePaymentDetails:boolean=false;
    hasPaidInvoices: boolean = false;
    paidInvoiceTableData: any = {};
    paidInvoiceTableOptions: any = {search: true, pageSize: 10};
    payments: Array<any> = [];
    isPaymentsNavigation:boolean=false;

    constructor(private _fb: FormBuilder, private _router:Router, private _route: ActivatedRoute, private loadingService: LoadingService,
                private invoiceService: InvoicesService, private toastService: ToastService, private codeService: CodesService, private companyService: CompaniesService,
                private customerService: CustomersService, private _invoiceForm:InvoiceForm, private _invoiceLineForm:InvoiceLineForm, private _invoiceLineTaxesForm:InvoiceLineTaxesForm,
                private coaService: ChartOfAccountsService,private titleService:pageTitleService,private stateService: StateService, private reportService: ReportService,private switchBoard: SwitchBoard,
                private numeralService:NumeralService, private dimensionService: DimensionService, private dateFormater:DateFormater,private lateFeesService: LateFeesService,
                private  discountsService:DiscountService){
        this.titleService.setPageTitle("Invoices");
        let _form:any = this._invoiceForm.getForm();
        _form['invoiceLines'] = this.invoiceLineArray;
       // _form['taskLines'] = this.tasksLineArray;
        this.dateFormat = dateFormater.getFormat();
        this.serviceDateformat = dateFormater.getServiceDateformat();
        this.companyCurrency=Session.getCurrentCompanyCurrency();
        this.localeFormat=CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]?CURRENCY_LOCALE_MAPPER[Session.getCurrentCompanyCurrency()]:'en-US';
        this.invoiceForm = this._fb.group(_form);
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
            this.defaultDate=moment(new Date()).format(this.dateFormat);
            this.loadInitialData();
            this.loadCOA();
            this.getCompanyDetails();
            this.getCompanyPreferences();
            this.loadVendors();
            this.loadDiscounts();
            this.uploader = new FileUploader(<FileUploaderOptions>{
                url: invoiceService.getDocumentServiceUrl(),
                headers: [{
                    name: 'Authorization',
                    value: 'Bearer ' + Session.getToken()
                }]
            });
        });
        this.getCompanyLogo();
        this.getLateFees();
        if(this._router.url.indexOf('duplicate')!=-1){
            this.isDuplicate=true;
        };
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            if(this.dimensionFlyoutCSS == "expanded"){
                this.hideFlyout();
            }else if(this.showCommission){
                this.hideCommission();
            }else if(this.showInvoiceHistory){
                this.hideHistoryFlyout();
            }else if(this.showInvoicePaymentDetails){
                this.hideInvoicePayments();
            }else{
                this.gotoPreviousState();
            }
        });

    let previousState = this.stateService.getPrevState();
    if(previousState && previousState.key == 'InvoicePayments'){
      this.stateService.pop();
      this.isPaymentsNavigation=true;
      this.closeLoader();
      let data=previousState.data;
      this.showInvoicePaymentDetails=true;
      this.titleService.setPageTitle("Invoice Payments");
      this.payments=data.paymentsData;
      this.buildInvoicePaymentsData();
    }

        this.dimensionService.dimensions(Session.getCurrentCompany())
            .subscribe(dimensions =>{
                this.dimensions = dimensions;
            }, error => {

            });
    }

    gotoPreviousState() {
        let previousState=this.stateService.getPrevState();
        if(previousState && previousState.key=="New-Payment-Invoice"){
            let link = [previousState.url];
            this._router.navigate(link);
        } else if(previousState && previousState.key == 'RECEIVABLES'){
            this.stateService.pop();
            this._router.navigate([previousState.url]);
        } else {
            this._router.navigate([previousState.url]);
        }
    }

    hideInvoicePayments(){
      this.titleService.setPageTitle("Edit invoice");
      this.showInvoicePaymentDetails=false;
      this.showInvoice=true;
      let invoiceData = this._invoiceForm.getData(this.invoiceForm);
      this.setCustomerComboBoxValue(invoiceData.customer_id);
    }

    getLateFees(){
        this.lateFeesService.lateFees(Session.getCurrentCompany())
            .subscribe(lateFees => this.lateFees=lateFees, error=> {

            });
    }

   loadDiscounts(){
     this.discountsService.discounts(Session.getCurrentCompany()).subscribe(discounts => {
       this.discounts=discounts;
     }, error => this.handleError(error));
   }

    getLateFeeName(lateFeeId){
      let lateFee = _.find(this.lateFees, {'id': lateFeeId});
      return lateFee? lateFee.name: '';
    }

    hideCommission(){
        this.showInvoice=true;
        this.showCommission=false;
        if(this.newInvoice){
            this.titleService.setPageTitle("Add Invoice");
        }else {
            this.titleService.setPageTitle("Edit Invoice");
        }

    }

    getCompanyPreferences(){
      this.invoiceService.getPreference(Session.getCurrentCompany(),Session.getUser().id)
        .subscribe(preference => {
          if(preference){
            this.displayCommission=preference.displayCommission;
            this.tasks=preference.items;
            this.UOM=preference.units;
            this.unitCost=preference.price;
            this.showDescription=preference.hideItemDescription;
            this.showUnitCost=preference.hidePrice;
            this.showUOM=preference.hideUnits;
            this.showItemName=preference.hideItemName;
            this.templateType=preference.templateType;
            if(!this.isPaymentsNavigation){
              this.showInvoice=true;
            }
            if(preference.templateType=='Other2'){
              this.isOtherTemplate=true;
              this.templateType='Other2'
            }else if(preference.templateType=='Other1'){
              this.templateType='Other1'
            }
          }else {
            this.toastService.pop(TOAST_TYPE.error, "Please create invoice settings");
          }
        }, error =>{
          this.toastService.pop(TOAST_TYPE.error, "Please create invoice settings");
        });
    }

    loadCustomers(companyId:any) {
        if(!this.isPaymentsNavigation)
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
                //this.taskItemCodes = _.filter(itemCodes, {'is_service': true});
                this.itemItemCodes = itemCodes;
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
            if(this.templateType=="Other1"||this.templateType=="Other2"){
              this.setInvoiceValidators();
            }
            this.setInvoiceDate(this.defaultDate);
            this.setDefaultCurrency();
            this.numeralService.switchLocale(Session.getCurrentCompanyCurrency().toLowerCase());
            this.newInvoice = true;
            for(let i=0; i<2; i++){
                this.addInvoiceList(null,'item');
               // this.addInvoiceList(null,'task');
            }
            this.titleService.setPageTitle("New Invoice");
        } else {
            if(!this.isPaymentsNavigation)this.titleService.setPageTitle("Edit Invoice");
            this.invoiceService.getInvoice(this.invoiceID).subscribe(invoice=>{
                let base=this;
                invoice.invoice_date = base.dateFormater.formatDate(invoice['invoice_date'],base.serviceDateformat,base.dateFormat);
                invoice.due_date = base.dateFormater.formatDate(invoice['due_date'],base.serviceDateformat,base.dateFormat);
                if(invoice['job_date']){
                  invoice.job_date = base.dateFormater.formatDate(invoice['job_date'],base.serviceDateformat,base.dateFormat);
                }
                this.invoice = invoice;
                if(this.templateType=="Other1"||this.templateType=="Other2"){
                  this.setInvoiceValidators();
                }
                if(invoice.state=='paid'){
                    this.titleService.setPageTitle("View Invoice");
                    this.hasPaid=true;
                    this.amount=invoice.amount;
                    if(invoice.is_discount_applied&&invoice.discount_id){
                      this.discountAmount=invoice.discount;
                    }
                }
                if((invoice.state!='partially_paid'&&invoice.state!='paid')&&invoice.is_discount_applied&&invoice.discount_id){
                  this.getDiscountAmountValue();
                }
                this.setCustomerComboBoxValue(invoice.customer_id);
                if(invoice.attachments_metadata){
                    let attachmentObj=JSON.parse(invoice.attachments_metadata);
                    this.sourceId=attachmentObj.sourceId;
                    this.getInvoiceAttachments(this.sourceId);
                    this.storedAttachments=attachmentObj.attachments;
                }
                if(invoice.recurringFrequency){
                  this.recurringFrequency=invoice.recurringFrequency;
                  this.recurringEnddate=base.dateFormater.formatDate(invoice.recurringEnddate,base.serviceDateformat,base.dateFormat);
                }
                if(invoice.commissions&&invoice.commissions.length>0){
                    this.commissions=invoice.commissions;
                    this.commissions.forEach(function(commission:any){
                        if(commission.event_type=='date'){
                            commission.event_date=base.dateFormater.formatDate(commission.event_date,base.serviceDateformat,base.dateFormat);
                        }
                    });
                }
                //this.numeralService.switchLocale(invoice.currency.toLowerCase());
                this.onCurrencySelect(invoice.currency);
                this.subTotal=invoice.sub_total;
                this.taxTotal=invoice.tax_amount;
                this.amount_paid=invoice.amount_paid;
                this.isPastDue=invoice.is_past_due;
                this.lateFeeAmount=invoice.late_fee_amount;
                let _invoice = _.cloneDeep(invoice);
                delete _invoice.invoiceLines;
        //        let taskLines:Array<any> = [];
                let itemLines:Array<any> = [];
                if(invoice.remainder_name){
                  this.remainder_name=invoice.remainder_name;
                }
        //        taskLines =  _.filter(this.invoice.invoiceLines, function(invoice) { return invoice.type == 'task'; });
       // itemLines =  _.filter(this.invoice.invoiceLines, function(invoice) { return invoice.type == 'item'; });
        itemLines =this.invoice.invoiceLines;  //_.filter(, function(invoice) { return invoice.type == 'item'; });

                /*if(taskLines.length==0){
                    for(let i=0; i<2; i++){
                        this.addInvoiceList(null,'task');
                    }
                }*/if(itemLines.length==0){
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

    setCustomerComboBoxValue(customerId){
      let base=this;
      let customer = _.find(this.customers, {'customer_id': customerId});
      setTimeout(function(){
        base.customerComboBox.setValue(customer, 'customer_name');
      });
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
    /*if(type=='task'){
      let _taskForm:any = this._invoiceLineForm.getForm(line);
      let tasksListForm = this._fb.group(_taskForm);
      this.tasksLineArray.push(tasksListForm);
    }else if(type=='item'){

    }*/
    let _form:any = this._invoiceLineForm.getForm(line);
    let invoiceListForm = this._fb.group(_form);
    this.invoiceLineArray.push(invoiceListForm);
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
        this.sourceId=this.invoiceID?this.invoiceID:UUID.UUID();
        this.uploader.onBuildItemForm = (fileItem: any, form: any) => {
            let payload: any = {};
            payload.sourceID = this.sourceId;
            payload.sourceType = 'invoice_attachment';
            form.append('payload', JSON.stringify(payload));
        };
        this.uploader.onCompleteItem = (item, response, status, header) => {
            if (status === 200) {
                this.uploader.progress = 100;
                this.billUploadResp = response;
                this.uploader.queue.forEach(function (item) {
                    item.remove();
                });
                this.document = JSON.parse(response);
                this.compileLink();
            }
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

    setJobDate(date){
      let jobDateControl:any = this.invoiceForm.controls['job_date'];
      jobDateControl.patchValue(date);
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
            return this.roundOffValue((tax.taxRate * parseFloat(priceVal) * parseFloat(quantityVal))/100);
        }
        return numeral(0).value();
    }

    calcAmt(price, quantity){
        if(price && quantity) {
            let priceVal = Number(price).toFixed(2);
            let quantityVal =Number(quantity).toFixed(4);
            return this.roundOffValue(parseFloat(priceVal) * parseFloat(quantityVal));
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
        let baseTotal=0;

        if(invoiceData.invoiceLines) {
            invoiceData.invoiceLines.forEach(function (invoiceLine) {
                if(!invoiceLine.destroy){
                    total=base.roundOffValue(total +base.roundOffValue(base.calcAmt(invoiceLine.price, invoiceLine.quantity)));
                    //total = total +base.calcAmt(invoiceLine.price, invoiceLine.quantity);
                }

            });
        }
        /*if(invoiceData.taskLines) {
            invoiceData.taskLines.forEach(function (invoiceLine) {
                if(!invoiceLine.destroy){
                    taskTotal = taskTotal + base.calcAmt(invoiceLine.price, invoiceLine.quantity);
                }
            });
        }*/
        baseTotal=this.roundOffValue(total);

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
                        itemTaxTotal=base.roundOffValue(itemTaxTotal+taxAmt);
                    }
                }
            });
        }
        /*if(invoiceData.taskLines) {
            invoiceData.taskLines.forEach(function (invoiceLine) {
                let total = base.calcAmt(invoiceLine.price, invoiceLine.quantity);
                if(invoiceLine.tax_id) {
                    let taxAmt=base.calcLineTax(invoiceLine.tax_id, 1, total);
                    if(!invoiceLine.destroy){
                        lineTaxTotal=lineTaxTotal+taxAmt;
                    }
                }
            });
        }*/
        baseTotal=this.roundOffValue(itemTaxTotal);
        this.taxTotal=baseTotal;
        return this.taxTotal;
    }


    submit($event,sendMail,action){
        $event.preventDefault();
        $event.stopPropagation();
        let itemLines=[];
        //let taskLines=[];
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        let base = this;
        invoiceData.invoice_date = this.dateFormater.formatDate(invoiceData.invoice_date,this.dateFormat,this.serviceDateformat);
        invoiceData.due_date = this.dateFormater.formatDate(invoiceData.due_date,this.dateFormat,this.serviceDateformat);
        if(invoiceData.job_date){
          invoiceData.job_date = this.dateFormater.formatDate(invoiceData.job_date,this.dateFormat,this.serviceDateformat);
        }
        invoiceData.amount = this.roundOffValue(this.amount);
        delete invoiceData.invoiceLines;
        //taskLines=this.getInvoiceLines('task');
        itemLines=this.getInvoiceLines('item');

        if(this.totalAmount<0){
            this.toastService.pop(TOAST_TYPE.error, "Invoice amount should grater than or equal to zero");
            return
        }

        if(itemLines.length==0){
            this.toastService.pop(TOAST_TYPE.error, "Please add invoice lines");
            return
        }

        if(this.validateLines(itemLines,'item')){
            return;
        }
        if(sendMail){
          this.additionalMails=this.selectedContact.email;
        }
        if(invoiceData.discount_id){
          invoiceData.is_discount_applied=true;
        }else {
          invoiceData.is_discount_applied=false;
        }
        invoiceData.sub_total=this.roundOffValue(this.subTotal);
        invoiceData.amount_due=this.roundOffValue(this.totalAmount+this.discountAmount);
        invoiceData.tax_amount=this.roundOffValue(this.taxTotal);
        //invoiceData.invoiceLines=itemLines.concat(taskLines);
        invoiceData.invoiceLines=itemLines;
        invoiceData.recepientsMails=_.uniq(this.maillIds);
        invoiceData.sendMail=sendMail;
        invoiceData.company=this.companyAddress;
        invoiceData.customer=this.selectedCustomer;
        invoiceData.user_id=Session.getUser().id;
        invoiceData.company_id=Session.getCurrentCompany();
        invoiceData.logoURL = this.logoURL;
        invoiceData.state=this.invoiceID?this.invoice.state:'draft';
        invoiceData.isPastDue=this.isPastDue;
        invoiceData.late_fee_name=invoiceData.late_fee_id?this.getLateFeeName(invoiceData.late_fee_id):'';
        if(this.isPastDue){
            invoiceData.late_fee_amount=this.lateFeeAmount;
        }
        if(this.commissions.length>0||this.deletedCommissions.length>0){
            invoiceData.commissions=this.commissions.concat(this.deletedCommissions);
        }
        if(this.attachments.length>0){
            let attachmentObj={
                sourceId:this.sourceId,
                attachments:this.attachments
            };
            invoiceData.attachments_metadata=JSON.stringify(attachmentObj);
        }else{
            invoiceData.attachments_metadata="";
        }
        this.setTemplateSettings(invoiceData);
        this.invoiceProcessedData=invoiceData;
        if(action=='email'){
          this.setBillUpdate(invoiceData);
          if(!this.showPreview)
          {
            this.togelPreview(invoiceData);
          }
          invoiceData.state=this.invoiceID?this.invoice.state:'sent';
          let base=this;
          setTimeout(function(){
            base.PdfData=base.getPdfData();
          });
          this.openEmailDailog();
        }else if (action=='draft'){
            this.setBillUpdate(invoiceData);
            this.saveInvoiceDetails(invoiceData);
        }else if(action=='save'){
            this.setBillUpdate(invoiceData);
            this.saveInvoiceDetails(invoiceData);
        }else if(action=='preview'){
            this.togelPreview(invoiceData);
        }else if(action=='download'){
            if(!this.showPreview)
            {
                this.togelPreview(invoiceData);
            }
            let base=this;
            setTimeout(function(){
                base.exportToPDF();
            })
        }else if(action=='recurring'){
         this.openRecurringDailog();
        }
    }

    setBillUpdate(invoiceData){
        if(this.commissions.length>0||this.deletedCommissions.length>0){
            invoiceData.commissions.forEach(function(commission:any){
                if(commission.amount_type=='percentage'){
                    commission.updateBill=true;
                }
            });
        }
    }

    togelPreview(invoiceData){
        this.showPreview=!this.showPreview;
        if(this.showPreview){
            this.preViewText="Close Preview"
        }else {
            this.preViewText="Preview Invoice"
            this.setCustomerComboBoxValue(invoiceData.customer_id);
        }
    }

    setTemplateSettings(data){
      data.templateType=this.templateType;
      data.tasks=this.tasks;
      data.UOM=this.UOM;
      data.unitCost=this.unitCost;
      data.showDescription=this.showDescription;
      data.showUnitCost=this.showUnitCost;
      data.showUOM=this.showUOM;
      data.showItemName=this.showItemName;
    }


    openEmailDailog(){
        jQuery('#invoice-email-conformation').foundation('open');
    }

    openRecurringDailog(){
      jQuery('#recurring-invoice').foundation('open');
    }

    resetRecurringFields(){
      this.resetRecurringInvoiceFields();
      jQuery('#invoice-email-conformation').foundation('close');
    }

    closeRecurring(){
      jQuery('#recurring-invoice').foundation('close');
    }

    saveRecurring(){
      this.invoiceProcessedData.recurringEnddate=this.dateFormater.formatDate(this.recurringEnddate,this.dateFormat,this.serviceDateformat);
      this.invoiceProcessedData.recurringFrequency=this.recurringFrequency;
      this.closeRecurring();
      this.saveInvoiceDetails(this.invoiceProcessedData);
    }

  resetRecurringInvoiceFields(){
    this.recurringFrequency=null;
    this.recurringEnddate=null;
  }

    closeEmailDailog(){
        this.resetPopupFields();
        this.resetInvoiceState();
    }

    resetInvoiceState(){
      let invoiceData=this._invoiceForm.getData(this.invoiceForm);
      this.togelPreview(invoiceData);
    };

    resetPopupFields(){
      this.resetEmailDailogFields();
      jQuery('#invoice-email-conformation').foundation('close');
    }

    resetEmailDailogFields(){
        this.additionalMails=null;
        this.remainder_name="";
        this.email_notes=null;
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
            this.invoiceProcessedData.recepientsMails=_.uniq(this.invoiceProcessedData.recepientsMails.concat(mails));
        }
        this.invoiceProcessedData.remainder_name=this.remainder_name;
        this.invoiceProcessedData.email_notes=this.email_notes;
        this.invoiceProcessedData.customer_first_name=this.selectedContact.first_name;
        this.invoiceProcessedData.customer_last_name=this.selectedContact.last_name;
        this.saveInvoiceDetails(this.invoiceProcessedData);
        this.resetPopupFields();
    }

    saveInvoiceDetails(invoiceData){
        this.loadingService.triggerLoadingEvent(true);
        delete invoiceData.company;
        delete invoiceData.customer;
        delete invoiceData.logoURL;
        if(invoiceData.sendMail){
          invoiceData.pdf_data=this.PdfData;
        }
        if(this.newInvoice||this.isDuplicate) {
            this.invoiceService.createInvoice(invoiceData).subscribe(resp => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice created successfully");
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
                this.setUpdatedFlagInStates();
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

    setUpdatedFlagInStates(){
        if(this.stateService.states) {
            _.each(this.stateService.states, function(state){
                let data = state.data || {};
                data.refreshData = true;
                state.data = data;
            });
        }
    }

    navigateToDashborad(){
        let prevState = this.stateService.getPrevState();
        if(prevState){
            this._router.navigate([prevState.url]);
        } else{
            let link = ['invoices/dashboard',2];
            this._router.navigate(link);
        }
    }

    selectTerm(term) {
        let days = term == 'custom' ? 0 : term.substring(3, term.length);
        let new_date = moment(this.invoiceForm.controls['invoice_date'].value, this.dateFormat).add(days, 'days');

        let dueDateControl:any = this.invoiceForm.controls['due_date'];
        dueDateControl.patchValue(moment(new_date).format(this.dateFormat));
    }

    itemChange(item,index,type){
        if(this.newInvoice){
            let itemCode = _.find(this.itemCodes, {'id': item});
            let itemsControl:any;
            let itemControl:any;
            /*if(type=='item'){
             itemsControl=this.invoiceForm.controls['invoiceLines'];
             }else if(type=='task'){
             itemsControl=this.invoiceForm.controls['taskLines'];
             }*/
            itemsControl=this.invoiceForm.controls['invoiceLines'];
            if(itemCode){
                itemControl= itemsControl.controls[index];
                itemControl.controls['description'].patchValue(itemCode.desc);
                itemControl.controls['price'].patchValue(itemCode.sales_price);
            }

            this.calculateTotals();
        }
    }


    onCustomerSelect(customer){
      let data = this._invoiceForm.getData(this.invoiceForm);
      if(customer && customer.customer_id){
        data.customer_id = customer.customer_id;
        this.selectedContact=null;
        this.maillIds=[];
        this.getCustomerContacts(customer.customer_id);
        let selectedCustomer = _.find(this.customers, {'customer_id': customer.customer_id});
        this.selectedCustomer=selectedCustomer;
        if(selectedCustomer){
          if(selectedCustomer.term){
            this.selectTerm(selectedCustomer.term);
            let term:any = this.invoiceForm.controls['term'];
            term.patchValue(selectedCustomer.term);
          }
        }
      }else if(!customer||customer=='--None--'){
        data.customer_id='';
      }
      this._invoiceForm.updateForm(this.invoiceForm, data);
    }

    getCustomrtDetails(value){
        //this.getCustomerContacts(value);
        let customer = _.find(this.customers, {'customer_id': value});
        this.selectedCustomer=customer;
        this.additionalMails=customer.email;
    }

    onCustomerContactSelect(id){
        let contact = _.find(this.customerContacts, {'id': id});
        this.selectedContact=contact;
        this.maillIds.push(contact.email);
    }

    getCustomerContacts(id){
      if(!this.isPaymentsNavigation)
        this.loadingService.triggerLoadingEvent(true);
        this.loadContacts(id);
    }

    loadContacts(id){
      if(!this.isPaymentsNavigation)
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
            if(this.newInvoice){
                if(itemCode){
                    this.editItemForm.controls['description'].patchValue(itemCode.desc);
                    this.editItemForm.controls['price'].patchValue(itemCode.sales_price);
                }
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
        /*if(type=="taskLines"){
            itemsControl = this.invoiceForm.controls['taskLines'];
        }else {
            itemsControl = this.invoiceForm.controls['invoiceLines'];
        }*/

        itemsControl = this.invoiceForm.controls['invoiceLines'];
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

  hideHistoryFlyout(){
        this.showInvoiceHistory=false;
        this.showInvoice=true;
        this.titleService.setPageTitle("Edit Invoice");
        this.historyList=[];
        this.count=0;
        let invoiceData = this._invoiceForm.getData(this.invoiceForm);
        this.setCustomerComboBoxValue(invoiceData.customer_id);
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
        /*if(this.editLineType=="taskLines"){
            itemsControl=this.invoiceForm.controls['taskLines'];
        }else {
            itemsControl=this.invoiceForm.controls['invoiceLines'];
        }*/
        itemsControl=this.invoiceForm.controls['invoiceLines'];
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
        }/*else if(!this.hasPaid&&type=='task'){
            linesControl= this.invoiceForm.controls['taskLines'];
            this.resetAllLinesFromEditing(linesControl);
            itemForm.editable = !itemForm.editable;
        }*/
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
        this.amount=this.roundOffValue(this.subTotal+this.taxTotal);
        this.totalAmount=this.roundOffValue(this.amount-this.amount_paid);
        if(this.lateFeeAmount>0){
            this.amount=this.roundOffValue(this.subTotal+this.taxTotal+this.lateFeeAmount);
            this.totalAmount=this.roundOffValue(this.totalAmount+this.lateFeeAmount);
        }
        if(this.discountAmount>0){
          this.totalAmount=this.roundOffValue(this.totalAmount-this.discountAmount);
        }
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
        /*if(type=='task'){
            lineListControl=this.invoiceForm.controls['taskLines'];
        }else if(type=='item'){
            lineListControl=this.invoiceForm.controls['invoiceLines'];
        }*/
        lineListControl=this.invoiceForm.controls['invoiceLines'];
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
                    let calcAmount=lineData.quantity*lineData.price;
                    lineData.amount=base.roundOffValue(calcAmount);
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
                    let calcAmount=lineData.quantity*lineData.price;
                    lineData.amount=base.roundOffValue(calcAmount);
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
                    let calcAmount=lineData.quantity*lineData.price;
                    lineData.amount=base.roundOffValue(calcAmount);
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
                    base.toastService.pop(TOAST_TYPE.error, "Please select "+base.tasks);
                    result = true;
                    return false;
                }
                if(!line.quantity){
                    base.toastService.pop(TOAST_TYPE.error, base.UOM+" should grater than zero");
                    result = true;
                    return false;
                }
                if(!line.price){
                    base.toastService.pop(TOAST_TYPE.error, base.unitCost +" grater than zero");
                    result = true;
                    return false;
                }
            }
        });
        return result;
    }


    exportToPDF(){
        let  pdfReq=this.getPdfData();
      this.loadingService.triggerLoadingEvent(true);
        this.reportService.exportReportIntoFile(PAYMENTSPATHS.PDF_SERVICE, pdfReq)
            .subscribe(data =>{
                var blob=new Blob([data._body], {type:"application/pdf"});
                var link= jQuery('<a></a>');
                link[0].href= URL.createObjectURL(blob);
                link[0].download= "Invoice.pdf";
                link[0].click();
              this.loadingService.triggerLoadingEvent(false);
            }, error =>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to Export report into PDF");
              this.loadingService.triggerLoadingEvent(false);
            });
    }


    getPdfData(){
      let imgString = jQuery('#company-img').clone().html();
      let styleString = "";
      let styleHtml = jQuery('style').clone();
      if(styleHtml && styleHtml.length >= 2){
        for(let i=1; i<styleHtml.length; i++){
          styleString += styleHtml[i].outerHTML;
        }
      }
      let html = jQuery('<div>').append(styleString).append(jQuery('#prev-'+this.templateType).clone()).html();
      if(imgString)
        html = html.replace(imgString,imgString.replace('>','/>'));
      let pdfReq={
        "version" : "1.1",
        "genericReport": {
          "payload": html
        },
      };

      return pdfReq;
    }

    ngOnDestroy(){
        if(jQuery('#invoice-email-conformation'))
            jQuery('#invoice-email-conformation').remove();
        if(this.routeSubscribe){
            this.routeSubscribe.unsubscribe();
        }
      if(jQuery('#recurring-invoice'))
        jQuery('#recurring-invoice').remove();
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

    showHistory(){
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.history(this.invoiceID).subscribe(history => {
            this.titleService.setPageTitle("Invoices History");
            this.showInvoiceHistory=true;
            this.showInvoice=false;
            this.historyList=history;
            this.updateCredits(this.historyList);
            this.loadingService.triggerLoadingEvent(false);
        }, error => {
            this.toastService.pop(TOAST_TYPE.error, "Failed to load invoice history");
            this.loadingService.triggerLoadingEvent(false);
        });
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

    fileOverBase(e: any) {
        this.hasBaseDropZoneOver = e;
        this.uploader.queue.forEach(function (item) {
            item.upload();
        });
    }

    startUpload($event) {
        let base = this;
        setTimeout(function () {
            base.uploader.uploadAll();
        }, 500);
    }

    deleteDocument() {
        //Invoke delete document service
    }

    removeUploadItem(item) {
        item.remove();
        this.deleteDocument();
    }

    compileLink() {
        if (this.document && this.document.temporaryURL) {
            let data={id:this.document.id,
                name:this.document.name,
                temporaryURL:this.document.temporaryURL
            };
            this.attachments.push(data);
        }
    }

    removeAttachment(attachment){
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.removeInvoiceAttachment(attachment.id,Session.getCurrentCompany()).subscribe(attachments => {
            _.remove(this.attachments, {
                id: attachment.id
            });
            this.closeLoader();
            this.toastService.pop(TOAST_TYPE.success, "Attachment deleted successfully");
        }, error => {
            if(error){
                if(error&&JSON.parse(error))
                    this.toastService.pop(TOAST_TYPE.error, JSON.parse(error).message);
                else
                    this.toastService.pop(TOAST_TYPE.error, "Failed to delete attachment");
                this.closeLoader();
            }
        });
    }

    getInvoiceAttachments(sourceId){
        this.invoiceService.getDocumentByInvoice(Session.getCurrentCompany(),sourceId).subscribe(attachments => {
            //this.attachments=attachments;
            this.setAttachments(attachments);
        }, error => {
        });
    }

    setAttachments(attachmnets){
        let base=this;
        if(this.storedAttachments.length>0){
            _.forEach(this.storedAttachments, function(value) {
                let attachment=_.find(attachmnets, function(o) { return o.id == value.id; });
                if(attachment){
                    base.attachments.push(attachment);
                }
            });
        }
    }

    //invoice commission changes

    applyCommission(){
        this.showCommission=true;
        this.showInvoice=false;
        if(this.newInvoice){
            this.titleService.setPageTitle("Add Commission");
        }else if(!this.newInvoice&&this.invoice.commission){
            this.titleService.setPageTitle("Edit Commission");
        }else {
            this.titleService.setPageTitle("Add Commission");
        }
    }

    loadVendors(){
        this.companyService.vendors(Session.getCurrentCompany())
            .subscribe(vendors => {
                this.vendors=vendors;
            }, error => this.handleError(error));
    }

    createCommission(){
        let commission= _.clone(this.commissionObj);
        if(this.isEditCommissionMode){
            let commissionLine=this.getFormattedCommission(commission);
            commissionLine.updateBill=true;
            this.commissions[this.editCommissionIndex]=commissionLine;
        }else {
            let commissionLine=this.getFormattedCommission(commission);
            this.commissions.push(commissionLine);
        }
        this.resetCommission();
    }

    getFormattedCommission(commission){
        let commissionLine={amount:0,item_id:"",amount_type:"",item_name:"",vendor_id:"",event_at:"",updateBill:false,event_type:"",event_date:"",bill_id:""};
        commissionLine.amount=commission.amount,
            commissionLine.item_id=commission.item_id,
            commissionLine.amount_type=commission.amount_type,
            commissionLine.item_name=this.getItemCodeName(commission.item_id),
            commissionLine.vendor_id=commission.vendor_id,
            commissionLine.event_at=commission.event_at,
            commissionLine.updateBill=true;
        if(commission.bill_id){
            commissionLine.bill_id=commission.bill_id
        }
        if(this.commissionObj.event_at!='custom'){
            commissionLine.event_type='string';
        }else {
            commissionLine.event_type='date';
            commissionLine.event_date=this.dateFormater.formatDate(this.commissionObj.event_date,this.dateFormat,this.serviceDateformat);
        }
        return commissionLine
    }

    resetCommission(){
        this.commissionObj.amount=0;
        this.commissionObj.item_id="";
        this.commissionObj.amount_type="";
        this.commissionObj.event_at="";
        this.commissionObj.event_date="";
        this.commissionObj.event_type="";
        this.commissionObj.vendor_id="";
        this.showAddCommission=false;
        this.isEditCommissionMode=false;
    }

    getVendorName(id){
        let vendor = _.find(this.vendors, {'id': id});
        return vendor? vendor.name: '';
    }

    saveCommission(){
        this.showCommission=false;
        this.showInvoice=true;
    }

    validateCommission(){
        if(this.commissionObj.vendor_id&&this.commissionObj.item_id&&this.commissionObj.amount>0){
            return false;
        }
        return true;
    }

    deleteCommission(commissionObj,index){
        let commission=this.commissions[index];
        if(commissionObj.bill_id){
            commission.delete=true;
            this.deletedCommissions.push(commission);
            this.commissions.splice(index, 1);
        }else{
            this.commissions.splice(index, 1);
        }
    }

    setEventDate(date){
        this.commissionObj.event_date=date;
    }

    editCommission(commission,index){
        this.isEditCommissionMode=true;
        this.showAddCommission=true;
        this.commissionObj=_.clone(commission);
        this.editCommissionIndex=index;
    }

    addCommissionLine(){
        this.showAddCommission=true;
    }

    getEventTypeName(type){
        let eventTypes={flat_fee:'Flat Fee',percentage:'Percentage'};
        return eventTypes[type];
    }

    getEventAtName(type){
        let eventAt={create:'Create',paid:'Paid',custom:'Custom'};
        return eventAt[type];
    }

    validateLateFeeAmount(){
        if(this.lateFeeAmount>0){
            return true;
        }
        return false;
    }

    validateDiscountAmount(){
      if(this.discountAmount>0){
        return true;
      }
      return false;
    }

    setInvoiceValidators(){
      let validator = [Validators.required];
      let tempForm = _.cloneDeep(this._invoiceForm.getForm());
      tempForm.billing_from=['', validator];
      tempForm.billing_to=['', validator];
      tempForm['invoiceLines'] = this.invoiceLineArray;
      this.invoiceForm = this._fb.group(tempForm);
    }

  setBillingFromDate(date){
    let paymentDateControl:any = this.invoiceForm.controls['billing_from'];
    paymentDateControl.patchValue(date);
  }

  setBillingToDate(date){
    let planEndDateControl:any = this.invoiceForm.controls['billing_to'];
    planEndDateControl.patchValue(date);
  }

  setEndDate(date:string) {
    this.recurringEnddate=date;
  }

    roundOffValue(num){
        return Math.round(num * 100) / 100
    }



  getDiscountAmountValue(){
    let dueDate=this.dateFormater.formatDate(this.invoice.due_date,this.dateFormat,this.serviceDateformat);
    let data={
      due_date:dueDate,
      amount:this.invoice.amount
    };
    this.discountsService.getDiscountAmount(data,this.invoice.discount_id,Session.getCurrentCompany()).subscribe(discount => {
      this.discountAmount=this.roundOffValue(discount.discount_amount);
    }, error => this.handleError(error));
  }

  showPaymentDetails(){
    this.showInvoicePaymentDetails=true;
    this.showInvoice=false;
    this.titleService.setPageTitle("Invoice Payments");
    this.loadingService.triggerLoadingEvent(true);
    this.invoiceService.getInvoicePayments(this.invoiceID).subscribe(payments=>{
    this.payments=payments;
    this.buildInvoicePaymentsData();
    },error=>{
      this.toastService.pop(TOAST_TYPE.error, "Failed to get payment details");
    })
  }

  buildInvoicePaymentsData(){
    this.hasPaidInvoices = false;
    this.paidInvoiceTableData.defSearch = true;
    this.paidInvoiceTableData.rows = [];
    this.paidInvoiceTableData.columns = [
      {"name": "id", "title": "id", "visible": false},
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
      let paymentType=payment.type=='cheque'?'Check':payment.type;
      row['type'] = "<div>"+paymentType+"</div><div><small>"+payment.referenceNo+"</small></div>";
      row['receivedFrom'] = payment['customerName'];
      row['dateReceived'] = (payment['paymentDate']) ? base.dateFormater.formatDate(payment['paymentDate'],base.serviceDateformat,base.dateFormat) : payment['paymentDate'];
      let assignStatus = "";
      let assignedAmount = 0;
      let assignmentHtml = "";

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
      base.numeralService.switchLocale(payment.currencyCode.toLowerCase());
      row['amount'] = "<div>"+base.numeralService.format("$0,0.00", payment.paymentAmount)+"</div><div>"+assignmentHtml+"</div>";
      row['actions'] = "<a class='action' data-action='edit' style='margin:0px 0px 0px 5px;'><i class='icon ion-edit'></i></a>";
      base.paidInvoiceTableData.rows.push(row);
    });

    setTimeout(function(){
      base.hasPaidInvoices = true;
    }, 0);
    this.loadingService.triggerLoadingEvent(false);
  }

  handleAction($event){
    let data={
      invoiceData:this.invoice,
      historyData:this.historyList,
      paymentsData:this.payments
    };
    this.stateService.addState(new State('InvoicePayments', this._router.url, data, null));
    let link = ['payments/edit', $event.id];
    this._router.navigate(link);
  }

}
