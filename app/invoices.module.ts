
import {RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {ShareModule} from "qCommon/app/share.module"
import {NgModule, CUSTOM_ELEMENTS_SCHEMA} from "@angular/core";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {LoggedInActivator} from "qCommon/app/services/CheckSessionActivator"
import {InvoiceCustomDatepicker} from "./directives/customDatepicker";
import {InvoiceSettingsComponent} from "./components/InvoiceSettings.component";
import {InvoiceSettingsForm} from "./forms/InvoiceSettings.form";
import {InvoicesService} from "./services/Invoices.service";
import {InvoiceDashboardComponent} from "./components/InvoiceDashboard.component";
import {InvoiceComponent} from "./components/Invoice.component";
import {InvoiceForm} from "./forms/Invoice.form";
import {InvoiceLineForm, InvoiceLineTaxesForm} from "./forms/InvoiceLine.form";
import {InvoicesComponent} from "./components/invoices.component";
import {CustomDatepicker1} from "./directives/customDatepicker1";

@NgModule({
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ShareModule, RouterModule.forChild([
        {path: 'invoices/dashboard/:tabId', component: InvoiceDashboardComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/edit/:invoiceID', component: InvoiceComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/NewInvoice', component: InvoiceComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/', component: InvoicesComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/invoiceSettings', component: InvoiceSettingsComponent, canActivate: [LoggedInActivator]}
    ])],
    declarations: [InvoiceCustomDatepicker, CustomDatepicker1, InvoiceSettingsComponent, InvoiceDashboardComponent,
            InvoiceComponent, InvoicesComponent, InvoiceCustomDatepicker],
    exports: [RouterModule, CustomDatepicker1],
    providers: [InvoiceSettingsForm, InvoicesService, InvoiceForm, InvoiceLineForm, InvoiceLineTaxesForm],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})


export class InvoicesModule {

}