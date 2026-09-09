export interface SaleLine {
  name: string;
  qty: number;
  unit: number;
  total: number;
}

export interface PurchaseLine {
  name: string;
  qty: number;
  cost: number;
  total: number;
}

export interface InvoiceRow {
  id: number;
  number: number;
  customer: string;
  phone: string;
  total: number;
  payment: string; // 'نقدي' | 'آجل' | etc.
  date: string;
  time: string;
  lines?: SaleLine[];
  prevBalance?: number; // الرصيد السابق للعميل
  newBalance?: number;  // الرصيد التراكمي الكلي بعد الفاتورة
}

export interface PurchaseInvoiceRow {
  id: number;
  number: number;
  supplier: string;
  phone: string;
  total: number;
  payment: string; // 'نقدي' | 'آجل'
  date: string;
  time: string;
  lines: PurchaseLine[];
  prevBalance?: number; // الرصيد السابق للمورد
  newBalance?: number;  // الرصيد التراكمي للمورد بعد الفاتورة
}

export interface CustomerRow {
  id: number;
  name: string;
  phone: string;
  balance: number;
}

export interface SupplierRow {
  id: number;
  name: string;
  phone: string;
  balance: number; // المبلغ المستحق للمورد علينا
}

export interface ItemRow {
  id: number;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
}

export interface TransactionRow {
  id: number;
  customerId: number;
  invoiceId?: number;
  type: string; // 'invoice' | 'payment'
  amount: number;
  note: string;
  date: string;
  time: string;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  dark: boolean;
}

