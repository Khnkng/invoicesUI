import {Component} from "@angular/core";
import {SwitchBoard} from "qCommon/app/services/SwitchBoard";
import {ToastService} from "qCommon/app/services/Toast.service";
import {LoadingService} from "qCommon/app/services/LoadingService";
import {pageTitleService} from "qCommon/app/services/PageTitle";
import {ActivatedRoute, Router} from "@angular/router";
import {InvoicesService} from "../services/Invoices.service";
import {TOAST_TYPE} from "qCommon/app/constants/Qount.constants";
import {CustomersService} from "qCommon/app/services/Customers.service";
import {DateFormater} from "qCommon/app/services/DateFormatter.service";
import {StateService} from "qCommon/app/services/StateService";
import {FinancialAccountsService} from "qCommon/app/services/FinancialAccounts.service";
import {Session} from "qCommon/app/services/Session";
import {CompaniesService} from "qCommon/app/services/Companies.service";
import {DiscountService} from "qCommon/app/services/Discounts.service";

declare let jQuery:any;
declare let _:any;
declare let moment:any;

@Component({
    selector: 'addInvoicePayment',
    templateUrl: '../views/addPaymentsToInvoice.html',
})

export class InvoiceAddPayment{
    localeFortmat:string='en-US';
    routeSub:any;
    invoiceID:string;
    invoiceData:any;
    hasInvoiceData: boolean = false;
    dateFormat:string;
    serviceDateformat:string;
    applyObject:any={'reference_number':'','payment_date':'','payment_method':'Cash','amount':'','bank_account_id':''};
    paymentOptions:Array<any>=[{'name':'Cash','value':'Cash'},{'name':'Credit/Debit','value':'Card'},{'name':'Check','value':'Check'},{'name':'Paypal','value':'Paypal'},{'name':'ACH','value':'ACH'},{'name':'Transfer','value':'Transfer'}];
    routeSubscribe:any;
    companyAddress:any;
    accounts:any;
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
    discountAmount:number=0;

    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private stateService: StateService, private invoiceService: InvoicesService,private customerService: CustomersService,private dateFormater:DateFormater,
                private accountsService: FinancialAccountsService, private companyService: CompaniesService,private  discountsService:DiscountService){
        this.titleService.setPageTitle("Add Payment To Invoice");
        this.dateFormat = dateFormater.getFormat();
        this.serviceDateformat = dateFormater.getServiceDateformat();
        this.routeSub = this._route.params.subscribe(params => {
            this.invoiceID=params['invoiceID'];
        });
        this.routeSubscribe = switchBoard.onClickPrev.subscribe(title => {
            this.gotoPreviousState();
        });
        this.accountsService.financialAccounts(Session.getCurrentCompany())
            .subscribe(accounts=> {
                this.accounts = accounts.accounts;
            }, error => {

            });
        this.getCompanyDetails();
    }

    getCompanyDetails(){
        this.loadingService.triggerLoadingEvent(true);
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
                this.loadInvoicePreferences();
            },error=>{
                this.loadingService.triggerLoadingEvent(false);
                this.toastService.pop(TOAST_TYPE.error, "Failed To Load Your Company Details");
            });

    }

    gotoPreviousState() {
        let prevState = this.stateService.getPrevState();
        if (prevState) {
            this._router.navigate([prevState.url]);
        }
    }

    loadInvoicePreferences(){
      this.invoiceService.getPreference(Session.getCurrentCompany(),Session.getUser().id)
        .subscribe(preference => {
          if(preference){
            this.tasks=preference.items;
            this.UOM=preference.units;
            this.unitCost=preference.price;
            this.showDescription=preference.hideItemDescription;
            this.showUnitCost=preference.hidePrice;
            this.showUOM=preference.hideUnits;
            this.showItemName=preference.hideItemName;
            this.templateType=preference.templateType;
            this.loadInvoiceData();
          }else {
            this.loadingService.triggerLoadingEvent(false);
            this.toastService.pop(TOAST_TYPE.error, "Please Create Invoice Settings");
          }
        }, error =>{
          this.toastService.pop(TOAST_TYPE.error, "Please Create Invoice Settings");
        });
    }

    loadInvoiceData() {
        this.invoiceService.getInvoice(this.invoiceID).subscribe(invoices=>{
            if(invoices) {
                invoices.company=this.companyAddress;
                this.setTemplateSettings(invoices);
                this.invoiceData = invoices;
                if(invoices.is_past_due){
                    this.invoiceData.isPastDue=invoices.is_past_due
                }
                if(this.invoiceData.state!="partially_paid"&&this.invoiceData.is_discount_applied&&this.invoiceData.discount_id){
                  this.getDiscountAmount();
                }
                this.applyObject.reference_number = invoices.number;
                this.hasInvoiceData = true;
            }
            this.loadingService.triggerLoadingEvent(false);
        },error=>this.handleError(error));
    }

    setPaymentMethod(paymentMethod){
        this.applyObject.payment_method = paymentMethod.target.value;
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

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Failed To Perform Operation");
    }

    applyPayment(){
        if(!this.applyObject.bank_account_id){
            this.toastService.pop(TOAST_TYPE.error, "Please Select Bank Account");
            return;
        }
        if(!this.applyObject.reference_number){
            this.toastService.pop(TOAST_TYPE.error, "Please Enter Reference Number");
            return;
        }
        if(!this.applyObject.payment_date){
            this.toastService.pop(TOAST_TYPE.error, "Please Select Date");
            return;
        }
        if(!this.applyObject.amount){
            this.toastService.pop(TOAST_TYPE.error, "Please Enter Amount");
            return;
        }
        this.applyObject['state'] = 'paid';
        this.applyObject['currency'] = this.invoiceData.currency;
        this.applyObject['customer_id'] = this.invoiceData.customer_id;
        if(this.discountAmount>0&&this.invoiceData.is_discount_applied&&this.invoiceData.discount_id&&(this.invoiceData.amount==this.roundOffValue(this.applyObject.amount+this.discountAmount))){
          this.applyObject['discount']=this.discountAmount;
        }
        this.applyObject.payment_date = this.dateFormater.formatDate(this.applyObject.payment_date, this.dateFormat, this.serviceDateformat);
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.markAsPaid(this.applyObject,this.invoiceID).subscribe(success => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice Paid Successfully.");
                this.loadingService.triggerLoadingEvent(false);
                this.navigateToDashborad();
            },
            error => {
                this.loadingService.triggerLoadingEvent(false);
                if(error){
                    let res=JSON.parse(error);
                    if(res&&res.message){
                        this.toastService.pop(TOAST_TYPE.error, res.message);
                    }else {
                        this.toastService.pop(TOAST_TYPE.error, "Invoice Payment Failed.");
                    }
                }else {
                    this.toastService.pop(TOAST_TYPE.error, "Invoice Payment Failed.");
                }
            });
    }

    navigateToDashborad(){
        let link = ['invoices/dashboard',2];
        this._router.navigate(link);
    }
    ngOnDestroy(){
        this.routeSubscribe.unsubscribe();
    }

    ngOnInit(){

    }

    setBankAccount(account){
        if(account && account.id){
            this.applyObject.bank_account_id = account.id;
        }else if(!account||account=='--None--'){
            this.applyObject.bank_account_id='';
        }
    }

    setDate(date){
        this.applyObject.payment_date = date;
    }

  getDiscountAmount(){
    let dueDate=this.dateFormater.formatDate(this.invoiceData.due_date,this.dateFormat,this.serviceDateformat);
    let data={
      due_date:dueDate,
      amount:this.invoiceData.amount
    };
    this.discountsService.getDiscountAmount(data,this.invoiceData.discount_id,Session.getCurrentCompany()).subscribe(discount => {
      this.discountAmount=this.roundOffValue(discount.discount_amount);
    }, error => this.handleError(error));
  }

  roundOffValue(num){
    return Math.round(num * 100) / 100
  }

}
