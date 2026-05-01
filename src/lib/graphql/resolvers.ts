/**
 * GraphQL Resolvers for Thai Accounting ERP
 * Phase D: API Mastery - GraphQL Layer
 */

import { prisma } from '@/lib/db';
import { DataLoaders } from './dataloaders';
import { GraphQLError } from 'graphql';

// Context type
export interface GraphQLContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  loaders: DataLoaders;
  ipAddress: string;
  userAgent: string;
}

// Helper to check authentication
function requireAuth(context: GraphQLContext): NonNullable<GraphQLContext['user']> {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

// Helper to check admin role
function requireAdmin(context: GraphQLContext) {
  const user = requireAuth(context);
  if (user.role !== 'ADMIN') {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

// Helper for pagination
function createConnection<T>(items: T[], totalCount: number, page: number, limit: number) {
  const edges = items.map((item, index) => ({
    node: item,
    cursor: Buffer.from(`${page}:${index}`).toString('base64'),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage: page * limit < totalCount,
      hasPreviousPage: page > 1,
      startCursor: edges[0]?.cursor || null,
      endCursor: edges[edges.length - 1]?.cursor || null,
      totalCount,
    },
  };
}

/**
 * GraphQL Resolvers
 */
export const resolvers = {
  // Scalar resolvers
  DateTime: {
    serialize(value: Date | string) {
      return value instanceof Date ? value.toISOString() : value;
    },
    parseValue(value: string) {
      return new Date(value);
    },
  },

  JSON: {
    serialize(value: any) {
      return value;
    },
    parseValue(value: any) {
      return value;
    },
  },

  Decimal: {
    serialize(value: number | string) {
      return value.toString();
    },
    parseValue(value: string) {
      return parseFloat(value);
    },
  },

  // Interface resolvers
  Node: {
    __resolveType(obj: any) {
      if (obj.invoiceNo) return 'Invoice';
      if (obj.entryNo) return 'JournalEntry';
      if (obj.code && obj.creditDays !== undefined) return 'Customer';
      if (obj.code && obj.creditDays === undefined) return 'ChartOfAccount';
      if (obj.receiptNo) return 'Receipt';
      if (obj.paymentNo) return 'Payment';
      if (obj.employeeCode) return 'Employee';
      if (obj.email) return 'User';
      if (obj.bankName) return 'BankAccount';
      if (obj.salePrice !== undefined) return 'Product';
      return null;
    },
  },

  Timestamped: {
    __resolveType(obj: any) {
      if (obj.invoiceNo) return 'Invoice';
      if (obj.entryNo) return 'JournalEntry';
      if (obj.code && obj.creditDays !== undefined) return 'Customer';
      if (obj.code && obj.creditDays === undefined) return 'ChartOfAccount';
      if (obj.receiptNo) return 'Receipt';
      if (obj.paymentNo) return 'Payment';
      if (obj.employeeCode) return 'Employee';
      if (obj.email) return 'User';
      if (obj.bankName) return 'BankAccount';
      if (obj.salePrice !== undefined) return 'Product';
      return null;
    },
  },

  // Query resolvers
  Query: {
    // Node query
    async node(_: any, { id }: { id: string }, context: GraphQLContext) {
      // Try to find the entity by ID across different types
      const loaders = [
        context.loaders.invoiceById,
        context.loaders.journalEntryById,
        context.loaders.customerById,
        context.loaders.vendorById,
        context.loaders.productById,
        context.loaders.accountById,
        context.loaders.receiptById,
        context.loaders.paymentById,
        context.loaders.employeeById,
        context.loaders.userById,
        context.loaders.bankAccountById,
      ];

      for (const loader of loaders) {
        const entity = await loader.load(id);
        if (entity) return entity;
      }
      return null;
    },

    // Company
    async company() {
      return prisma.company.findFirst();
    },

    // User queries
    async me(_: any, __: any, context: GraphQLContext) {
      const user = requireAuth(context);
      return context.loaders.userById.load(user.id);
    },

    async user(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.userById.load(id);
    },

    async users(_: any, __: any, context: GraphQLContext) {
      requireAdmin(context);
      return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    },

    // Chart of Accounts queries
    async accounts(
      _: any,
      { type, isActive }: { type?: string; isActive?: boolean },
      context: GraphQLContext
    ) {
      requireAuth(context);
      return prisma.chartOfAccount.findMany({
        where: {
          ...(type && { type }),
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: { code: 'asc' },
      });
    },

    async account(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.accountById.load(id);
    },

    async accountByCode(_: any, { code }: { code: string }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.chartOfAccount.findUnique({ where: { code } });
    },

    // Journal Entry queries
    async journalEntries(
      _: any,
      {
        page = 1,
        limit = 20,
        status,
        startDate,
        endDate,
      }: {
        page?: number;
        limit?: number;
        status?: string;
        startDate?: Date;
        endDate?: Date;
      },
      context: GraphQLContext
    ) {
      requireAuth(context);
      const skip = (page - 1) * limit;

      const where: any = {
        ...(status && { status }),
        ...(startDate &&
          endDate && {
            date: { gte: startDate, lte: endDate },
          }),
      };

      const [entries, totalCount] = await Promise.all([
        prisma.journalEntry.findMany({
          where,
          skip,
          take: limit,
          orderBy: { date: 'desc' },
        }),
        prisma.journalEntry.count({ where }),
      ]);

      return createConnection(entries, totalCount, page, limit);
    },

    async journalEntry(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.journalEntryById.load(id);
    },

    // Invoice queries
    async invoices(
      _: any,
      {
        page = 1,
        limit = 20,
        status,
        customerId,
        startDate,
        endDate,
      }: {
        page?: number;
        limit?: number;
        status?: string;
        customerId?: string;
        startDate?: Date;
        endDate?: Date;
      },
      context: GraphQLContext
    ) {
      requireAuth(context);
      const skip = (page - 1) * limit;

      const where: any = {
        isActive: true,
        ...(status && { status }),
        ...(customerId && { customerId }),
        ...(startDate &&
          endDate && {
            invoiceDate: { gte: startDate, lte: endDate },
          }),
      };

      const [invoices, totalCount] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { invoiceDate: 'desc' },
        }),
        prisma.invoice.count({ where }),
      ]);

      return createConnection(invoices, totalCount, page, limit);
    },

    async invoice(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.invoiceById.load(id);
    },

    async invoiceByNumber(_: any, { invoiceNo }: { invoiceNo: string }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.invoice.findUnique({ where: { invoiceNo } });
    },

    // Customer queries
    async customers(
      _: any,
      { page = 1, limit = 20, isActive }: { page?: number; limit?: number; isActive?: boolean },
      context: GraphQLContext
    ) {
      requireAuth(context);
      const skip = (page - 1) * limit;

      const where: any = {
        deletedAt: null,
        ...(isActive !== undefined && { isActive }),
      };

      const [customers, totalCount] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.customer.count({ where }),
      ]);

      return createConnection(customers, totalCount, page, limit);
    },

    async customer(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.customerById.load(id);
    },

    async customerByCode(_: any, { code }: { code: string }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.customer.findUnique({ where: { code } });
    },

    // Vendor queries
    async vendors(_: any, { isActive }: { isActive?: boolean }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.vendor.findMany({
        where: {
          deletedAt: null,
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: { name: 'asc' },
      });
    },

    async vendor(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.vendorById.load(id);
    },

    // Product queries
    async products(
      _: any,
      { type, isActive }: { type?: string; isActive?: boolean },
      context: GraphQLContext
    ) {
      requireAuth(context);
      return prisma.product.findMany({
        where: {
          deletedAt: null,
          ...(type && { type }),
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: { name: 'asc' },
      });
    },

    async product(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.productById.load(id);
    },

    async productByCode(_: any, { code }: { code: string }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.product.findUnique({ where: { code } });
    },

    // Purchase Invoice queries
    async purchaseInvoices(_: any, { status }: { status?: string }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.purchaseInvoice.findMany({
        where: {
          isActive: true,
          ...(status && { status }),
        },
        orderBy: { invoiceDate: 'desc' },
      });
    },

    async purchaseInvoice(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.purchaseInvoiceById.load(id);
    },

    // Receipt queries
    async receipts(_: any, __: any, context: GraphQLContext) {
      requireAuth(context);
      return prisma.receipt.findMany({
        where: { isActive: true },
        orderBy: { receiptDate: 'desc' },
      });
    },

    async receipt(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.receiptById.load(id);
    },

    // Payment queries
    async payments(_: any, __: any, context: GraphQLContext) {
      requireAuth(context);
      return prisma.payment.findMany({
        where: { isActive: true },
        orderBy: { paymentDate: 'desc' },
      });
    },

    async payment(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.paymentById.load(id);
    },

    // Bank Account queries
    async bankAccounts(_: any, __: any, context: GraphQLContext) {
      requireAuth(context);
      return prisma.bankAccount.findMany({
        where: { isActive: true },
        orderBy: { bankName: 'asc' },
      });
    },

    async bankAccount(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.bankAccountById.load(id);
    },

    // Employee queries
    async employees(_: any, { isActive }: { isActive?: boolean }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.employee.findMany({
        where: {
          deletedAt: null,
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: { firstName: 'asc' },
      });
    },

    async employee(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return context.loaders.employeeById.load(id);
    },

    // Webhook queries
    async webhooks(_: any, __: any, context: GraphQLContext) {
      requireAuth(context);
      return prisma.webhookEndpoint.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },

    async webhook(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.webhookEndpoint.findUnique({ where: { id } });
    },

    async webhookEvents(_: any, __: any, context: GraphQLContext) {
      requireAuth(context);
      return [
        'INVOICE_CREATED',
        'INVOICE_UPDATED',
        'INVOICE_PAID',
        'INVOICE_VOIDED',
        'RECEIPT_CREATED',
        'RECEIPT_POSTED',
        'PAYMENT_CREATED',
        'PAYMENT_POSTED',
        'JOURNAL_ENTRY_POSTED',
        'CUSTOMER_CREATED',
        'CUSTOMER_UPDATED',
        'PRODUCT_CREATED',
        'PRODUCT_UPDATED',
        'STOCK_MOVEMENT',
      ];
    },

    // Analytics queries
    async apiAnalytics(
      _: any,
      { startDate, endDate, path }: { startDate: Date; endDate: Date; path?: string },
      context: GraphQLContext
    ) {
      requireAdmin(context);
      return prisma.apiRequestLog.findMany({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          ...(path && { path }),
        },
        orderBy: { timestamp: 'desc' },
        take: 1000,
      });
    },

    async apiMetrics(_: any, __: any, context: GraphQLContext) {
      requireAdmin(context);

      // Calculate metrics from the last 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const logs = await prisma.apiRequestLog.findMany({
        where: { timestamp: { gte: since } },
      });

      const totalRequests = logs.length;
      const errorRequests = logs.filter((l) => l.statusCode >= 400).length;
      const durations = logs.map((l) => l.duration).sort((a, b) => a - b);

      const p50Index = Math.floor(durations.length * 0.5);
      const p95Index = Math.floor(durations.length * 0.95);
      const p99Index = Math.floor(durations.length * 0.99);

      // Top users
      const userCounts = new Map<string, number>();
      for (const log of logs) {
        if (log.userId) {
          userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
        }
      }
      const topUsers = Array.from(userCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, requestCount]) => ({
          userId,
          userName: userId, // Would need to fetch actual names
          requestCount,
        }));

      // Top paths
      const pathStats = new Map<string, { count: number; totalDuration: number }>();
      for (const log of logs) {
        const stats = pathStats.get(log.path) || { count: 0, totalDuration: 0 };
        stats.count++;
        stats.totalDuration += log.duration;
        pathStats.set(log.path, stats);
      }
      const topPaths = Array.from(pathStats.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([path, stats]) => ({
          path,
          requestCount: stats.count,
          averageDuration: stats.totalDuration / stats.count,
        }));

      return {
        totalRequests,
        requestsPerMinute: totalRequests / (24 * 60),
        errorRate: totalRequests > 0 ? errorRequests / totalRequests : 0,
        averageDuration:
          totalRequests > 0 ? durations.reduce((a, b) => a + b, 0) / totalRequests : 0,
        p50: durations[p50Index] || 0,
        p95: durations[p95Index] || 0,
        p99: durations[p99Index] || 0,
        topUsers,
        topPaths,
      };
    },
  },

  // Field resolvers
  ChartOfAccount: {
    parent(account: any, _: any, context: GraphQLContext) {
      if (!account.parentId) return null;
      return context.loaders.accountById.load(account.parentId);
    },
    children(account: any, _: any, context: GraphQLContext) {
      return context.loaders.accountChildrenByParentId.load(account.id);
    },
    balance(account: any) {
      // Would calculate from journal lines
      return 0;
    },
  },

  JournalEntry: {
    lines(entry: any, _: any, context: GraphQLContext) {
      return context.loaders.journalLinesByEntryId.load(entry.id);
    },
  },

  JournalLine: {
    account(line: any, _: any, context: GraphQLContext) {
      return context.loaders.accountById.load(line.accountId);
    },
  },

  Customer: {
    invoices(customer: any, _: any, context: GraphQLContext) {
      return context.loaders.invoicesByCustomerId.load(customer.id);
    },
    totalReceivables(customer: any) {
      // Would calculate from invoices
      return 0;
    },
  },

  Vendor: {
    purchaseInvoices(vendor: any, _: any, context: GraphQLContext) {
      return context.loaders.purchaseInvoicesByVendorId.load(vendor.id);
    },
    totalPayables(vendor: any) {
      // Would calculate from purchase invoices
      return 0;
    },
  },

  Invoice: {
    customer(invoice: any, _: any, context: GraphQLContext) {
      return context.loaders.customerById.load(invoice.customerId);
    },
    lines(invoice: any, _: any, context: GraphQLContext) {
      return context.loaders.invoiceLinesByInvoiceId.load(invoice.id);
    },
    journalEntry(invoice: any) {
      if (!invoice.journalEntryId) return null;
      return prisma.journalEntry.findUnique({
        where: { id: invoice.journalEntryId },
      });
    },
  },

  InvoiceLine: {
    product(line: any, _: any, context: GraphQLContext) {
      if (!line.productId) return null;
      return context.loaders.productById.load(line.productId);
    },
  },

  PurchaseInvoice: {
    vendor(invoice: any, _: any, context: GraphQLContext) {
      return context.loaders.vendorById.load(invoice.vendorId);
    },
    lines(invoice: any, _: any, context: GraphQLContext) {
      return context.loaders.purchaseLinesByPurchaseId.load(invoice.id);
    },
    journalEntry(invoice: any) {
      if (!invoice.journalEntryId) return null;
      return prisma.journalEntry.findUnique({
        where: { id: invoice.journalEntryId },
      });
    },
  },

  PurchaseInvoiceLine: {
    product(line: any, _: any, context: GraphQLContext) {
      if (!line.productId) return null;
      return context.loaders.productById.load(line.productId);
    },
  },

  Receipt: {
    customer(receipt: any, _: any, context: GraphQLContext) {
      return context.loaders.customerById.load(receipt.customerId);
    },
    bankAccount(receipt: any, _: any, context: GraphQLContext) {
      if (!receipt.bankAccountId) return null;
      return context.loaders.bankAccountById.load(receipt.bankAccountId);
    },
    allocations(receipt: any, _: any, context: GraphQLContext) {
      return context.loaders.receiptAllocationsByReceiptId.load(receipt.id);
    },
    journalEntry(receipt: any) {
      if (!receipt.journalEntryId) return null;
      return prisma.journalEntry.findUnique({
        where: { id: receipt.journalEntryId },
      });
    },
  },

  ReceiptAllocation: {
    invoice(allocation: any, _: any, context: GraphQLContext) {
      return context.loaders.invoiceById.load(allocation.invoiceId);
    },
  },

  Payment: {
    vendor(payment: any, _: any, context: GraphQLContext) {
      return context.loaders.vendorById.load(payment.vendorId);
    },
    bankAccount(payment: any, _: any, context: GraphQLContext) {
      if (!payment.bankAccountId) return null;
      return context.loaders.bankAccountById.load(payment.bankAccountId);
    },
    allocations(payment: any, _: any, context: GraphQLContext) {
      return context.loaders.paymentAllocationsByPaymentId.load(payment.id);
    },
    journalEntry(payment: any) {
      if (!payment.journalEntryId) return null;
      return prisma.journalEntry.findUnique({
        where: { id: payment.journalEntryId },
      });
    },
  },

  PaymentAllocation: {
    invoice(allocation: any, _: any, context: GraphQLContext) {
      return context.loaders.purchaseInvoiceById.load(allocation.invoiceId);
    },
  },

  WebhookSubscription: {
    events(webhook: any) {
      return webhook.events.split(',').map((e: string) => e.trim());
    },
  },

  // Mutation resolvers
  Mutation: {
    // Invoice mutations
    async createInvoice(_: any, { input }: { input: any }, context: GraphQLContext) {
      requireAuth(context);
      // Would call invoice service
      throw new GraphQLError('Not implemented', {
        extensions: { code: 'NOT_IMPLEMENTED' },
      });
    },

    async updateInvoice(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      requireAuth(context);
      throw new GraphQLError('Not implemented', {
        extensions: { code: 'NOT_IMPLEMENTED' },
      });
    },

    async issueInvoice(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      throw new GraphQLError('Not implemented', {
        extensions: { code: 'NOT_IMPLEMENTED' },
      });
    },

    async voidInvoice(
      _: any,
      { id, reason }: { id: string; reason?: string },
      context: GraphQLContext
    ) {
      requireAuth(context);
      throw new GraphQLError('Not implemented', {
        extensions: { code: 'NOT_IMPLEMENTED' },
      });
    },

    async deleteInvoice(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      await prisma.invoice.update({
        where: { id },
        data: { isActive: false },
      });
      return true;
    },

    // Journal Entry mutations
    async createJournalEntry(_: any, { input }: { input: any }, context: GraphQLContext) {
      requireAuth(context);
      throw new GraphQLError('Not implemented', {
        extensions: { code: 'NOT_IMPLEMENTED' },
      });
    },

    async postJournalEntry(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      throw new GraphQLError('Not implemented', {
        extensions: { code: 'NOT_IMPLEMENTED' },
      });
    },

    async reverseJournalEntry(
      _: any,
      { id, reason }: { id: string; reason?: string },
      context: GraphQLContext
    ) {
      requireAuth(context);
      throw new GraphQLError('Not implemented', {
        extensions: { code: 'NOT_IMPLEMENTED' },
      });
    },

    async deleteJournalEntry(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      await prisma.journalEntry.update({
        where: { id },
        data: { isActive: false },
      });
      return true;
    },

    // Customer mutations
    async createCustomer(_: any, { input }: { input: any }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.customer.create({
        data: {
          ...input,
          code: input.code || `CUST-${Date.now()}`,
        },
      });
    },

    async updateCustomer(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      requireAuth(context);
      return prisma.customer.update({
        where: { id },
        data: input,
      });
    },

    async deleteCustomer(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      await prisma.customer.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    },

    // Product mutations
    async createProduct(_: any, { input }: { input: any }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.product.create({
        data: {
          ...input,
          code: input.code || `PROD-${Date.now()}`,
        },
      });
    },

    async updateProduct(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      requireAuth(context);
      return prisma.product.update({
        where: { id },
        data: input,
      });
    },

    async deleteProduct(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      await prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    },

    // Webhook mutations
    async createWebhook(_: any, { input }: { input: any }, context: GraphQLContext) {
      requireAuth(context);
      return prisma.webhookEndpoint.create({
        data: {
          name: input.name,
          url: input.url,
          events: input.events.join(','),
          secret: input.secret || crypto.randomUUID(),
        },
      });
    },

    async updateWebhook(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      requireAuth(context);
      return prisma.webhookEndpoint.update({
        where: { id },
        data: {
          ...input,
          ...(input.events && { events: input.events.join(',') }),
        },
      });
    },

    async deleteWebhook(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      await prisma.webhookEndpoint.delete({ where: { id } });
      return true;
    },

    async testWebhook(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAuth(context);
      const webhook = await prisma.webhookEndpoint.findUnique({
        where: { id },
      });
      if (!webhook) {
        throw new GraphQLError('Webhook not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const start = Date.now();
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': 'test-signature',
          },
          body: JSON.stringify({
            event: 'TEST',
            timestamp: new Date().toISOString(),
            data: { message: 'Test webhook' },
          }),
        });

        return {
          success: response.ok,
          statusCode: response.status,
          responseTime: Date.now() - start,
          error: null,
        };
      } catch (error) {
        return {
          success: false,
          statusCode: 0,
          responseTime: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },

    // User mutations
    async updateUserRole(
      _: any,
      { id, role }: { id: string; role: string },
      context: GraphQLContext
    ) {
      requireAdmin(context);
      return prisma.user.update({
        where: { id },
        data: { role },
      });
    },

    async deactivateUser(_: any, { id }: { id: string }, context: GraphQLContext) {
      requireAdmin(context);
      return prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
    },
  },
};
