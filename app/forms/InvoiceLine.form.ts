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
            item_id:[model ? model.item_id : ''],
            description:[model ? model.description : ''],
            quantity:[model ? model.quantity : 0],
            price:[model ? model.price : 0],
            name:[model?model.name:''],
            amount:[model?model.amount:0],
            destroy: [model? model.destroy: false],
            type: [model? model.type: ''],
            tax_id:[model? model.tax_id: ''],
            id:[model ? model.id : '']
        };
    }

}

@Injectable()
export class InvoiceLineTaxesForm extends abstractForm {
    getForm(model?:any) {
        return {
            tax_id:[model ? model.tax_id : ''],
            tax_rate:[model?model.tax_rate:''],
            name:[model?model.name:'']
        };
    }
}