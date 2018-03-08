/**
 * Created by seshagirivellanki on 06/07/17.
 */

import {Injectable} from "@angular/core";
import {Validators} from "@angular/forms";
import {abstractForm} from "qCommon/app/forms/abstractForm";


@Injectable()
export class InvoicePaymentForm extends abstractForm{

    getForm() {
        var numberValidator = [];
        numberValidator.push(Validators.pattern);
        numberValidator.push(Validators.required);

        return {
            "id": [""],
            "receivedFrom": ["", Validators.required],
            "paymentAmount": ["", numberValidator],
            "currencyCode": ["", Validators.required],
            "referenceNo": ["", Validators.required],
            "paymentDate": ["", Validators.required],
            "type": ["", Validators.required],
            "memo": [""],
            "paymentNote": [""],
            "depositedTo": [""],
            "payment_status":[""]
        }
    }

}