/**
 * Created by seshagirivellanki on 09/02/17.
 */


import {Injectable} from "@angular/core";
import {abstractForm} from "qCommon/app/forms/abstractForm";
import {Validators} from "@angular/forms";


@Injectable()
export class InvoiceLineForm extends abstractForm{

    getForm(model?:any) {
        return {
            item_id:[model ? model.item_id : '', Validators.required],
            description:[model ? model.description : '', Validators.required],
            quantity:[model ? model.quantity : 0, Validators.required],
            price:[model ? model.price : 0, Validators.required],
        };
    }

}

@Injectable()
export class InvoiceLineTaxesForm extends abstractForm {
    getForm(model?:any) {
        return {
            tax_id:[model ? model.tax_id : '', Validators.required]
        };
    }
}