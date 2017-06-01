/**
 * Created by seshagirivellanki on 02/02/17.
 */

import {Injectable} from "@angular/core";
import {abstractForm} from "qCommon/app/forms/abstractForm";
import {Validators} from "@angular/forms";

@Injectable()
export class InvoiceForm extends abstractForm{

    getForm() {
        var numberValidator = [];
        numberValidator.push(Validators.pattern);
        numberValidator.push(Validators.required);

        return {
            "id":[""],
            "customer_id": ["", Validators.required],
            "company_id": ["", Validators.required],
            "po_number": ["", Validators.required],
            "invoice_date": ["", Validators.required],
            "payment_date": ["", Validators.required],
            "locale": [""],
            "customer_name":[""]
        }
    }

}

