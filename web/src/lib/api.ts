import { API_BASE_URL } from "./config";
import {
  Job,
  Agreement,
  Receipt,
  PriceBookEntry,
  PriceBookSummary,
} from "../../../shared/types";
import { ApiError } from "../../../shared/errors";

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  // Merge headers safely
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  
  // Only add JSON content-type if we aren't sending FormData
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...opts,
    headers,
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) {
    throw new ApiError(
      (payload && (payload as any).detail) || `Request failed (${res.status})`,
      res.status,
      payload
    );
  }
  return payload as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  
  listJobs: () => request<Job[]>("/jobs"),

  createJob: (name: string) =>
    request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify({ customer: { name } }),
    }),

  listAgreements: (jobId: string) => 
    request<Agreement[]>(`/jobs/${jobId}/agreements`),

  createAgreement: (jobId: string, audioBlob: Blob) => {
    const form = new FormData();
    form.append("audio", audioBlob, "agreement.webm");

    return request<Agreement>(`/jobs/${jobId}/agreements`, {
      method: "POST",
      body: form,
      // Note: We don't pass headers here; the helper handles it
    });
  },

  generateEvidencePdf: (jobId: string, agreementId: string) =>
    request<Agreement>(`/jobs/${jobId}/agreements/${agreementId}/evidence`, {
      method: "POST",
    }),

  listInvoices: (jobId: string) => 
    request<any[]>(`/jobs/${jobId}/invoices`),

  createInvoiceFromLatestAgreement: (jobId: string) =>
    request<any>(`/jobs/${jobId}/invoices/from-latest-agreement`, { 
      method: "POST" 
    }),

  uploadReceipt: async (jobId: string, file: File): Promise<Receipt> => {
    const url = `${API_BASE_URL}/jobs/${jobId}/receipts`;
    const form = new FormData();
    form.append("image", file, file.name);

    const res = await fetch(url, { method: "POST", body: form });
    const payload = await res.json().catch(() => undefined);
    if (!res.ok) {
      throw new ApiError(
        (payload && (payload as any).detail) || `Request failed (${res.status})`,
        res.status,
        payload
      );
    }
    return payload as Receipt;
  },

  listReceipts: (jobId: string) => request<Receipt[]>(`/jobs/${jobId}/receipts`),

  importReceiptToPricebook: (jobId: string, receiptId: string) =>
    request<PriceBookEntry[]>(`/pricebook/import/job/${jobId}/receipt/${receiptId}`, {
      method: "POST",
    }),

  searchPricebook: (q: string) =>
    request<PriceBookSummary[]>(`/pricebook/search?q=${encodeURIComponent(q)}`),
};
