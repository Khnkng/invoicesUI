
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {ShareModule} from "qCommon/app/share.module"
import {NgModule, CUSTOM_ELEMENTS_SCHEMA} from "@angular/core";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {LoggedInActivator} from "qCommon/app/services/CheckSessionActivator"
import {CustomDatepicker} from "./directives/customDatepicker";
import {CustomDatepicker1} from "./directives/customDatepicker1";
import {InvoiceSettingsComponent} from "./components/InvoiceSettings.component";

@NgModule({
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ShareModule, RouterModule.forChild([
        {path: 'invoices/invoiceSettings', component: InvoiceSettingsComponent, canActivate: [LoggedInActivator]}
    ])],
    declarations: [CustomDatepicker, CustomDatepicker1],
    exports: [RouterModule, CustomDatepicker, CustomDatepicker1],
    providers: [],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class InvoicesModule {

}