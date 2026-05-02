"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  contactApi,
  productApi,
  companyApi,
  projectApi,
  quotationApi,
  invoiceApi,
  receiptApi,
  purchaseOrderApi,
  purchaseInvoiceApi,
  expenseClaimApi,
  accountingApi,
  bankAccountApi,
  stockAdjustmentApi,
} from "@/lib/api";

// Contacts
export function useContacts(params?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: ["contacts", params],
    queryFn: () => contactApi.list(params).then((res) => res.data),
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contactApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact", vars.id] });
    },
  });
}

export function useContactTransactions(contactId: string) {
  return useQuery({
    queryKey: ["contact-transactions", contactId],
    queryFn: () => contactApi.getTransactions(contactId).then((res) => res.data),
    enabled: !!contactId,
  });
}

// Products
export function useProducts(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productApi.list(params).then((res) => res.data),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", vars.id] });
    },
  });
}

export function useProductTransactions(productId: string) {
  return useQuery({
    queryKey: ["product-transactions", productId],
    queryFn: () => productApi.getTransactions(productId).then((res) => res.data),
    enabled: !!productId,
  });
}

// Companies
export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => companyApi.list().then((res) => res.data),
  });
}

export function useUpdateMyCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyApi.updateMy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

// Projects
export function useProjects(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectApi.list(params).then((res) => res.data),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", vars.id] });
    },
  });
}

export function useProjectFinancials(projectId: string) {
  return useQuery({
    queryKey: ["project-financials", projectId],
    queryFn: () => projectApi.financials(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useProjectsFinancialsSummary() {
  return useQuery({
    queryKey: ["projects-financials-summary"],
    queryFn: () => projectApi.financialsSummary().then((res) => res.data),
  });
}

export function useProjectTransactions(projectId: string) {
  return useQuery({
    queryKey: ["project-transactions", projectId],
    queryFn: () => projectApi.getTransactions(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
}

// Quotations
export function useQuotations(
  params?: { status?: string; contact_id?: string; project_id?: string; search?: string }
) {
  return useQuery({
    queryKey: ["quotations", params],
    queryFn: () => quotationApi.list(params).then((res) => res.data),
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotations"] }),
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => quotationApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", vars.id] });
    },
  });
}

// Invoices
export function useInvoices(
  params?: { status?: string; contact_id?: string; project_id?: string; is_overdue?: boolean; search?: string; e_tax_status?: string }
) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoiceApi.list(params).then((res) => res.data),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoiceApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => invoiceApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", vars.id] });
    },
  });
}

// Receipts
export function useReceipts(
  params?: { invoice_id?: string; project_id?: string; payment_method?: string; start_date?: string; end_date?: string }
) {
  return useQuery({
    queryKey: ["receipts", params],
    queryFn: () => receiptApi.list(params).then((res) => res.data),
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: receiptApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// Purchase Orders
export function usePurchaseOrders(
  params?: { status?: string; contact_id?: string; project_id?: string; search?: string }
) {
  return useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: () => purchaseOrderApi.list(params).then((res) => res.data),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrderApi.get(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseOrderApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => purchaseOrderApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", vars.id] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrderApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
  });
}

// Purchase Invoices
export function usePurchaseInvoices(
  params?: { status?: string; contact_id?: string; project_id?: string; is_overdue?: boolean; search?: string }
) {
  return useQuery({
    queryKey: ["purchase-invoices", params],
    queryFn: () => purchaseInvoiceApi.list(params).then((res) => res.data),
  });
}

export function usePurchaseInvoice(id: string) {
  return useQuery({
    queryKey: ["purchase-invoice", id],
    queryFn: () => purchaseInvoiceApi.get(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchaseInvoiceApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] }),
  });
}

export function useUpdatePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => purchaseInvoiceApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-invoice", vars.id] });
    },
  });
}

export function useDeletePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseInvoiceApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] }),
  });
}

// Expense Claims
export function useExpenseClaims(
  params?: { status?: string; category?: string; contact_id?: string; project_id?: string; search?: string }
) {
  return useQuery({
    queryKey: ["expense-claims", params],
    queryFn: () => expenseClaimApi.list(params).then((res) => res.data),
  });
}

export function useExpenseClaim(id: string) {
  return useQuery({
    queryKey: ["expense-claim", id],
    queryFn: () => expenseClaimApi.get(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateExpenseClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expenseClaimApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expense-claims"] }),
  });
}

export function useUpdateExpenseClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => expenseClaimApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      queryClient.invalidateQueries({ queryKey: ["expense-claim", vars.id] });
    },
  });
}

export function useDeleteExpenseClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseClaimApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expense-claims"] }),
  });
}

// Chart of Accounts
export function useChartOfAccounts(params?: { account_type?: string; search?: string }) {
  return useQuery({
    queryKey: ["chart-of-accounts", params],
    queryFn: () => accountingApi.listCOA(params).then((res) => res.data),
  });
}

export function useCreateCOA() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountingApi.createCOA,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] }),
  });
}

// Journal Entries
export function useJournalEntries(
  params?: { entry_type?: string; from_date?: string; to_date?: string; limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: ["journal-entries", params],
    queryFn: () => accountingApi.listJournalEntries(params).then((res) => res.data),
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountingApi.createJournalEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal-entries"] }),
  });
}

// Reports
export function useTrialBalance(params?: { as_of?: string }) {
  return useQuery({
    queryKey: ["trial-balance", params],
    queryFn: () => accountingApi.trialBalance(params).then((res) => res.data),
  });
}

export function useIncomeStatement(params: { from_date: string; to_date: string }) {
  return useQuery({
    queryKey: ["income-statement", params],
    queryFn: () => accountingApi.incomeStatement(params).then((res) => res.data),
    enabled: !!params.from_date && !!params.to_date,
  });
}

export function useBalanceSheet(params?: { as_of?: string }) {
  return useQuery({
    queryKey: ["balance-sheet", params],
    queryFn: () => accountingApi.balanceSheet(params).then((res) => res.data),
  });
}

export function useARAging(params?: { as_of?: string }) {
  return useQuery({
    queryKey: ["ar-aging", params],
    queryFn: () => accountingApi.arAging(params).then((res) => res.data),
  });
}

export function useAPAging(params?: { as_of?: string }) {
  return useQuery({
    queryKey: ["ap-aging", params],
    queryFn: () => accountingApi.apAging(params).then((res) => res.data),
  });
}

// Bank Accounts
export function useBankAccounts(params?: { account_type?: string }) {
  return useQuery({
    queryKey: ["bank-accounts", params],
    queryFn: () => bankAccountApi.list(params).then((res) => res.data),
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bankAccountApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });
}

export function useBankAccountTransactions(
  accountId: string,
  params?: { is_reconciled?: string; from_date?: string; to_date?: string }
) {
  return useQuery({
    queryKey: ["bank-account-transactions", accountId, params],
    queryFn: () => bankAccountApi.transactions(accountId, params).then((res) => res.data),
    enabled: !!accountId,
  });
}

export function useReconcileLines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { line_ids: string[]; reconcile: boolean } }) =>
      bankAccountApi.reconcile(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["bank-account-transactions", vars.id] });
    },
  });
}

// Bank Statement Import
export function useStatementImports(accountId: string) {
  return useQuery({
    queryKey: ["statement-imports", accountId],
    queryFn: () => bankAccountApi.listStatementImports(accountId).then((res) => res.data),
    enabled: !!accountId,
  });
}

export function useImportStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => bankAccountApi.importStatement(id, file),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["statement-imports", vars.id] });
    },
  });
}

export function useStatementLines(accountId: string, importId: string, unmatchedOnly?: boolean) {
  return useQuery({
    queryKey: ["statement-lines", accountId, importId, unmatchedOnly],
    queryFn: () => bankAccountApi.getStatementLines(accountId, importId, { unmatched_only: unmatchedOnly }).then((res) => res.data),
    enabled: !!accountId && !!importId,
  });
}

export function useMatchSuggestions(accountId: string, importId: string) {
  return useQuery({
    queryKey: ["match-suggestions", accountId, importId],
    queryFn: () => bankAccountApi.getMatchSuggestions(accountId, importId).then((res) => res.data),
    enabled: !!accountId && !!importId,
  });
}

export function useMatchStatementLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, importId, data }: { id: string; importId: string; data: { line_id: string; je_line_id?: string | null } }) =>
      bankAccountApi.matchStatementLine(id, importId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["statement-lines", vars.id, vars.importId] });
      queryClient.invalidateQueries({ queryKey: ["match-suggestions", vars.id, vars.importId] });
      queryClient.invalidateQueries({ queryKey: ["bank-account-transactions", vars.id] });
    },
  });
}

export function useDeleteStatementImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, importId }: { id: string; importId: string }) => bankAccountApi.deleteStatementImport(id, importId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["statement-imports", vars.id] });
    },
  });
}

// e-Tax
export function useGenerateETax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.generateETax(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["etax-history", id] });
    },
  });
}

export function useSubmitETax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.submitETax(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["etax-history", id] });
    },
  });
}

// Stock Adjustments
export function useStockAdjustments(params?: { product_id?: string; adjustment_type?: string }) {
  return useQuery({
    queryKey: ["stock-adjustments", params],
    queryFn: () => stockAdjustmentApi.list(params).then((res) => res.data),
  });
}

export function useCreateStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stockAdjustmentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useStockMovements(productId: string) {
  return useQuery({
    queryKey: ["stock-movements", productId],
    queryFn: () => stockAdjustmentApi.getMovements(productId).then((res) => res.data),
    enabled: !!productId,
  });
}

export function useETaxHistory(invoiceId: string) {
  return useQuery({
    queryKey: ["etax-history", invoiceId],
    queryFn: () => invoiceApi.getETaxHistory(invoiceId).then((res) => res.data),
    enabled: !!invoiceId,
  });
}

// FIFO Layers
export function useFifoLayers(productId: string) {
  return useQuery({
    queryKey: ["fifo-layers", productId],
    queryFn: () => productApi.getFifoLayers(productId).then((res) => res.data),
    enabled: !!productId,
  });
}
