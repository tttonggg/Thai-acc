/**
 * OpenAPI/Swagger Documentation Endpoint
 * Phase D: API Mastery - OpenAPI Spec
 * 
 * Endpoint: /api/docs
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// OpenAPI Specification
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Thai Accounting ERP API',
    description: 'RESTful API for Thai Accounting ERP System (โปรแกรมบัญชีมาตรฐานไทย)',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@thaiaccounting.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
    {
      url: '/api/v1',
      description: 'Version 1 (Stable)',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication' },
    { name: 'Accounts', description: 'Chart of accounts' },
    { name: 'Journal', description: 'Journal entries' },
    { name: 'Invoices', description: 'Sales invoices (ใบกำกับภาษี)' },
    { name: 'Customers', description: 'Customer management (ลูกค้า)' },
    { name: 'Vendors', description: 'Vendor management (ผู้ขาย)' },
    { name: 'Products', description: 'Product management (สินค้า)' },
    { name: 'Receipts', description: 'Receipts (ใบเสร็จ)' },
    { name: 'Payments', description: 'Payments (ใบจ่ายเงิน)' },
    { name: 'Banking', description: 'Bank accounts and cheques' },
    { name: 'Reports', description: 'Financial reports' },
    { name: 'Admin', description: 'Administration' },
    { name: 'GraphQL', description: 'GraphQL endpoint' },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user and create session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
              example: {
                email: 'admin@thaiaccounting.com',
                password: 'admin123',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/accounts': {
      get: {
        tags: ['Accounts'],
        summary: 'List chart of accounts',
        description: 'Get all chart of accounts entries',
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
          },
        ],
        responses: {
          '200': {
            description: 'List of accounts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/ChartOfAccount' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Accounts'],
        summary: 'Create account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChartOfAccountInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Account created' },
        },
      },
    },
    '/invoices': {
      get: {
        tags: ['Invoices'],
        summary: 'List invoices',
        description: 'Get all sales invoices (ใบกำกับภาษี)',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'CANCELLED'] },
          },
          {
            name: 'customerId',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'List of invoices',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Invoice' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Invoices'],
        summary: 'Create invoice',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InvoiceInput' },
              example: {
                customerId: 'clf...',
                invoiceDate: '2024-03-16',
                dueDate: '2024-04-16',
                lines: [
                  {
                    description: 'Product A',
                    quantity: 2,
                    unitPrice: 50000,
                  },
                ],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Invoice created' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        summary: 'Get invoice by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Invoice details' },
          '404': { description: 'Invoice not found' },
        },
      },
      put: {
        tags: ['Invoices'],
        summary: 'Update invoice',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InvoiceInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Invoice updated' },
        },
      },
      delete: {
        tags: ['Invoices'],
        summary: 'Delete invoice',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '204': { description: 'Invoice deleted' },
        },
      },
    },
    '/invoices/{id}/issue': {
      post: {
        tags: ['Invoices'],
        summary: 'Issue invoice',
        description: 'Change invoice status from DRAFT to ISSUED',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Invoice issued' },
        },
      },
    },
    '/journal': {
      get: {
        tags: ['Journal'],
        summary: 'List journal entries',
        responses: {
          '200': { description: 'List of journal entries' },
        },
      },
      post: {
        tags: ['Journal'],
        summary: 'Create journal entry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JournalEntryInput' },
              example: {
                date: '2024-03-16',
                description: 'Monthly accrual',
                lines: [
                  { accountId: 'clf...', debit: 100000, credit: 0 },
                  { accountId: 'clf...', debit: 0, credit: 100000 },
                ],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Journal entry created' },
        },
      },
    },
    '/customers': {
      get: {
        tags: ['Customers'],
        summary: 'List customers',
        description: 'Get all customers (ลูกค้า)',
        responses: {
          '200': { description: 'List of customers' },
        },
      },
      post: {
        tags: ['Customers'],
        summary: 'Create customer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CustomerInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Customer created' },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products',
        responses: {
          '200': { description: 'List of products' },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create product',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProductInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Product created' },
        },
      },
    },
    '/reports/trial-balance': {
      get: {
        tags: ['Reports'],
        summary: 'Trial Balance Report',
        description: 'Generate trial balance report (งบทดลอง)',
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': { description: 'Trial balance report' },
        },
      },
    },
    '/reports/balance-sheet': {
      get: {
        tags: ['Reports'],
        summary: 'Balance Sheet',
        description: 'Generate balance sheet (งบดุล)',
        parameters: [
          {
            name: 'asOfDate',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': { description: 'Balance sheet report' },
        },
      },
    },
    '/reports/income-statement': {
      get: {
        tags: ['Reports'],
        summary: 'Income Statement',
        description: 'Generate income statement (งบกำไรขาดทุน)',
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': { description: 'Income statement report' },
        },
      },
    },
    '/graphql': {
      get: {
        tags: ['GraphQL'],
        summary: 'GraphQL Playground',
        description: 'Interactive GraphQL IDE (development only)',
        responses: {
          '200': { description: 'GraphQL Playground HTML' },
        },
      },
      post: {
        tags: ['GraphQL'],
        summary: 'GraphQL Endpoint',
        description: 'Execute GraphQL queries and mutations',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  variables: { type: 'object' },
                  operationName: { type: 'string' },
                },
              },
              example: {
                query: 'query { invoices { edges { node { id invoiceNo totalAmount } } } }',
              },
            },
          },
        },
        responses: {
          '200': { description: 'GraphQL response' },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ChartOfAccount: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string', description: 'Account code (e.g., 1100, 4100)' },
          name: { type: 'string', description: 'Account name in Thai' },
          nameEn: { type: 'string', description: 'Account name in English' },
          type: { type: 'string', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
          level: { type: 'integer', description: 'Account hierarchy level (1-4)' },
          isDetail: { type: 'boolean' },
          isSystem: { type: 'boolean' },
          isActive: { type: 'boolean' },
        },
      },
      ChartOfAccountInput: {
        type: 'object',
        required: ['code', 'name', 'type'],
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          nameEn: { type: 'string' },
          type: { type: 'string', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
          parentId: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          invoiceNo: { type: 'string', description: 'Invoice number (เลขที่ใบกำกับภาษี)' },
          invoiceDate: { type: 'string', format: 'date' },
          dueDate: { type: 'string', format: 'date' },
          customerId: { type: 'string' },
          subtotal: { type: 'integer', description: 'Amount in satang (สตางค์)' },
          vatAmount: { type: 'integer', description: 'VAT in satang' },
          totalAmount: { type: 'integer', description: 'Total in satang' },
          status: { type: 'string', enum: ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'CANCELLED'] },
        },
      },
      InvoiceInput: {
        type: 'object',
        required: ['customerId', 'invoiceDate', 'lines'],
        properties: {
          customerId: { type: 'string' },
          invoiceDate: { type: 'string', format: 'date' },
          dueDate: { type: 'string', format: 'date' },
          reference: { type: 'string' },
          poNumber: { type: 'string' },
          notes: { type: 'string' },
          lines: {
            type: 'array',
            items: { $ref: '#/components/schemas/InvoiceLineInput' },
          },
        },
      },
      InvoiceLineInput: {
        type: 'object',
        required: ['description', 'quantity', 'unitPrice'],
        properties: {
          productId: { type: 'string' },
          description: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          unitPrice: { type: 'integer', description: 'Price in satang' },
          discount: { type: 'integer', description: 'Discount in satang' },
          vatRate: { type: 'number', description: 'VAT rate percentage' },
        },
      },
      JournalEntryInput: {
        type: 'object',
        required: ['date', 'lines'],
        properties: {
          date: { type: 'string', format: 'date' },
          description: { type: 'string' },
          reference: { type: 'string' },
          lines: {
            type: 'array',
            items: { $ref: '#/components/schemas/JournalLineInput' },
          },
        },
      },
      JournalLineInput: {
        type: 'object',
        required: ['accountId'],
        properties: {
          accountId: { type: 'string' },
          description: { type: 'string' },
          debit: { type: 'integer', description: 'Amount in satang' },
          credit: { type: 'integer', description: 'Amount in satang' },
        },
      },
      CustomerInput: {
        type: 'object',
        required: ['name'],
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          nameEn: { type: 'string' },
          taxId: { type: 'string', description: 'Tax ID (เลขประจำตัวผู้เสียภาษี)' },
          branchCode: { type: 'string', description: 'Branch code (รหัสสาขา)' },
          address: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          creditLimit: { type: 'integer', description: 'Credit limit in satang' },
          creditDays: { type: 'integer' },
        },
      },
      ProductInput: {
        type: 'object',
        required: ['name'],
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          nameEn: { type: 'string' },
          description: { type: 'string' },
          unit: { type: 'string' },
          type: { type: 'string', enum: ['PRODUCT', 'SERVICE'] },
          salePrice: { type: 'integer', description: 'Price in satang' },
          costPrice: { type: 'integer', description: 'Cost in satang' },
          vatRate: { type: 'number' },
          isInventory: { type: 'boolean' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
      },
    },
  },
  security: [
    { bearerAuth: [] },
    { sessionAuth: [] },
  ],
};

// GET /api/docs - Get OpenAPI spec
export async function GET(req: NextRequest) {
  try {
    // Optionally require authentication for docs in production
    const session = await auth();
    if (process.env.NODE_ENV === 'production' && !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Return OpenAPI spec
    return NextResponse.json(openApiSpec, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error serving OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
}

// Re-export the spec for use in other modules
export { openApiSpec };
