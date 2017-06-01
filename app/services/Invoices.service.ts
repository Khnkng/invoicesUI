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


@Injectable()
export class InvoicesService extends QountServices {

    constructor(http:Http) {
        super(http);
    }

    getDocumentServiceUrl():string {
        let url = this.interpolateUrl(PATH.DOCUMENT_SERVICE,null,{id: Session.getUser().id});
        url = PATH.DOCUMENT_SERVICE_URL + url;
        return url;
    }

    createPreference(data, companyId:string): Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PREFERENCE,null,{id: Session.getUser().id,companyId: companyId});
        return this.create(url, data, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getPreference(companyId:String): Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PREFERENCE,null,{id: Session.getUser().id, companyId: companyId});
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

    invoices() : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getInvoice(invoiceId) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.query(url+"/"+invoiceId, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    deleteInvoice(invoiceId) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE,null,{id: Session.getUser().id,companyId:Session.getCurrentCompany()});
        return this.delete(url+"/"+invoiceId, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }

    getPaymentInvoice(invoiceId) : Observable<any> {
        let url = this.interpolateUrl(INVOICE_PATHS.INVOICE_PAY,null,{invoiceID: invoiceId});
        return this.query(url, SOURCE_TYPE.JAVA).map(res => <any> res.json())
            .catch(this.handleError)
    }


    private handleError (error: Response) {
        return Observable.throw(error.text());
    }
}
