/**
 * Created by seshu on 25-07-2016.
 */

import {Http, Response} from "@angular/http";
import {Injectable} from "@angular/core";
import {QountServices} from "qCommon/app/services/QountServices";
import {PATH, SOURCE_TYPE} from "qCommon/app/constants/Qount.constants";
import {Session} from "qCommon/app/services/Session";
import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import "rxjs/add/observable/throw";
import {INVOICE_PATHS} from "../constants/invoices.constants";
import {UrlService} from "qCommon/app/services/UrlService";

@Injectable()
export class InvoicesService extends QountServices {

    constructor(http:Http) {
        super(http);
    }

    getDocumentServiceUrl():string {
        let url = this.interpolateUrl(PATH.DOCUMENT_SERVICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        url = UrlService.getBaseUrl('DOCUMENT') + url;
        return url;
    }

    createPreference(data, companyId:string): Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PREFERENCE,null,{id: Session.getUser().id,companyId: companyId});
        return this.create(url, data, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getPreference(companyId:String,userID:String): Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PREFERENCE,null,{id: userID, companyId: companyId});
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    updatePreference(data, id:string, companyId:string): Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PREFERENCE,null,{id: Session.getUser().id,companyId:companyId});
        return this.update(url+"/"+id, data, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }


    createInvoice(invoiceData) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.create(url, invoiceData, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    updateInvoice(invoiceData) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.update(url+"/"+invoiceData.id, invoiceData, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    invoices(state) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.query(url+"?state="+state, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    invoicesByClientId(clientID): Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_BY_CLIENTID,
            null,{id: Session.getUser().id,companyId:Session.getCurrentCompany(),clientId:clientID});
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    allInvoices(): Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getInvoice(invoiceId) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.query(url+"/"+invoiceId, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    deleteInvoice(invoiceIds) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_DELETE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.create(url,invoiceIds,SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    markAsSentInvoice(invoiceIds) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_SENT,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.update(url,invoiceIds,SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getPaymentInvoice(invoiceId) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAY,null,{invoiceID: invoiceId});
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    payInvoice(data,invoiceId) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAY,null,{invoiceID: invoiceId});
        return this.create(url+"?action=pay", data, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    addPayment(payment:any) {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAYMENTS,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.create(url, payment, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    payment(paymentId:string) {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAYMENTS,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.query(url+"/"+paymentId, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getPayments() {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAYMENTS,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    markAsPaid(data,invoiceId) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAID,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany(),invoiceId: invoiceId});
        return this.update(url, data, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getInvoicesCount(){
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.query(url+"/count", SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getCompanyLogo(companyId: string, userId:any):any {
        var url = this.interpolateUrl(PATH.DOCUMENTS_SERVICE,null,{id: userId, companyId: companyId, type: 'company_invoice', mappedId: companyId});
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any>res.json())
            .catch(this.handleError)
    }

    getDashboardBoxData(companyId: string, startDate: string, endDate: string){
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_DASHBOARD_BOX, null, {id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        let query = "";
        if(startDate && endDate){
            query = "?startDate="+startDate+"&endDate="+endDate;
        }
        return this.query(url+query, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    history(invoiceId) : Observable<any> {
      let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_HISTORY,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany(),invoiceId:invoiceId});
      return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
        .catch(this.handleError)
    }

    getDocumentByInvoice(companyId: string, invoiceId:any):any {
      var url = this.interpolateUrl(INVOICE_PATHS.DOCUMENTS_SERVICE,null,{id: Session.getUser().id, companyId: companyId, type: 'invoice_attachment', mappedId: invoiceId});
      return this.query(url, SOURCE_TYPE.JAVA).map(res => <any>res.json())
        .catch(this.handleError)
    }

  removeInvoiceAttachment(id, companyId): Observable<any> {
    var url = this.interpolateUrl(INVOICE_PATHS.DOCUMENT_SERVICE_BASE,null,{id: Session.getUser().id, companyId: companyId});
    return this.delete(url+'/'+id, SOURCE_TYPE.JAVA).map(res => <any> res.json())
      .catch(this.handleError)
  }

    private handleError (error: Response) {
        return Observable.throw(error.text());
    }

    getInvoiceTable(companyId:string,currentpayment:string): Observable<any> {
        let url = this.interpolateUrl(PATH.INVOICE_DETAIL_SERVICE,null,{id: Session.getUser().id, companyId:companyId});
        return this.query(url+"/details?filter="+currentpayment, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    customerInvoices(customerId,billId?) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.CUSTOMER_INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany(),customerId:customerId});
        if(billId){
        url=url+"?billId="+billId;
        }
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getUnappliedCollections(companyId) {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAYMENTS + "?unapplied=true", null, {
            id: Session.getUser().id,
            companyId: companyId
        });
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getPaymentInvoices(paymentID:string){
      let url = this.interpolateUrl(INVOICE_PATHS.PAYMENT_INVOICES,null,{id: Session.getUser().id, companyId: Session.getCurrentCompany(), paymentID: paymentID});
      return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
        .catch(this.handleError)
    }

    getInvoicePayments(invoiceId){
      let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAYMENTS,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        url=url+"?invoiceId="+invoiceId;
      return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
        .catch(this.handleError)
    }

}
