import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-utils';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'ACCOUNTANT']);

    const body = await request.json();
    const { dataTypes, format, dateFrom, dateTo, includeDeleted } = body;

    if (!dataTypes || !Array.isArray(dataTypes) || dataTypes.length === 0) {
      return NextResponse.json({ error: 'No data types selected' }, { status: 400 });
    }

    if (!format || !['csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // Fetch all requested data
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      dataTypes: dataTypes,
    };

    let totalRecords = 0;

    // Fetch Customers
    if (dataTypes.includes('customers')) {
      const customers = await prisma.customer.findMany({
        where: includeDeleted ? {} : { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      exportData.customers = customers;
      totalRecords += customers.length;
    }

    // Fetch Vendors
    if (dataTypes.includes('vendors')) {
      const vendors = await prisma.vendor.findMany({
        where: includeDeleted ? {} : { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      exportData.vendors = vendors;
      totalRecords += vendors.length;
    }

    // Fetch Products
    if (dataTypes.includes('products')) {
      const products = await prisma.product.findMany({
        where: includeDeleted ? {} : { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      exportData.products = products;
      totalRecords += products.length;
    }

    // Fetch Chart of Accounts
    if (dataTypes.includes('accounts')) {
      const accounts = await prisma.chartOfAccount.findMany({
        orderBy: { code: 'asc' },
      });
      exportData.accounts = accounts;
      totalRecords += accounts.length;
    }

    // Fetch Invoices
    if (dataTypes.includes('invoices')) {
      const invoiceWhere: any = includeDeleted ? {} : { deletedAt: null };
      if (hasDateFilter) {
        invoiceWhere.createdAt = dateFilter;
      }
      const invoices = await prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          lines: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      exportData.invoices = invoices;
      totalRecords += invoices.length;
    }

    // Fetch Receipts
    if (dataTypes.includes('receipts')) {
      const receiptWhere: any = includeDeleted ? {} : { deletedAt: null };
      if (hasDateFilter) {
        receiptWhere.createdAt = dateFilter;
      }
      const receipts = await prisma.receipt.findMany({
        where: receiptWhere,
        include: {
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      exportData.receipts = receipts;
      totalRecords += receipts.length;
    }

    exportData.totalRecords = totalRecords;

    // Generate response based on format
    if (format === 'json') {
      const json = JSON.stringify(exportData, null, 2);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="thai-erp-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format
    let csvContent = '';

    // Generate CSV for each data type
    for (const dataType of dataTypes) {
      csvContent += `\n# ${dataType.toUpperCase()}\n`;

      switch (dataType) {
        case 'customers':
          csvContent += generateCustomerCSV(exportData.customers);
          break;
        case 'vendors':
          csvContent += generateVendorCSV(exportData.vendors);
          break;
        case 'products':
          csvContent += generateProductCSV(exportData.products);
          break;
        case 'accounts':
          csvContent += generateAccountCSV(exportData.accounts);
          break;
        case 'invoices':
          csvContent += generateInvoiceCSV(exportData.invoices);
          break;
        case 'receipts':
          csvContent += generateReceiptCSV(exportData.receipts);
          break;
      }

      csvContent += '\n';
    }

    // Add metadata
    const metadata = [
      `# Export Date,${new Date().toISOString()}`,
      `# Exported By,${user.email}`,
      `# Total Records,${totalRecords}`,
      '',
    ].join('\n');

    return new NextResponse(metadata + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="thai-erp-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// CSV Generation Functions
function generateCustomerCSV(customers: any[]): string {
  if (customers.length === 0) return '# No customers found\n';

  const headers = [
    'code',
    'name',
    'taxId',
    'branchCode',
    'address',
    'subDistrict',
    'district',
    'province',
    'postalCode',
    'phone',
    'email',
    'creditLimit',
    'paymentTerms',
    'isActive',
    'createdAt',
  ];

  const rows = customers.map((c) => [
    c.code,
    `"${c.name}"`,
    c.taxId || '',
    c.branchCode || '',
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.subDistrict || '').replace(/"/g, '""')}"`,
    `"${(c.district || '').replace(/"/g, '""')}"`,
    `"${(c.province || '').replace(/"/g, '""')}"`,
    c.postalCode || '',
    c.phone || '',
    c.email || '',
    c.creditLimit || 0,
    c.paymentTerms || 0,
    c.isActive ? 'Y' : 'N',
    c.createdAt,
  ]);

  return headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n') + '\n';
}

function generateVendorCSV(vendors: any[]): string {
  if (vendors.length === 0) return '# No vendors found\n';

  const headers = [
    'code',
    'name',
    'taxId',
    'branchCode',
    'address',
    'subDistrict',
    'district',
    'province',
    'postalCode',
    'phone',
    'email',
    'paymentTerms',
    'isActive',
    'createdAt',
  ];

  const rows = vendors.map((v) => [
    v.code,
    `"${v.name}"`,
    v.taxId || '',
    v.branchCode || '',
    `"${(v.address || '').replace(/"/g, '""')}"`,
    `"${(v.subDistrict || '').replace(/"/g, '""')}"`,
    `"${(v.district || '').replace(/"/g, '""')}"`,
    `"${(v.province || '').replace(/"/g, '""')}"`,
    v.postalCode || '',
    v.phone || '',
    v.email || '',
    v.paymentTerms || 0,
    v.isActive ? 'Y' : 'N',
    v.createdAt,
  ]);

  return headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n') + '\n';
}

function generateProductCSV(products: any[]): string {
  if (products.length === 0) return '# No products found\n';

  const headers = [
    'code',
    'name',
    'description',
    'unit',
    'price',
    'cost',
    'vatType',
    'whtRate',
    'incomeType',
    'isActive',
    'stockTracked',
    'createdAt',
  ];

  const rows = products.map((p) => [
    p.code,
    `"${p.name}"`,
    `"${(p.description || '').replace(/"/g, '""')}"`,
    p.unit || '',
    p.price || 0,
    p.cost || 0,
    p.vatType || 'EXCLUDED',
    p.whtRate || 0,
    p.incomeType || 'service',
    p.isActive ? 'Y' : 'N',
    p.stockTracked ? 'Y' : 'N',
    p.createdAt,
  ]);

  return headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n') + '\n';
}

function generateAccountCSV(accounts: any[]): string {
  if (accounts.length === 0) return '# No accounts found\n';

  const headers = [
    'code',
    'name',
    'nameEn',
    'type',
    'level',
    'parentId',
    'isDetail',
    'isSystem',
    'isActive',
    'createdAt',
  ];

  const rows = accounts.map((a) => [
    a.code,
    `"${a.name}"`,
    `"${(a.nameEn || '').replace(/"/g, '""')}"`,
    a.type,
    a.level,
    a.parentId || '',
    a.isDetail ? 'Y' : 'N',
    a.isSystem ? 'Y' : 'N',
    a.isActive ? 'Y' : 'N',
    a.createdAt,
  ]);

  return headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n') + '\n';
}

function generateInvoiceCSV(invoices: any[]): string {
  if (invoices.length === 0) return '# No invoices found\n';

  // For invoices, we need to flatten the data
  const headers = [
    'invoiceNo',
    'date',
    'customerCode',
    'customerName',
    'subtotal',
    'vatAmount',
    'whtAmount',
    'totalAmount',
    'status',
    'paymentStatus',
    'dueDate',
    'paidAmount',
    'createdAt',
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNo,
    inv.date,
    inv.customer?.code || '',
    `"${(inv.customer?.name || '').replace(/"/g, '""')}"`,
    inv.subtotal || 0,
    inv.vatAmount || 0,
    inv.whtAmount || 0,
    inv.totalAmount || 0,
    inv.status,
    inv.paymentStatus,
    inv.dueDate || '',
    inv.paidAmount || 0,
    inv.createdAt,
  ]);

  return headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n') + '\n';
}

function generateReceiptCSV(receipts: any[]): string {
  if (receipts.length === 0) return '# No receipts found\n';

  const headers = [
    'receiptNo',
    'date',
    'customerCode',
    'customerName',
    'amount',
    'paymentMethod',
    'reference',
    'status',
    'createdAt',
  ];

  const rows = receipts.map((r) => [
    r.receiptNo,
    r.date,
    r.customer?.code || '',
    `"${(r.customer?.name || '').replace(/"/g, '""')}"`,
    r.amount || 0,
    r.paymentMethod || '',
    r.reference || '',
    r.status,
    r.createdAt,
  ]);

  return headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n') + '\n';
}
