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


declare let jQuery:any;
declare let _:any;
declare let moment:any;

@Component({
    selector: 'addInvoicePayment',
    templateUrl: '/app/views/addPaymentsToInvoice.html',
})

export class InvoiceAddPayment{
    localeFortmat:string='en-US';
    routeSub:any;
    invoiceID:string;
    invoiceData:any;
    hasInvoiceData: boolean = false;
    dateFormat:string;
    applyObject:any={'reference_number':'','payment_date':'','payment_method':'cash','amount':'','bank_account_id':''};
    paymentOptions:Array<any>=[{'name':'Cash','value':'cash'},{'name':'Credit/Debit','value':'card'},{'name':'Check','value':'cheque'},{'name':'PayPal','value':'paypal'},{'name':'ACH','value':'ach'},{'name':'Transfer','value':'transfer'}];
    routeSubscribe:any;
    companyAddress:any;

    constructor(private switchBoard: SwitchBoard, private _router:Router, private _route: ActivatedRoute, private toastService: ToastService,
                private loadingService:LoadingService, private titleService:pageTitleService, private stateService: StateService, private invoiceService: InvoicesService,private customerService: CustomersService,private dateFormater:DateFormater,
                private accountsService: FinancialAccountsService, private companyService: CompaniesService){
        this.titleService.setPageTitle("Add Payment To Invoice");
        this.dateFormat = dateFormater.getFormat();
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
                this.loadInvoiceData();
            },error=>{
                this.toastService.pop(TOAST_TYPE.error, "Failed to load your Company details");
            });

    }

    gotoPreviousState() {
        let prevState = this.stateService.getPrevState();
        if (prevState) {
            this._router.navigate([prevState.url]);
        }
    }
    loadInvoiceData() {
        let base = this;
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.getInvoice(this.invoiceID).subscribe(invoices=>{
            if(invoices) {
                invoices.company=this.companyAddress;
                base.invoiceData = invoices;
                this.applyObject.reference_number = invoices.number;
                base.hasInvoiceData = true;
            }
            this.loadingService.triggerLoadingEvent(false);
        },error=>this.handleError(error));
    }

    setPaymentMethod(paymentMethod){
        this.applyObject.payment_method = paymentMethod.target.value;
    }

    handleError(error) {
        this.loadingService.triggerLoadingEvent(false);
        this.toastService.pop(TOAST_TYPE.error, "Failed to perform operation");
    }

    applyPayment(){
        console.log(this.applyObject);
        if(!this.applyObject.bank_account_id){
            this.toastService.pop(TOAST_TYPE.error, "Please select bank account");
            return;
        }
        if(!this.applyObject.reference_number){
            this.toastService.pop(TOAST_TYPE.error, "Please enter reference number");
            return;
        }
        if(!this.applyObject.payment_date){
            this.toastService.pop(TOAST_TYPE.error, "Please select date");
            return;
        }
        if(!this.applyObject.amount){
            this.toastService.pop(TOAST_TYPE.error, "Please enter amount");
            return;
        }
        this.applyObject['state'] = 'paid';
        this.applyObject['currency'] = this.invoiceData.currency;
        this.applyObject['customer_id'] = this.invoiceData.customer_id;
        this.loadingService.triggerLoadingEvent(true);
        this.invoiceService.markAsPaid(this.applyObject,this.invoiceID).subscribe(success => {
                this.toastService.pop(TOAST_TYPE.success, "Invoice paid successfully.");
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
                        this.toastService.pop(TOAST_TYPE.error, "Invoice payment failed.");
                    }
                }else {
                    this.toastService.pop(TOAST_TYPE.error, "Invoice payment failed.");
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

}
