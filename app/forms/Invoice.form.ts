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
            "company_id": [""],
            "invoice_date": ["", Validators.required],
            "due_date": ["", Validators.required],
            "locale": [""],
            "customer_name":[""],
            "amount":[""],
            "term":[""],
            "notes":[""],
            "currency":["",Validators.required],
            "number":["", Validators.required],
            "discount":[""],
            "amount_paid":[""],
            "sub_total":[""],
            "send_to":["",Validators.required],
            "tax_amount":[""],
            "payment_options":[""],
            "attachments_metadata":[""],
            "late_fee_id":[""]
        }
    }

}

