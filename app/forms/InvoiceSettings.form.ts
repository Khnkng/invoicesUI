/**
 * Created by Chandu on 28-09-2016.
 */

import {Injectable} from "@angular/core";
import {abstractForm} from "qCommon/app/forms/abstractForm";
import {Validators} from "@angular/forms";

@Injectable()
export class InvoiceSettingsForm extends abstractForm{

    getForm() {
        var numberValidator = [];
        numberValidator.push(Validators.pattern);
        numberValidator.push(Validators.required);
        return {
            "templateType": ["Default"],
            "companyLogo": [""],
            "documentId": [""],
            "displayLogo": [false],
            "accentColor": ["", Validators.required],
            "defaultPaymentTerms": [""],
            "defaultTitle": ["", Validators.required],
            "defaultSubHeading": [""],
            "defaultFooter": [""],
            "standardMemo": [""],
            "items": ["Item"],
            "units": ["Unit"],
            "price": ["Price"],
            "amount": ["Amount"],
            "hideItemName": [false],
            "hideItemDescription": [false],
            "hideUnits": [false],
            "hidePrice": [false],
            "hideAmount": [false],
            "displayCommission":[false],

            "otherItems": [""],
            "otherUnits": [""],
            "otherPrice": [""],
            "otherAmount": [""]
        }
    }

}
