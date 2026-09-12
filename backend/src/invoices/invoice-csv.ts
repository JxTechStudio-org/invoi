import { Invoice } from '@prisma/client';

const headers = [
  'Invoice ID', 'Invoice Number', 'Vendor Name', 'Vendor Tax Number', 'Vendor CR Number',
  'Customer Name', 'Invoice Date', 'Due Date', 'Total Amount', 'Tax Amount',
  'Currency', 'Payment Status', 'Payment Method',
];

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function textCell(value: string | null): string {
  const text = value ?? '';
  // Quoting alone does not prevent spreadsheet formula evaluation.
  return escapeCell(/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/u.test(text) ? `'${text}` : text);
}

export function invoicesToCsv(invoices: Invoice[]): string {
  const rows = invoices.map(invoice => [
    textCell(invoice.id), textCell(invoice.invoiceNumber), textCell(invoice.vendorName),
    textCell(invoice.taxNumber), textCell(invoice.crNumber), textCell(invoice.customerName),
    invoice.invoiceDate?.toISOString().slice(0, 10) ?? '',
    invoice.dueDate?.toISOString().slice(0, 10) ?? '',
    invoice.totalAmount?.toFixed(2) ?? '', invoice.taxAmount?.toFixed(2) ?? '',
    textCell(invoice.currency), textCell(invoice.paymentStatus), textCell(invoice.paymentMethod),
  ].join(','));
  return `\uFEFF${[headers.join(','), ...rows].join('\r\n')}\r\n`;
}
