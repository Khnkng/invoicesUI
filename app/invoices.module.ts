
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
import {CustomDatepicker1} from "./directives/customDatepicker1";
import {InvoicePayComponent} from "./components/invoicePay.component";
import {DashBoardActivator} from "qCommon/app/services/DashBoardActivator";
import {InvoiceAddPaymentComponent} from "./components/invoiceAddPayment.component";
import {InvoicePaymentForm} from "./forms/invoicePayment.form";
import {InvoiceAddPayment} from "./components/AddPaymentToInvoice.component";
import {InvoicePaymentPreview} from "./components/InvoicePaymentPreview.component";
import {InvoiceTableComponent} from "./components/InvoiceTable.component";
import {UnappliedCollections} from "./components/UnappliedCollections.component";
import {UnassignedCollections} from "./components/UnassignedCollections.component";
import {PaymentInvoices} from "./components/PaymentInvoices.component";
import {InvoicePayments} from "./components/InvoicePayments.component";
import {CustomerActivityComponent} from "./components/CustomerActivity.component";

@NgModule({
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ShareModule, RouterModule.forChild([
        {path: 'invoices/dashboard/:tabId', component: InvoiceDashboardComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/edit/:invoiceID', component: InvoiceComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/duplicate/:invoiceID', component: InvoiceComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/NewInvoice', component: InvoiceComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/invoiceSettings', component: InvoiceSettingsComponent, canActivate: [LoggedInActivator]},
        {path: 'invoices/addPayment', component: InvoiceAddPaymentComponent, canActivate: [LoggedInActivator]},
        {path: 'payments/edit/:paymentID', component: InvoiceAddPaymentComponent, canActivate: [LoggedInActivator]},
        {path: 'payment/invoices/:invoiceID', component: InvoicePayComponent, canActivate: [DashBoardActivator]},
        {path: 'invoices/:invoiceID', component: InvoiceAddPayment,canActivate: [LoggedInActivator]},
        {path: 'invoice/:invoiceTableID', component: InvoiceTableComponent,canActivate: [LoggedInActivator]},
        {path: 'payments/unapplied', component: UnappliedCollections,canActivate: [LoggedInActivator]},
        {path: 'collections/unassigned', component: UnassignedCollections,canActivate: [LoggedInActivator]},
        {path: 'payments/:paymentID/invoices', component: PaymentInvoices, canActivate: [LoggedInActivator]},
        {path: 'invoices/:invoiceID/payments', component: InvoicePayments, canActivate: [LoggedInActivator]},
        {path: 'invoices/customers/:customerId/customer-activity', component: CustomerActivityComponent, canActivate: [LoggedInActivator]}
    ])],
    declarations: [InvoiceCustomDatepicker, CustomDatepicker1, InvoiceSettingsComponent, InvoiceDashboardComponent,
            InvoiceComponent, InvoiceCustomDatepicker,InvoicePayComponent,InvoiceAddPaymentComponent,
            InvoiceAddPayment,InvoicePaymentPreview, InvoiceTableComponent, UnappliedCollections, PaymentInvoices, InvoicePayments,
            UnassignedCollections, CustomerActivityComponent],
    exports: [RouterModule, CustomDatepicker1],
    providers: [InvoiceSettingsForm, InvoicesService, InvoiceForm, InvoiceLineForm, InvoiceLineTaxesForm, InvoicePaymentForm],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})


export class InvoicesModule {

}