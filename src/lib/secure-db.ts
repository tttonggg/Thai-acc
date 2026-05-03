/**
 * Secure Database Access Layer
 * Automatically encrypts/decrypts sensitive fields
 */

import { prisma } from './db';
import { encrypt, decrypt, SENSITIVE_FIELDS } from './encryption-service';

// Type-safe field encryption for Customer
export async function createCustomerSecure(data: {
  taxId?: string | null;
  [key: string]: unknown;
}) {
  const encryptedData = { ...data };
  if (data.taxId) {
    encryptedData.taxId = encrypt(data.taxId);
  }
  return prisma.customer.create({ data: encryptedData as any });
}

export async function getCustomerSecure(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return null;

  return {
    ...customer,
    taxId: decrypt(customer.taxId),
  };
}

// Type-safe field encryption for Vendor
export async function createVendorSecure(data: {
  taxId?: string | null;
  bankAccount?: string | null;
  [key: string]: unknown;
}) {
  const encryptedData = { ...data };
  if (data.taxId) encryptedData.taxId = encrypt(data.taxId);
  if (data.bankAccount) encryptedData.bankAccount = encrypt(data.bankAccount);
  return prisma.vendor.create({ data: encryptedData as any });
}

export async function getVendorSecure(id: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) return null;

  return {
    ...vendor,
    taxId: decrypt(vendor.taxId),
    bankAccount: decrypt(vendor.bankAccount),
  };
}

// Type-safe field encryption for Employee
export async function createEmployeeSecure(data: {
  taxId?: string | null;
  bankAccountNo?: string | null;
  idCardNumber?: string | null;
  socialSecurityNo?: string | null;
  [key: string]: unknown;
}) {
  const encryptedData = { ...data };
  if (data.taxId) encryptedData.taxId = encrypt(data.taxId);
  if (data.bankAccountNo) encryptedData.bankAccountNo = encrypt(data.bankAccountNo);
  if (data.idCardNumber) encryptedData.idCardNumber = encrypt(data.idCardNumber);
  if (data.socialSecurityNo) encryptedData.socialSecurityNo = encrypt(data.socialSecurityNo);
  return prisma.employee.create({ data: encryptedData as any });
}

export async function getEmployeeSecure(id: string) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return null;

  return {
    ...employee,
    taxId: decrypt(employee.taxId),
    bankAccountNo: decrypt(employee.bankAccountNo),
    idCardNumber: decrypt(employee.idCardNumber),
    socialSecurityNo: decrypt(employee.socialSecurityNo),
  };
}

// Type-safe field encryption for BankAccount
export async function createBankAccountSecure(data: {
  accountNumber: string;
  [key: string]: unknown;
}) {
  const encryptedData = { ...data };
  encryptedData.accountNumber = encrypt(data.accountNumber) as string;
  return prisma.bankAccount.create({ data: encryptedData as any });
}

export async function getBankAccountSecure(id: string) {
  const account = await prisma.bankAccount.findUnique({ where: { id } });
  if (!account) return null;

  return {
    ...account,
    accountNumber: decrypt(account.accountNumber),
  };
}

// Bulk decrypt for lists
export function decryptCustomerList(customers: Array<{ taxId: string | null }>) {
  return customers.map((c) => ({
    ...c,
    taxId: decrypt(c.taxId),
  }));
}

export function decryptVendorList(
  vendors: Array<{
    taxId: string | null;
    bankAccount: string | null;
  }>
) {
  return vendors.map((v) => ({
    ...v,
    taxId: decrypt(v.taxId),
    bankAccount: decrypt(v.bankAccount),
  }));
}

export function decryptEmployeeList(
  employees: Array<{
    taxId: string | null;
    bankAccountNo: string | null;
    idCardNumber: string | null;
    socialSecurityNo: string | null;
  }>
) {
  return employees.map((e) => ({
    ...e,
    taxId: decrypt(e.taxId),
    bankAccountNo: decrypt(e.bankAccountNo),
    idCardNumber: decrypt(e.idCardNumber),
    socialSecurityNo: decrypt(e.socialSecurityNo),
  }));
}

export function decryptBankAccountList(accounts: Array<{ accountNumber: string }>) {
  return accounts.map((a) => ({
    ...a,
    accountNumber: decrypt(a.accountNumber),
  }));
}
