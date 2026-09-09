import {
  CustomerRow,
  InvoiceRow,
  ItemRow,
  PurchaseInvoiceRow,
  PurchaseLine,
  SaleLine,
  StoreSettings,
  SupplierRow,
  TransactionRow,
} from '../types';

const STORAGE_KEYS = {
  INVOICES: 'azizi_invoices',
  PURCHASES: 'azizi_purchases',
  CUSTOMERS: 'azizi_customers',
  SUPPLIERS: 'azizi_suppliers',
  ITEMS: 'azizi_items',
  TRANSACTIONS: 'azizi_transactions',
  SETTINGS: 'azizi_settings',
};

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'بقالة العزي للمواد الغذائية',
  storePhone: '777000000',
  dark: false,
};

const INITIAL_ITEMS: ItemRow[] = [
  { id: 1, name: 'أرز الشعلان بسمتي 5 كجم', price: 4500, cost: 3800, stock: 25, minStock: 5 },
  { id: 2, name: 'سكر الأسرة ناعم 2 كجم', price: 1400, cost: 1150, stock: 40, minStock: 8 },
  { id: 3, name: 'زيت الطبخ عافية 1.5 لتر', price: 2200, cost: 1850, stock: 18, minStock: 4 },
  { id: 4, name: 'حليب دانو مجفف 900 جم', price: 3200, cost: 2700, stock: 15, minStock: 3 },
  { id: 5, name: 'شاي الكبوس أحمر 250 جم', price: 950, cost: 780, stock: 50, minStock: 10 },
  { id: 6, name: 'تونة الواحة قطعة واحدة', price: 750, cost: 600, stock: 60, minStock: 12 },
  { id: 7, name: 'مكرونة قودي 400 جم', price: 400, cost: 310, stock: 80, minStock: 15 },
  { id: 8, name: 'جبنة مثلثات لافاش كيري', price: 800, cost: 650, stock: 35, minStock: 6 },
  { id: 9, name: 'زبادي الهناء طازج', price: 250, cost: 200, stock: 3, minStock: 10 },
  { id: 10, name: 'صابون غسيل تايد 1.5 كجم', price: 1900, cost: 1550, stock: 20, minStock: 5 },
];

const INITIAL_CUSTOMERS: CustomerRow[] = [
  { id: 1, name: 'محمد القاسمي', phone: '777123456', balance: 4500 },
  { id: 2, name: 'عمار علي الخولاني', phone: '771987654', balance: 0 },
  { id: 3, name: 'أحمد سالم الرياشي', phone: '773554433', balance: 2200 },
];

const INITIAL_SUPPLIERS: SupplierRow[] = [
  { id: 1, name: 'شركة البركة للمواد الغذائية', phone: '771122334', balance: 0 },
  { id: 2, name: 'مؤسسة الوفاء للتجارة والاستيراد', phone: '775566778', balance: 25000 },
];

const INITIAL_INVOICES: InvoiceRow[] = [
  {
    id: 1,
    number: 1001,
    customer: 'محمد القاسمي',
    phone: '777123456',
    total: 4500,
    payment: 'آجل',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '14:30',
    lines: [
      { name: 'أرز الشعلان بسمتي 5 كجم', qty: 1, unit: 4500, total: 4500 },
    ],
    prevBalance: 0,
    newBalance: 4500,
  },
  {
    id: 2,
    number: 1002,
    customer: 'عميل نقدي',
    phone: '',
    total: 2150,
    payment: 'نقدي',
    date: new Date().toISOString().split('T')[0],
    time: '10:15',
    lines: [
      { name: 'سكر الأسرة ناعم 2 كجم', qty: 1, unit: 1400, total: 1400 },
      { name: 'تونة الواحة قطعة واحدة', qty: 1, unit: 750, total: 750 },
    ],
    prevBalance: 0,
    newBalance: 0,
  },
];

const INITIAL_PURCHASES: PurchaseInvoiceRow[] = [
  {
    id: 1,
    number: 501,
    supplier: 'شركة البركة للمواد الغذائية',
    phone: '771122334',
    total: 35000,
    payment: 'نقدي',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    time: '09:30',
    lines: [
      { name: 'أرز الشعلان بسمتي 5 كجم', qty: 10, cost: 3500, total: 35000 },
    ],
    prevBalance: 0,
    newBalance: 0,
  },
];

const INITIAL_TRANSACTIONS: TransactionRow[] = [
  {
    id: 1,
    customerId: 1,
    invoiceId: 1,
    type: 'invoice',
    amount: 4500,
    note: 'فاتورة مبيعات آجلة #1001',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '14:30',
  },
];

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

export class StorageService {
  static getSettings(): StoreSettings {
    return loadJson<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  static saveSettings(settings: StoreSettings): void {
    saveJson(STORAGE_KEYS.SETTINGS, settings);
  }

  static getItems(): ItemRow[] {
    return loadJson<ItemRow[]>(STORAGE_KEYS.ITEMS, INITIAL_ITEMS);
  }

  static saveItems(items: ItemRow[]): void {
    saveJson(STORAGE_KEYS.ITEMS, items);
  }

  static getCustomers(): CustomerRow[] {
    return loadJson<CustomerRow[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static saveCustomers(customers: CustomerRow[]): void {
    saveJson(STORAGE_KEYS.CUSTOMERS, customers);
  }

  static getSuppliers(): SupplierRow[] {
    return loadJson<SupplierRow[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }

  static saveSuppliers(suppliers: SupplierRow[]): void {
    saveJson(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  static getInvoices(): InvoiceRow[] {
    return loadJson<InvoiceRow[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }

  static saveInvoices(invoices: InvoiceRow[]): void {
    saveJson(STORAGE_KEYS.INVOICES, invoices);
  }

  static getPurchases(): PurchaseInvoiceRow[] {
    return loadJson<PurchaseInvoiceRow[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  }

  static savePurchases(purchases: PurchaseInvoiceRow[]): void {
    saveJson(STORAGE_KEYS.PURCHASES, purchases);
  }

  static getTransactions(): TransactionRow[] {
    return loadJson<TransactionRow[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  static saveTransactions(transactions: TransactionRow[]): void {
    saveJson(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  static nextInvoice(): number {
    const invoices = this.getInvoices();
    if (invoices.length === 0) return 1001;
    const maxNumber = invoices.reduce((max, inv) => (inv.number > max ? inv.number : max), 1000);
    return maxNumber + 1;
  }

  static nextPurchaseInvoice(): number {
    const purchases = this.getPurchases();
    if (purchases.length === 0) return 501;
    const maxNumber = purchases.reduce((max, p) => (p.number > max ? p.number : max), 500);
    return maxNumber + 1;
  }

  static addCustomer(name: string, phone: string): number {
    const clean = name.trim();
    if (!clean || clean === 'عميل نقدي') return -1;
    const customers = this.getCustomers();
    const existing = customers.find((c) => c.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      if (phone.trim()) {
        existing.phone = phone.trim();
        this.saveCustomers(customers);
      }
      return existing.id;
    }
    const newId = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
    const newCustomer: CustomerRow = {
      id: newId,
      name: clean,
      phone: phone.trim(),
      balance: 0,
    };
    customers.push(newCustomer);
    this.saveCustomers(customers);
    return newId;
  }

  static addSupplier(name: string, phone: string): number {
    const clean = name.trim();
    if (!clean) return -1;
    const suppliers = this.getSuppliers();
    const existing = suppliers.find((s) => s.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      if (phone.trim()) {
        existing.phone = phone.trim();
        this.saveSuppliers(suppliers);
      }
      return existing.id;
    }
    const newId = suppliers.length > 0 ? Math.max(...suppliers.map((s) => s.id)) + 1 : 1;
    const newSupplier: SupplierRow = {
      id: newId,
      name: clean,
      phone: phone.trim(),
      balance: 0,
    };
    suppliers.push(newSupplier);
    this.saveSuppliers(suppliers);
    return newId;
  }

  static addInvoice(
    number: number,
    customer: string,
    phone: string,
    total: number,
    payment: string,
    date: string,
    time: string,
    lines: SaleLine[]
  ): { id: number; prevBalance: number; newBalance: number } {
    const invoices = this.getInvoices();
    const items = this.getItems();
    const transactions = this.getTransactions();
    const customers = this.getCustomers();

    const cleanCustomer = customer.trim();
    let prevBalance = 0;
    let newBalance = 0;

    // Determine balances
    if (cleanCustomer && cleanCustomer !== 'عميل نقدي') {
      const existingCustomer = customers.find((c) => c.name.toLowerCase() === cleanCustomer.toLowerCase());
      if (existingCustomer) {
        prevBalance = existingCustomer.balance;
      }
      if (payment.includes('آجل') || payment.includes('دين')) {
        newBalance = prevBalance + total;
      } else {
        newBalance = prevBalance; // Cash payment doesn't change debt
      }
    }

    const invoiceId = invoices.length > 0 ? Math.max(...invoices.map((i) => i.id)) + 1 : 1;
    const newInvoice: InvoiceRow = {
      id: invoiceId,
      number,
      customer: cleanCustomer || 'عميل نقدي',
      phone: phone.trim(),
      total,
      payment,
      date,
      time,
      lines,
      prevBalance,
      newBalance,
    };
    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);

    // Update or insert items (deduct sold stock)
    lines.forEach((line) => {
      const existing = items.find((i) => i.name.trim().toLowerCase() === line.name.trim().toLowerCase());
      if (existing) {
        existing.price = line.unit;
        existing.stock = Math.max(0, existing.stock - line.qty);
      } else {
        const nextItemId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
        items.push({
          id: nextItemId,
          name: line.name.trim(),
          price: line.unit,
          stock: 0,
          minStock: 0,
        });
      }
    });
    this.saveItems(items);

    // Handle customer balance if credit sale ("آجل" or "دين")
    if (cleanCustomer && cleanCustomer !== 'عميل نقدي') {
      const cid = this.addCustomer(cleanCustomer, phone);
      if (payment.includes('آجل') || payment.includes('دين')) {
        const updatedCustomers = this.getCustomers();
        const target = updatedCustomers.find((c) => c.id === cid);
        if (target) {
          target.balance = newBalance;
          this.saveCustomers(updatedCustomers);

          const txId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;
          transactions.unshift({
            id: txId,
            customerId: cid,
            invoiceId,
            type: 'invoice',
            amount: total,
            note: `فاتورة مبيعات آجلة #${number}`,
            date,
            time,
          });
          this.saveTransactions(transactions);
        }
      }
    }

    return { id: invoiceId, prevBalance, newBalance };
  }

  static addPurchaseInvoice(
    number: number,
    supplier: string,
    phone: string,
    total: number,
    payment: string,
    date: string,
    time: string,
    lines: PurchaseLine[]
  ): { id: number; prevBalance: number; newBalance: number } {
    const purchases = this.getPurchases();
    const items = this.getItems();
    const suppliers = this.getSuppliers();

    const cleanSupplier = supplier.trim();
    let prevBalance = 0;
    let newBalance = 0;

    if (cleanSupplier) {
      const existingSupplier = suppliers.find((s) => s.name.toLowerCase() === cleanSupplier.toLowerCase());
      if (existingSupplier) {
        prevBalance = existingSupplier.balance;
      }
      if (payment.includes('آجل') || payment.includes('دين')) {
        newBalance = prevBalance + total;
      } else {
        newBalance = prevBalance;
      }
    }

    const purchaseId = purchases.length > 0 ? Math.max(...purchases.map((p) => p.id)) + 1 : 1;
    const newPurchase: PurchaseInvoiceRow = {
      id: purchaseId,
      number,
      supplier: cleanSupplier,
      phone: phone.trim(),
      total,
      payment,
      date,
      time,
      lines,
      prevBalance,
      newBalance,
    };
    purchases.unshift(newPurchase);
    this.savePurchases(purchases);

    // Increase stock of items from purchase
    lines.forEach((line) => {
      const existing = items.find((i) => i.name.trim().toLowerCase() === line.name.trim().toLowerCase());
      if (existing) {
        existing.stock += line.qty;
        existing.cost = line.cost;
      } else {
        const nextItemId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
        items.push({
          id: nextItemId,
          name: line.name.trim(),
          price: Math.round(line.cost * 1.2), // Suggest markup 20%
          cost: line.cost,
          stock: line.qty,
          minStock: 5,
        });
      }
    });
    this.saveItems(items);

    // If credit, add to supplier balance
    if (cleanSupplier) {
      const sid = this.addSupplier(cleanSupplier, phone);
      if (payment.includes('آجل') || payment.includes('دين')) {
        const updatedSuppliers = this.getSuppliers();
        const target = updatedSuppliers.find((s) => s.id === sid);
        if (target) {
          target.balance = newBalance;
          this.saveSuppliers(updatedSuppliers);
        }
      }
    }

    return { id: purchaseId, prevBalance, newBalance };
  }

  static getCustomerInvoices(name: string): InvoiceRow[] {
    const invoices = this.getInvoices();
    return invoices.filter((i) => i.customer.trim().toLowerCase() === name.trim().toLowerCase());
  }

  static getCustomerTransactions(customerId: number): TransactionRow[] {
    const txs = this.getTransactions();
    return txs.filter((t) => t.customerId === customerId);
  }

  static addPayment(customerId: number, amount: number, note: string, date: string, time: string): void {
    if (amount <= 0) return;
    const customers = this.getCustomers();
    const target = customers.find((c) => c.id === customerId);
    if (!target) return;

    target.balance = Math.max(0, target.balance - amount);
    this.saveCustomers(customers);

    const transactions = this.getTransactions();
    const txId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;
    transactions.unshift({
      id: txId,
      customerId,
      type: 'payment',
      amount,
      note: note || 'سداد حساب',
      date,
      time,
    });
    this.saveTransactions(transactions);
  }

  static addSupplierPayment(supplierId: number, amount: number): void {
    if (amount <= 0) return;
    const suppliers = this.getSuppliers();
    const target = suppliers.find((s) => s.id === supplierId);
    if (!target) return;
    target.balance = Math.max(0, target.balance - amount);
    this.saveSuppliers(suppliers);
  }

  static adjustStock(itemId: number, delta: number): void {
    const items = this.getItems();
    const target = items.find((i) => i.id === itemId);
    if (target) {
      target.stock = Math.max(0, target.stock + delta);
      this.saveItems(items);
    }
  }

  static addItem(name: string, price: number, stock: number, minStock: number, cost?: number): ItemRow {
    const items = this.getItems();
    const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    const newItem: ItemRow = {
      id: nextId,
      name: name.trim(),
      price,
      cost: cost || Math.round(price * 0.8),
      stock,
      minStock,
    };
    items.push(newItem);
    this.saveItems(items);
    return newItem;
  }

  /**
   * Export all application data into a JSON structure for storage in a dedicated file
   */
  static exportDatabaseJson(): string {
    const fullBackup = {
      appName: 'بقالة العزي للمواد الغذائية - نظام إدارة ونقاط البيع',
      exportDate: new Date().toISOString(),
      version: '1.2.0',
      settings: this.getSettings(),
      invoices: this.getInvoices(),
      purchases: this.getPurchases(),
      customers: this.getCustomers(),
      suppliers: this.getSuppliers(),
      items: this.getItems(),
      transactions: this.getTransactions(),
    };
    return JSON.stringify(fullBackup, null, 2);
  }

  /**
   * Triggers download of the application database file
   */
  static downloadBackupFile(): void {
    const jsonStr = this.exportDatabaseJson();
    const d = new Date().toISOString().split('T')[0];
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `بيانات_بقالة_العزي_${d}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Imports database file and restores all store data
   */
  static importDatabaseJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') return false;

      if (Array.isArray(data.invoices)) this.saveInvoices(data.invoices);
      if (Array.isArray(data.purchases)) this.savePurchases(data.purchases);
      if (Array.isArray(data.customers)) this.saveCustomers(data.customers);
      if (Array.isArray(data.suppliers)) this.saveSuppliers(data.suppliers);
      if (Array.isArray(data.items)) this.saveItems(data.items);
      if (Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
      if (data.settings && typeof data.settings === 'object') this.saveSettings(data.settings);

      return true;
    } catch (e) {
      console.error('Failed to import database file:', e);
      return false;
    }
  }
}

