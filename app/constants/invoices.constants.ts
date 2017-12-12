export const INVOICE_PATHS={
    INVOICE_PREFERENCE: "/Invoices/users/:id/companies/:companyId/invoice/preference",
    INVOICE:"/Invoices/users/:id/companies/:companyId/invoice",
    INVOICE_BY_CLIENTID:"/Invoices/users/:id/companies/:companyId/invoice/client/:clientId",
    INVOICE_PAY:"/Invoices/invoices/:invoiceID",
    INVOICE_PAYMENTS:"/Invoices/users/:id/companies/:companyId/invoice/payment",
    INVOICE_DELETE:'/Invoices/users/:id/companies/:companyId/invoice/delete',
    INVOICE_SENT:'/Invoices/users/:id/companies/:companyId/invoice/sent',
    INVOICE_PAID:'/Invoices/users/:id/companies/:companyId/invoice/:invoiceId/state',
    INVOICE_DASHBOARD_BOX: '/Invoices/users/:id/companies/:companyId/invoice/metrics',
    INVOICE_HISTORY:'/Invoices/users/:id/companies/:companyId/invoice_history/invoice/:invoiceId',
    DOCUMENTS_SERVICE: "/DocumentServices/user/:id/companies/:companyId/documents?mappedType=:type&mappedTo=:mappedId",
    DOCUMENT_SERVICE_BASE:"/DocumentServices/user/:id/companies/:companyId/documents",
    CUSTOMER_INVOICE:"/Invoices/users/:id/companies/:companyId/invoice/customer/:customerId"
};
