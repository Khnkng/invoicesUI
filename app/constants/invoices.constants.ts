export const INVOICE_PATHS={
    INVOICE_PREFERENCE: "/Invoices/user/:id/company/:companyId/invoice/preference",
    INVOICE:"/Invoices/users/:id/companies/:companyId/invoice",
    INVOICE_BY_CLIENTID:"/Invoices/users/:id/companies/:companyId/invoice/client/:clientId",
    INVOICE_PAY:"/Invoices/invoices/:invoiceID",
    INVOICE_PAYMENTS:"/Invoices/users/:id/companies/:companyId/invoice/payment"
};