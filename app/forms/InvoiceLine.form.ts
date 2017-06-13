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
            name:[model?model.name:''],
            amount:[model?model.amount:0]
        };
    }

}

@Injectable()
export class InvoiceLineTaxesForm extends abstractForm {
    getForm(model?:any) {
        return {
            tax_id:[model ? model.tax_id : '', Validators.required],
            tax_rate:[model?model.tax_rate:''],
            name:[model?model.name:'']
        };
    }
}