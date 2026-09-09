import React, { useState, useEffect } from 'react';
import { CustomerRow, InvoiceRow, ItemRow, SaleLine, StoreSettings } from './types';
import { StorageService } from './db/storage';
import {
  today,
  now,
  shareWhatsApp,
  openPrintableDocument,
  formatMoney,
  renderReceiptCanvas,
  printCanvasReceipt,
} from './services/nativeServices';
import { InvoiceScreen } from './components/InvoiceScreen';
import { PurchaseInvoiceScreen } from './components/PurchaseInvoiceScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { CustomerDialog } from './components/CustomerDialog';
import { LedgerDialog } from './components/LedgerDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { PrinterDialog } from './components/PrinterDialog';
import { ReceiptPreviewModal } from './components/ReceiptPreviewModal';
import {
  ReceiptText,
  Truck,
  History,
  Users,
  Package,
  BarChart3,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';

interface PreviewModalState {
  invoiceNo: number;
  customer: string;
  phone: string;
  payment: string;
  lines: any[];
  total: number;
  dateStr?: string;
  timeStr?: string;
  operationType?: string;
  prevBalance?: number;
  newBalance?: number;
}

export const App: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(() => StorageService.getSettings());
  const [tab, setTab] = useState<'الفاتورة' | 'شراء مورد' | 'الفواتير' | 'العملاء' | 'الأصناف' | 'التقارير'>('الفاتورة');

  // Form State for Sales Invoice
  const [invoiceNo, setInvoiceNo] = useState<number>(() => StorageService.nextInvoice());
  const [customer, setCustomer] = useState('عميل نقدي');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState('نقدي');
  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState('1');
  const [totalInput, setTotalInput] = useState('');
  const [lines, setLines] = useState<SaleLine[]>([]);

  // Database lists
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [inventory, setInventory] = useState<ItemRow[]>([]);

  // Dialogs
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [printerOpen, setPrinterOpen] = useState(false);
  const [modalPreview, setModalPreview] = useState<PreviewModalState | null>(null);

  const refreshData = () => {
    setInvoices(StorageService.getInvoices());
    setCustomers(StorageService.getCustomers());
    setInventory(StorageService.getItems());
    setInvoiceNo(StorageService.nextInvoice());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Sync dark mode class with HTML element
  useEffect(() => {
    if (settings.dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.dark]);

  const handleSaveInvoice = () => {
    if (lines.length === 0) return;
    const total = lines.reduce((sum, l) => sum + l.total, 0);
    const dateStr = today();
    const timeStr = now();

    const res = StorageService.addInvoice(
      invoiceNo,
      customer,
      phone,
      total,
      payment,
      dateStr,
      timeStr,
      lines
    );

    // Prompt receipt preview modal with 3 balance values
    setModalPreview({
      invoiceNo,
      customer,
      phone,
      payment,
      lines: [...lines],
      total,
      dateStr,
      timeStr,
      operationType: 'فاتورة مبيعات',
      prevBalance: res.prevBalance,
      newBalance: res.newBalance,
    });

    // Reset fields for the next sale
    setLines([]);
    setCustomer('عميل نقدي');
    setPhone('');
    setPayment('نقدي');
    setItemName('');
    setQty('1');
    setTotalInput('');
    refreshData();
  };

  const handleCustomerSaved = (name: string, customerPhone: string) => {
    const clean = name.trim();
    if (!clean || clean === 'عميل نقدي') return;
    StorageService.addCustomer(clean, customerPhone);
    setCustomer(clean);
    setPhone(customerPhone);
    setCustomerOpen(false);
    refreshData();
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    setSettingsOpen(false);
  };

  const handleShareCurrentWhatsApp = () => {
    const total = lines.reduce((sum, l) => sum + l.total, 0);
    const text =
      `*${settings.storeName}*\n` +
      `فاتورة رقم: #${invoiceNo}\n` +
      `العميل: ${customer.trim() || 'عميل نقدي'}\n` +
      `طريقة الدفع: ${payment}\n` +
      `التاريخ: ${today()} ${now()}\n` +
      `------------------------\n` +
      lines.map((l) => `• ${l.name} (${formatMoney(l.qty)} × ${formatMoney(l.unit)}) = ${formatMoney(l.total)} ر.ي`).join('\n') +
      `\n------------------------\n` +
      `*الإجمالي: ${formatMoney(total)} ر.ي*`;

    shareWhatsApp(text, phone);
  };

  const handleShareCurrentPdf = () => {
    const total = lines.reduce((sum, l) => sum + l.total, 0);
    const existing = StorageService.getCustomers().find((c) => c.name.trim() === customer.trim());
    const prevBalance = existing ? existing.balance : 0;
    const newBalance = payment === 'آجل' ? prevBalance + total : prevBalance;

    const html = `
      <div class="header">
        <h1>${settings.storeName}</h1>
        <h2>فاتورة مبيعات رقم #${invoiceNo}</h2>
      </div>
      <div class="meta">
        <div><strong>العميل:</strong> ${customer.trim() || 'عميل نقدي'}</div>
        <div><strong>رقم الهاتف:</strong> ${phone || 'غير مسجل'}</div>
        <div><strong>طريقة الدفع:</strong> ${payment}</div>
        <div><strong>التاريخ والوقت:</strong> ${today()} ${now()}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${lines
            .map(
              (l) => `
            <tr>
              <td>${l.name}</td>
              <td>${formatMoney(l.qty)}</td>
              <td>${formatMoney(l.unit)} ر.ي</td>
              <td>${formatMoney(l.total)} ر.ي</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>١. الرصيد السابق:</span>
          <strong>${formatMoney(prevBalance)} ر.ي</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>٢. مبلغ الفاتورة الحالية:</span>
          <strong style="color: #0284c7;">${formatMoney(total)} ر.ي</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
          <span>٣. الرصيد التراكمي:</span>
          <strong>${formatMoney(newBalance)} ر.ي</strong>
        </div>
      </div>
    `;
    openPrintableDocument(`فاتورة_${invoiceNo}`, html);
  };

  const handleOpenReceiptModal = () => {
    const total = lines.reduce((sum, l) => sum + l.total, 0);
    const existing = StorageService.getCustomers().find((c) => c.name.trim() === customer.trim());
    const prevBalance = existing ? existing.balance : 0;
    const newBalance = payment === 'آجل' ? prevBalance + total : prevBalance;

    setModalPreview({
      invoiceNo,
      customer,
      phone,
      payment,
      lines: [...lines],
      total,
      dateStr: today(),
      timeStr: now(),
      operationType: 'فاتورة مبيعات',
      prevBalance,
      newBalance,
    });
  };

  const handlePrintCurrentReceipt = () => {
    if (lines.length === 0) {
      setPrinterOpen(true);
      return;
    }
    const total = lines.reduce((sum, l) => sum + l.total, 0);
    const existing = StorageService.getCustomers().find((c) => c.name.trim() === customer.trim());
    const prevBalance = existing ? existing.balance : 0;
    const newBalance = payment === 'آجل' ? prevBalance + total : prevBalance;

    const canvas = renderReceiptCanvas(
      invoiceNo,
      settings.storeName,
      customer,
      lines,
      total,
      payment,
      today(),
      now(),
      384,
      'فاتورة مبيعات',
      prevBalance,
      newBalance,
      phone
    );
    printCanvasReceipt(canvas);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div>
          <h1 className="text-sm font-extrabold text-blue-900 dark:text-blue-300 tracking-tight leading-tight">
            {settings.storeName}
          </h1>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            نقطة بيع ومحاسبة وإدارة المخزون • المشتريات والمبيعات
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              handleSaveSettings({ ...settings, dark: !settings.dark })
            }
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
            title="تبديل المظهر الداكن/الفاتح"
          >
            {settings.dark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={() => setTab('التقارير')}
            className={`p-2 rounded-xl transition ${
              tab === 'التقارير'
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="التقارير"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
            title="الإعدادات وحفظ البيانات"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'الفاتورة' && (
          <InvoiceScreen
            invoiceNo={invoiceNo}
            customer={customer}
            phone={phone}
            payment={payment}
            itemName={itemName}
            qty={qty}
            totalInput={totalInput}
            rows={lines}
            inventory={inventory}
            setCustomer={setCustomer}
            setPhone={setPhone}
            setPayment={setPayment}
            setName={setItemName}
            setQty={setQty}
            setTotal={setTotalInput}
            setRows={setLines}
            onSave={handleSaveInvoice}
            onOpenCustomerPicker={() => setCustomerOpen(true)}
            onOpenPrinter={handlePrintCurrentReceipt}
            onShareImage={handleOpenReceiptModal}
            onSharePdf={handleShareCurrentPdf}
            onShareWhatsApp={handleShareCurrentWhatsApp}
            onOpenSms={handleOpenReceiptModal}
          />
        )}

        {tab === 'شراء مورد' && (
          <PurchaseInvoiceScreen
            inventory={inventory}
            onInventoryUpdated={refreshData}
            onPreviewReceipt={(receipt) => setModalPreview(receipt)}
          />
        )}

        {tab === 'الفواتير' && (
          <HistoryScreen
            invoices={invoices}
            storeName={settings.storeName}
            onPreviewInvoice={(inv) =>
              setModalPreview({
                invoiceNo: inv.number,
                customer: inv.customer,
                phone: inv.phone,
                payment: inv.payment,
                lines: inv.lines || [],
                total: inv.total,
                dateStr: inv.date,
                timeStr: inv.time,
                operationType: 'فاتورة مبيعات',
                prevBalance: inv.prevBalance || 0,
                newBalance: inv.newBalance || (inv.payment === 'آجل' ? inv.total : 0),
              })
            }
          />
        )}

        {tab === 'العملاء' && (
          <CustomersScreen
            customers={customers}
            onSelectCustomer={(c) => setSelectedCustomer(c)}
            onNewCustomer={() => {
              setCustomer('');
              setPhone('');
              setCustomerOpen(true);
            }}
          />
        )}

        {tab === 'الأصناف' && (
          <InventoryScreen
            inventory={inventory}
            onAdjustStock={(id, delta) => {
              StorageService.adjustStock(id, delta);
              refreshData();
            }}
            onAddItem={(name, price, stock, minStock) => {
              StorageService.addItem(name, price, stock, minStock);
              refreshData();
            }}
          />
        )}

        {tab === 'التقارير' && (
          <ReportsScreen
            invoices={invoices}
            customers={customers}
            inventory={inventory}
            storeName={settings.storeName}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-700/80 px-1 py-1 flex items-center justify-around shadow-lg">
        {[
          { key: 'الفاتورة', label: 'الفاتورة', icon: ReceiptText },
          { key: 'شراء مورد', label: 'شراء مورد', icon: Truck },
          { key: 'الفواتير', label: 'الفواتير', icon: History },
          { key: 'العملاء', label: 'العملاء', icon: Users },
          { key: 'الأصناف', label: 'الأصناف', icon: Package },
          { key: 'التقارير', label: 'التقارير', icon: BarChart3 },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key as any)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                isActive
                  ? 'text-blue-700 dark:text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      {customerOpen && (
        <CustomerDialog
          list={customers}
          current={customer}
          currentPhone={phone}
          onSave={handleCustomerSaved}
          onClose={() => setCustomerOpen(false)}
        />
      )}

      {selectedCustomer && (
        <LedgerDialog
          customer={selectedCustomer}
          storeName={settings.storeName}
          onClose={() => setSelectedCustomer(null)}
          onUpdated={refreshData}
        />
      )}

      {settingsOpen && (
        <SettingsDialog
          settings={settings}
          onSave={handleSaveSettings}
          onOpenPrinter={() => {
            setSettingsOpen(false);
            setPrinterOpen(true);
          }}
          onDatabaseReloaded={refreshData}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {printerOpen && (
        <PrinterDialog
          storeName={settings.storeName}
          onClose={() => setPrinterOpen(false)}
        />
      )}

      {modalPreview && (
        <ReceiptPreviewModal
          invoiceNo={modalPreview.invoiceNo}
          storeName={settings.storeName}
          customer={modalPreview.customer}
          phone={modalPreview.phone}
          payment={modalPreview.payment}
          lines={modalPreview.lines || []}
          total={modalPreview.total}
          dateStr={modalPreview.dateStr}
          timeStr={modalPreview.timeStr}
          operationType={modalPreview.operationType || 'فاتورة مبيعات'}
          prevBalance={modalPreview.prevBalance || 0}
          newBalance={modalPreview.newBalance || 0}
          onClose={() => setModalPreview(null)}
        />
      )}
    </div>
  );
};

export default App;
