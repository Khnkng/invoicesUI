export const INVOICE_PATHS={
    INVOICE_PREFERENCE: "/Invoices/user/:id/company/:companyId/invoice/preference",
    INVOICE:"/Invoices/users/:id/companies/:companyId/invoice",
    INVOICE_PAY:"/Invoices/invoices/:invoiceID",
    INVOICE_DELETE:'/Invoices/users/:id/companies/:companyId/invoice/delete',
    INVOICE_SENT:'/Invoices/users/:id/companies/:companyId/invoice/sent'
};