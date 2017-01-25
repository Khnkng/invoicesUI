/**
 * Created by seshu on 25-07-2016.
 */

import {Http, Response} from "@angular/http";
import {Injectable} from "@angular/core";
import {QountServices} from "qCommon/app/services/QountServices";
import {PATH, SOURCE_TYPE} from "qCommon/app/constants/Qount.constants";
import {Session} from "qCommon/app/services/Session";
import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import "rxjs/add/observable/throw";


@Injectable()
export class InvoicesService extends QountServices {

    constructor(http:Http) {
        super(http);
    }

    getDocumentServiceUrl():string {
        var url = this.interpolateUrl(PATH.DOCUMENT_SERVICE,null,{id: Session.getUser().id});
        url = PATH.DOCUMENT_SERVICE_URL + url;
        return url;
    }
}
