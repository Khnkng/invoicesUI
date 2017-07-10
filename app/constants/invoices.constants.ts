export const INVOICE_PATHS={
    INVOICE_PREFERENCE: "/Invoices/users/:id/companies/:companyId/invoice/preference",
    INVOICE:"/Invoices/users/:id/companies/:companyId/invoice",
    INVOICE_PAY:"/Invoices/invoices/:invoiceID",
    INVOICE_DELETE:'/Invoices/users/:id/companies/:companyId/invoice/delete',
    INVOICE_SENT:'/Invoices/users/:id/companies/:companyId/invoice/sent'
};