
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

@NgModule({
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ShareModule, RouterModule.forChild([
        {path: 'invoices/dashboard/:tabId', component: InvoiceDashboardComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/edit/:invoiceID', component: InvoiceComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/NewInvoice', component: InvoiceComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/invoiceSettings', component: InvoiceSettingsComponent, canActivate: [LoggedInActivator]}
    ])],
    declarations: [InvoiceCustomDatepicker, InvoiceSettingsComponent, InvoiceDashboardComponent, InvoiceComponent],
    exports: [RouterModule, InvoiceCustomDatepicker],
    providers: [InvoiceSettingsForm, InvoicesService],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class InvoicesModule {

}