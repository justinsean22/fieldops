export type ISODateString = string; // e.g. "2026-02-27T18:42:00.000Z"

export type Money = {
  amount: number; // store as dollars for now; later consider cents as integer
  currency: "USD";
};

export type JobStatus = "lead" | "agreed" | "in_progress" | "invoiced" | "paid";

export type Customer = {
  name: string;
  phone?: string;
  email?: string;
};

export type Site = {
  address?: string;
  notes?: string;
};

export type Job = {
  jobId: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  status: JobStatus;
  customer: Customer;
  site?: Site;
};

export type AgreementTerms = {
  scopeText: string;
  price: Money;
  startDate?: ISODateString;
  dueDate?: ISODateString;
  paymentTerms?: string;
};

export type ClientAck = {
  confirmed: boolean;
  name: string;
  phone?: string;
  confirmedAt?: ISODateString;
};

export type Agreement = {
  agreementId: string;
  createdAt: ISODateString;
  audioUrl?: string;
  transcript?: string;
  terms?: AgreementTerms;
  clientAck?: ClientAck;
  evidencePdfUrl?: string;
  evidenceHash?: string;
};

export type InvoiceLineItem = {
  desc: string;
  qty?: number;
  unit?: string;
  unitPrice: number;
  total: number;
};

export type InvoiceTotals = {
  subtotal: number;
  tax?: number;
  total: number;
  depositDue?: number;
};

export type Invoice = {
  invoiceId: string;
  createdAt: ISODateString;
  sentAt?: ISODateString;
  paidAt?: ISODateString;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  totals: InvoiceTotals;
  pdfUrl?: string;
  shareUrl?: string;
};
