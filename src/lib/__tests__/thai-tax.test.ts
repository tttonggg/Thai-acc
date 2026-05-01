import { describe, it, expect } from 'vitest';

describe('Thai Tax Calculations', () => {
  describe('VAT (ภาษีมูลค่าเพิ่ม 7%)', () => {
    it('should calculate VAT from net amount correctly', () => {
      const netAmount = 1000;
      const vatRate = 0.07;
      const vat = netAmount * vatRate;
      const total = netAmount + vat;

      expect(vat).toBe(70);
      expect(total).toBe(1070);
    });

    it('should calculate VAT from gross amount (excluding VAT)', () => {
      const grossAmount = 1070;
      const netAmount = grossAmount / 1.07;
      const vat = grossAmount - netAmount;

      expect(Math.round(netAmount)).toBe(1000);
      expect(Math.round(vat)).toBe(70);
    });

    it('should handle zero VAT correctly', () => {
      const netAmount = 1000;
      const vat = netAmount * 0;
      const total = netAmount + vat;

      expect(vat).toBe(0);
      expect(total).toBe(1000);
    });

    it('should handle edge case of very small amounts', () => {
      const netAmount = 1;
      const vat = netAmount * 0.07;

      expect(vat).toBe(0.07);
    });
  });

  describe('WHT PND3 (ภาษีหัก ณ ที่จ่าย - เงินเดือน)', () => {
    const pnd3Rates: { [key: string]: number } = {
      '0-150000': 0,
      '150001-300000': 0.05,
      '300001-500000': 0.1,
      '500001-750000': 0.15,
      '750001-1000000': 0.2,
      '1000001-2000000': 0.25,
      '2000001-5000000': 0.3,
      '5000001+': 0.35,
    };

    it('should calculate WHT PND3 for income bracket 300,001-500,000 (10%)', () => {
      const income = 400000;
      const rate = pnd3Rates['300001-500000'];
      const wht = income * rate;

      expect(wht).toBe(40000);
    });

    it('should calculate WHT PND3 for income bracket 150,001-300,000 (5%)', () => {
      const income = 200000;
      const rate = pnd3Rates['150001-300000'];
      const wht = income * rate;

      expect(wht).toBe(10000);
    });

    it('should calculate WHT PND3 for top bracket 5,000,001+ (35%)', () => {
      const income = 6000000;
      const rate = pnd3Rates['5000001+'];
      const wht = income * rate;

      expect(wht).toBe(2100000);
    });

    it('should handle zero income', () => {
      const income = 0;
      const rate = pnd3Rates['0-150000'];
      const wht = income * rate;

      expect(wht).toBe(0);
    });
  });

  describe('WHT PND53 (ภาษีหัก ณ ที่จ่าย - ค่าบริการ/เช่า)', () => {
    it('should calculate WHT PND53 for services (3%)', () => {
      const amount = 100000;
      const rate = 0.03;
      const wht = amount * rate;
      const netPayment = amount - wht;

      expect(wht).toBe(3000);
      expect(netPayment).toBe(97000);
    });

    it('should calculate WHT PND53 for rent (5%)', () => {
      const amount = 50000;
      const rate = 0.05;
      const wht = amount * rate;
      const netPayment = amount - wht;

      expect(wht).toBe(2500);
      expect(netPayment).toBe(47500);
    });

    it('should calculate WHT PND53 for advertising (2%)', () => {
      const amount = 100000;
      const rate = 0.02;
      const wht = amount * rate;

      expect(wht).toBe(2000);
    });

    it('should handle professional fees (3%)', () => {
      const amount = 150000;
      const rate = 0.03;
      const wht = amount * rate;

      expect(wht).toBe(4500);
    });
  });

  describe('Combined Tax Calculations', () => {
    it('should calculate VAT + WHT PND53 for service invoice', () => {
      const serviceAmount = 100000;
      const vatRate = 0.07;
      const whtRate = 0.03;

      const vat = serviceAmount * vatRate;
      const wht = serviceAmount * whtRate;
      const totalInvoice = serviceAmount + vat;
      const netPayment = totalInvoice - wht;

      expect(Math.round(vat)).toBe(7000);
      expect(Math.round(wht)).toBe(3000);
      expect(totalInvoice).toBe(107000);
      expect(netPayment).toBe(104000);
    });

    it('should calculate net tax payable (VAT payable - VAT deductible - WHT)', () => {
      const vatOutput = 7000; // VAT on sales
      const vatInput = 3000; // VAT on purchases
      const wht = 2000; // WHT deducted by customers
      const vatPayable = vatOutput - vatInput;
      const netTaxPayable = vatPayable - wht;

      expect(vatPayable).toBe(4000);
      expect(netTaxPayable).toBe(2000);
    });
  });
});
