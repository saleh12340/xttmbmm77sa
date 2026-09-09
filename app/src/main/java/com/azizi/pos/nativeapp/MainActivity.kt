package com.azizi.pos.nativeapp

import android.app.Activity
import android.bluetooth.BluetoothDevice
import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val PrimaryBlue = Color(0xFF1565C0)
private fun money(v: Double) = if (v % 1.0 == 0.0) v.toInt().toString() else String.format(Locale.US, "%.2f", v)
private fun today() = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
private fun now() = SimpleDateFormat("HH:mm", Locale.US).format(Date())

class MainActivity : ComponentActivity() {
    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        setContent { AziziApp() }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AziziApp() {
    val ctx = LocalContext.current
    val act = ctx as Activity
    val db = remember { AppDatabase.get(ctx) }
    val scope = rememberCoroutineScope()
    val prefs = remember { ctx.getSharedPreferences("azizi_settings", Context.MODE_PRIVATE) }
    var tab by remember { mutableStateOf("الفاتورة") }
    var dark by remember { mutableStateOf(prefs.getBoolean("dark", false)) }
    var storeName by remember { mutableStateOf(prefs.getString("storeName", "بقالة العزي للمواد الغذائية") ?: "بقالة العزي للمواد الغذائية") }
    var storePhone by remember { mutableStateOf(prefs.getString("storePhone", "") ?: "") }
    var invoiceNo by remember { mutableIntStateOf(db.nextInvoice()) }
    var customer by remember { mutableStateOf("عميل نقدي") }
    var phone by remember { mutableStateOf("") }
    var payment by remember { mutableStateOf("نقدي") }
    var itemName by remember { mutableStateOf("") }
    var qty by remember { mutableStateOf("1") }
    var totalInput by remember { mutableStateOf("") }
    var lines by remember { mutableStateOf(emptyList<SaleLine>()) }
    var invoices by remember { mutableStateOf(emptyList<InvoiceRow>()) }
    var customers by remember { mutableStateOf(emptyList<CustomerRow>()) }
    var inventory by remember { mutableStateOf(emptyList<ItemRow>()) }
    var settingsOpen by remember { mutableStateOf(false) }
    var customerOpen by remember { mutableStateOf(false) }
    var selectedCustomer by remember { mutableStateOf<CustomerRow?>(null) }
    var printerOpen by remember { mutableStateOf(false) }
    var printers by remember { mutableStateOf(emptyList<BluetoothDevice>()) }

    fun refresh() {
        scope.launch(Dispatchers.IO) {
            val i = db.invoices()
            val c = db.customers()
            val p = db.items()
            withContext(Dispatchers.Main) { invoices = i; customers = c; inventory = p }
        }
    }
    LaunchedEffect(Unit) { refresh() }
    LaunchedEffect(printerOpen) { if (printerOpen) printers = withContext(Dispatchers.IO) { NativeServices.pairedPrinters(act) } }

    fun saveInvoice() {
        if (lines.isEmpty()) { Toast.makeText(ctx, "أضف صنفاً أولاً", Toast.LENGTH_SHORT).show(); return }
        val number = invoiceNo
        val total = lines.sumOf { it.total }
        scope.launch(Dispatchers.IO) {
            db.addInvoice(number, customer, phone, total, payment, today(), now(), lines)
            withContext(Dispatchers.Main) {
                Toast.makeText(ctx, "تم حفظ الفاتورة رقم $number", Toast.LENGTH_SHORT).show()
                invoiceNo = db.nextInvoice(); lines = emptyList(); customer = "عميل نقدي"; phone = ""; payment = "نقدي"; itemName = ""; qty = "1"; totalInput = ""; refresh()
            }
        }
    }

    MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme(primary = PrimaryBlue)) {
        CompositionLocalProvider(androidx.compose.ui.platform.LocalLayoutDirection provides LayoutDirection.Rtl) {
            Scaffold(
                topBar = { TopAppBar(title = { Column { Text(storeName, fontWeight = FontWeight.Bold, fontSize = 17.sp); Text("نقطة بيع ومحاسبة", fontSize = 10.sp) } }, actions = { IconButton(onClick = { tab = "التقارير" }) { Icon(Icons.Default.Assessment, "التقارير") }; IconButton(onClick = { settingsOpen = true }) { Icon(Icons.Default.Settings, "الإعدادات") } }) },
                bottomBar = { NavigationBar { listOf("الفاتورة" to Icons.Default.ReceiptLong, "الفواتير" to Icons.Default.History, "العملاء" to Icons.Default.People, "الأصناف" to Icons.Default.Inventory, "التقارير" to Icons.Default.Assessment).forEach { (title, icon) -> NavigationBarItem(selected = tab == title, onClick = { tab = title }, icon = { Icon(icon, title) }, label = { Text(title, fontSize = 9.sp) }) } } }
            ) { padding ->
                Box(Modifier.padding(padding).fillMaxSize()) {
                    when (tab) {
                        "الفاتورة" -> InvoiceScreen(invoiceNo, customer, phone, payment, itemName, qty, totalInput, lines, inventory, { customer = it }, { phone = it }, { payment = it }, { itemName = it }, { qty = it }, { totalInput = it }, { lines = it }, ::saveInvoice, { customerOpen = true }, { printerOpen = true }) {
                            val bitmap = NativeServices.receiptBitmap(invoiceNo, storeName, customer, lines, lines.sumOf { it.total }, payment)
                            val uri = NativeServices.saveFile(act, bitmap.pngBytes(), "فاتورة_${invoiceNo}_58mm.png", "image/png")
                            NativeServices.share(act, uri, "image/png", "فاتورة رقم $invoiceNo - $customer")
                        }
                        "الفواتير" -> HistoryScreen(invoices, { v -> val text = "فاتورة رقم ${v.number}\nالعميل: ${v.customer}\nالهاتف: ${v.phone}\n${v.date} ${v.time}\nالإجمالي: ${money(v.total)} ر.ي\nالدفع: ${v.payment}"; val uri = NativeServices.pdf(act, "فاتورة_${v.number}", text); NativeServices.share(act, uri, "application/pdf", text) }) {
                            val rows = listOf(listOf("رقم", "العميل", "الهاتف", "الإجمالي", "الدفع", "التاريخ")) + invoices.map { listOf(it.number.toString(), it.customer, it.phone, it.total.toString(), it.payment, "${it.date} ${it.time}") }
                            val uri = NativeServices.xlsx(act, "سجل_الفواتير", rows); NativeServices.share(act, uri, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        }
                        "العملاء" -> CustomersScreen(customers, { selectedCustomer = it }, { customerOpen = true })
                        "الأصناف" -> InventoryScreen(inventory, db, ::refresh)
                        "التقارير" -> ReportsScreen(invoices, customers, inventory, storeName)
                    }
                    if (customerOpen) CustomerDialog(customers, customer, phone, { n, p -> customer = n; phone = p; customerOpen = false; refresh() }, { customerOpen = false })
                    selectedCustomer?.let { c -> LedgerDialog(db, c) { selectedCustomer = null; refresh() } }
                    if (settingsOpen) SettingsDialog(storeName, storePhone, dark, { n, p, d -> storeName = n.ifBlank { "بقالة العزي للمواد الغذائية" }; storePhone = p; dark = d; prefs.edit().putString("storeName", storeName).putString("storePhone", p).putBoolean("dark", d).apply(); settingsOpen = false }, { settingsOpen = false; printerOpen = true }, { settingsOpen = false })
                    if (printerOpen) PrinterDialog(printers, { printerOpen = false }) { device ->
                        printerOpen = false
                        if (lines.isEmpty()) Toast.makeText(ctx, "لا توجد أصناف للطباعة", Toast.LENGTH_SHORT).show() else {
                            val bitmap = NativeServices.receiptBitmap(invoiceNo, storeName, customer, lines, lines.sumOf { it.total }, payment)
                            NativeServices.printBluetooth(act, device, bitmap) { result -> act.runOnUiThread { Toast.makeText(ctx, if (result == "ok") "تمت الطباعة بنجاح" else "فشل الطباعة: $result", Toast.LENGTH_LONG).show() } }
                        }
                    }
                }
            }
        }
    }
}

private fun android.graphics.Bitmap.pngBytes(): ByteArray { val out = java.io.ByteArrayOutputStream(); compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out); return out.toByteArray() }

@Composable
private fun InvoiceScreen(invoiceNo: Int, customer: String, phone: String, payment: String, itemName: String, qty: String, totalInput: String, rows: List<SaleLine>, inventory: List<ItemRow>, setCustomer: (String) -> Unit, setPhone: (String) -> Unit, setPayment: (String) -> Unit, setName: (String) -> Unit, setQty: (String) -> Unit, setTotal: (String) -> Unit, setRows: (List<SaleLine>) -> Unit, save: () -> Unit, chooseCustomer: () -> Unit, print: () -> Unit, share: () -> Unit) {
    val grand = rows.sumOf { it.total }; val shape = RoundedCornerShape(16.dp)
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(9.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.fillMaxWidth()) { StatCard("الإجمالي", money(grand), Modifier.weight(1f)); StatCard("الأصناف", rows.size.toString(), Modifier.weight(1f)); StatCard("رقم", invoiceNo.toString(), Modifier.weight(1f)) }
        Card(Modifier.fillMaxWidth().padding(vertical = 6.dp)) { Column(Modifier.padding(10.dp)) { SectionTitle(Icons.Default.Person, "العميل"); Row(verticalAlignment = Alignment.CenterVertically) { OutlinedTextField(customer, setCustomer, label = { Text("اسم العميل") }, modifier = Modifier.weight(1f), shape = shape, singleLine = true); IconButton(onClick = chooseCustomer) { Icon(Icons.Default.PersonAdd, "اختيار العميل") } }; OutlinedTextField(phone, setPhone, label = { Text("الهاتف / واتساب") }, modifier = Modifier.fillMaxWidth(), shape = shape, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), singleLine = true); Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { FilterChip(selected = payment == "نقدي", onClick = { setPayment("نقدي") }, label = { Text("نقدي") }); FilterChip(selected = payment == "آجل", onClick = { setPayment("آجل") }, label = { Text("آجل") }) } } }
        Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(10.dp)) { SectionTitle(Icons.Default.AddShoppingCart, "إضافة صنف بسرعة"); if (inventory.isNotEmpty()) { Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(5.dp)) { inventory.take(8).forEach { item -> AssistChip(onClick = { setName(item.name); setTotal(money(item.price * (qty.toDoubleOrNull() ?: 1.0))) }, label = { Text(item.name, maxLines = 1) }, leadingIcon = { Icon(Icons.Default.Inventory2, null) }) } }; Spacer(Modifier.height(6.dp)) }; Row(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) { OutlinedTextField(totalInput, setTotal, label = { Text("الإجمالي") }, modifier = Modifier.weight(1f), shape = shape, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true); OutlinedTextField(qty, setQty, label = { Text("الكمية") }, modifier = Modifier.weight(.72f), shape = shape, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true); OutlinedTextField(itemName, setName, label = { Text("التفاصيل") }, modifier = Modifier.weight(1.65f), shape = shape, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text), singleLine = true); FilledIconButton(onClick = { val total = totalInput.toDoubleOrNull() ?: 0.0; val q = qty.toDoubleOrNull() ?: 0.0; if (itemName.isNotBlank() && q > 0 && total > 0) { setRows(rows + SaleLine(itemName.trim(), q, total / q)); setName(""); setTotal(""); setQty("1") } }) { Icon(Icons.Default.Add, "إضافة") } }; if (rows.isEmpty()) Text("اختر صنفاً أو اكتب اسمه ثم أضفه", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(7.dp)); rows.forEachIndexed { index, line -> Card(Modifier.fillMaxWidth().padding(vertical = 2.dp)) { Row(Modifier.padding(5.dp), verticalAlignment = Alignment.CenterVertically) { Text(money(line.total), Modifier.weight(1f), fontWeight = FontWeight.Bold, textAlign = TextAlign.Center); Text(money(line.qty), Modifier.weight(.72f), textAlign = TextAlign.Center); Text(line.name, Modifier.weight(1.65f), fontWeight = FontWeight.Medium); IconButton(onClick = { setRows(rows.filterIndexed { i, _ -> i != index }) }) { Icon(Icons.Default.Delete, "حذف") } } } } } }
        Card(Modifier.fillMaxWidth().padding(vertical = 6.dp)) { Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Payments, null); Spacer(Modifier.width(8.dp)); Column(Modifier.weight(1f)) { Text("الإجمالي النهائي", fontWeight = FontWeight.Bold); Text("${money(grand)} ر.ي", fontWeight = FontWeight.Bold, fontSize = 25.sp, color = PrimaryBlue) } } }
        Row(horizontalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.fillMaxWidth()) { Button(onClick = save, modifier = Modifier.weight(1f)) { Icon(Icons.Default.Save, null); Spacer(Modifier.width(4.dp)); Text("حفظ") }; OutlinedButton(onClick = print, modifier = Modifier.weight(1f)) { Icon(Icons.Default.Bluetooth, null); Spacer(Modifier.width(4.dp)); Text("طباعة") }; OutlinedButton(onClick = share) { Icon(Icons.Default.Share, null) } }
    }
}

@Composable private fun StatCard(title: String, value: String, modifier: Modifier) = Card(modifier) { Column(Modifier.padding(7.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) { Text(title, fontSize = 10.sp); Text(value, fontSize = 17.sp, fontWeight = FontWeight.Bold) } }
@Composable private fun SectionTitle(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(icon, null); Spacer(Modifier.width(5.dp)); Text(title, fontWeight = FontWeight.Bold) } }

@Composable private fun HistoryScreen(list: List<InvoiceRow>, open: (InvoiceRow) -> Unit, excel: () -> Unit) { Column(Modifier.fillMaxSize().padding(10.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Text("سجل الفواتير", fontSize = 21.sp, fontWeight = FontWeight.Bold); IconButton(onClick = excel) { Icon(Icons.Default.TableView, "Excel") } }; LazyColumn { items(list) { v -> Card(Modifier.fillMaxWidth().padding(3.dp).clickable { open(v) }) { Row(Modifier.padding(11.dp)) { Column(Modifier.weight(1f)) { Text("فاتورة #${v.number}", fontWeight = FontWeight.Bold); Text(v.customer); Text("${v.date} ${v.time}", fontSize = 11.sp) }; Column(horizontalAlignment = Alignment.End) { Text("${money(v.total)} ر.ي", fontWeight = FontWeight.Bold); Text(v.payment, fontSize = 11.sp) } } } } } } }

@Composable private fun CustomersScreen(list: List<CustomerRow>, open: (CustomerRow) -> Unit, new: () -> Unit) { Column(Modifier.fillMaxSize().padding(10.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Text("العملاء والحسابات", fontSize = 21.sp, fontWeight = FontWeight.Bold); FilledIconButton(onClick = new) { Icon(Icons.Default.PersonAdd, "اختيار العميل") } }; LazyColumn { items(list) { c -> Card(Modifier.fillMaxWidth().padding(3.dp).clickable { open(c) }) { Row(Modifier.padding(11.dp)) { Column(Modifier.weight(1f)) { Text(c.name, fontWeight = FontWeight.Bold); Text(c.phone.ifBlank { "بدون هاتف" }, fontSize = 11.sp) }; Text("${money(c.balance)} ر.ي", fontWeight = FontWeight.Bold, color = if (c.balance > 0) Color(0xFFC62828) else Color(0xFF2E7D32)) } } } } } }

@Composable private fun CustomerDialog(list: List<CustomerRow>, current: String, currentPhone: String, select: (String, String) -> Unit, close: () -> Unit) { var name by remember(current) { mutableStateOf(current) }; var phone by remember(currentPhone) { mutableStateOf(currentPhone) }; AlertDialog(onDismissRequest = close, title = { Text("اختيار العميل") }, text = { Column(Modifier.heightIn(max = 430.dp)) { OutlinedTextField(name, { name = it }, label = { Text("اسم العميل") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text), singleLine = true); OutlinedTextField(phone, { phone = it }, label = { Text("الهاتف / واتساب") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), singleLine = true); Spacer(Modifier.height(6.dp)); LazyColumn { items(list) { c -> ListItem(headlineContent = { Text(c.name) }, supportingContent = { Text(c.phone.ifBlank { "بدون هاتف" }) }, modifier = Modifier.clickable { name = c.name; phone = c.phone }) } } } }, confirmButton = { Button(onClick = { select(name.ifBlank { "عميل نقدي" }, phone) }) { Text("اختيار") } }, dismissButton = { TextButton(onClick = close) { Text("إلغاء") } }) }

@Composable private fun LedgerDialog(db: AppDatabase, customer: CustomerRow, close: () -> Unit) { val scope = rememberCoroutineScope(); var transactions by remember { mutableStateOf(emptyList<Array<String>>()) }; var amount by remember { mutableStateOf("") }; LaunchedEffect(customer.id) { transactions = withContext(Dispatchers.IO) { db.customerTransactions(customer.id) } }; AlertDialog(onDismissRequest = close, title = { Text("حساب ${customer.name}") }, text = { Column(Modifier.heightIn(max = 440.dp)) { Text("الرصيد: ${money(customer.balance)} ر.ي", fontSize = 20.sp, fontWeight = FontWeight.Bold); Row(verticalAlignment = Alignment.CenterVertically) { OutlinedTextField(amount, { amount = it }, label = { Text("دفعة") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.weight(1f), singleLine = true); IconButton(onClick = { val value = amount.toDoubleOrNull() ?: 0.0; if (value > 0) scope.launch(Dispatchers.IO) { db.addPayment(customer.id, value, "سداد حساب", today(), now()); val updated = db.customerTransactions(customer.id); withContext(Dispatchers.Main) { transactions = updated; amount = "" } } }) { Icon(Icons.Default.Payment, "تسجيل دفعة") } }; LazyColumn { items(transactions) { row -> ListItem(headlineContent = { Text("${row[0]} — ${money(row[1].toDoubleOrNull() ?: 0.0)} ر.ي") }, supportingContent = { Text("${row[2]} • ${row[3]} ${row[4]}") }) } } } }, confirmButton = { TextButton(onClick = close) { Text("إغلاق") } }) }

@Composable private fun InventoryScreen(list: List<ItemRow>, db: AppDatabase, refresh: () -> Unit) { val scope = rememberCoroutineScope(); var selected by remember { mutableStateOf<ItemRow?>(null) }; Column(Modifier.fillMaxSize().padding(10.dp)) { Text("الأصناف والمخزون", fontSize = 21.sp, fontWeight = FontWeight.Bold); Text("${list.size} صنف محفوظ", fontSize = 12.sp, color = Color.Gray); LazyColumn { items(list) { item -> Card(Modifier.fillMaxWidth().padding(vertical = 3.dp).clickable { selected = item }) { Row(Modifier.padding(11.dp), verticalAlignment = Alignment.CenterVertically) { Column(Modifier.weight(1f)) { Text(item.name, fontWeight = FontWeight.Bold); Text("سعر الوحدة: ${money(item.price)} ر.ي", fontSize = 11.sp) }; Column(horizontalAlignment = Alignment.End) { Text("المخزون ${money(item.stock)}", fontWeight = FontWeight.Bold); if (item.minStock > 0 && item.stock <= item.minStock) Text("مخزون منخفض", color = Color(0xFFC62828), fontSize = 11.sp) } } } } } }; selected?.let { item -> StockDialog(item, { delta -> scope.launch(Dispatchers.IO) { db.adjustStock(item.id, delta); withContext(Dispatchers.Main) { selected = null; refresh() } } }, { selected = null }) } }

@Composable private fun StockDialog(item: ItemRow, apply: (Double) -> Unit, close: () -> Unit) { var value by remember { mutableStateOf("") }; AlertDialog(onDismissRequest = close, title = { Text("تعديل مخزون: ${item.name}") }, text = { Column { Text("المخزون الحالي: ${money(item.stock)}"); OutlinedTextField(value, { value = it }, label = { Text("الكمية المضافة / المسحوبة") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true); Text("اكتب + للزيادة أو - للنقص", fontSize = 11.sp, color = Color.Gray) } }, confirmButton = { Button(onClick = { value.toDoubleOrNull()?.let(apply) }) { Text("تطبيق") } }, dismissButton = { TextButton(onClick = close) { Text("إلغاء") } }) }

@Composable private fun ReportsScreen(invoices: List<InvoiceRow>, customers: List<CustomerRow>, inventory: List<ItemRow>, store: String) { val todayTotal = invoices.filter { it.date == today() }.sumOf { it.total }; val debt = customers.sumOf { it.balance }; val low = inventory.count { it.minStock > 0 && it.stock <= it.minStock }; Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(10.dp)) { Text(store, fontSize = 20.sp, fontWeight = FontWeight.Bold); Text("لوحة التقارير", fontSize = 12.sp, color = Color.Gray); Spacer(Modifier.height(10.dp)); ReportCard("مبيعات اليوم", "${money(todayTotal)} ر.ي", Icons.Default.TrendingUp); ReportCard("إجمالي ديون العملاء", "${money(debt)} ر.ي", Icons.Default.AccountBalanceWallet); ReportCard("الأصناف منخفضة المخزون", low.toString(), Icons.Default.Warning); ReportCard("عدد الفواتير", invoices.size.toString(), Icons.Default.ReceiptLong) } }
@Composable private fun ReportCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector) { Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) { Row(Modifier.padding(15.dp), verticalAlignment = Alignment.CenterVertically) { Icon(icon, null); Spacer(Modifier.width(10.dp)); Column { Text(title, fontSize = 12.sp); Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold) } } } }

@Composable private fun SettingsDialog(name: String, phone: String, dark: Boolean, save: (String, String, Boolean) -> Unit, printer: () -> Unit, close: () -> Unit) { var store by remember(name) { mutableStateOf(name) }; var storePhone by remember(phone) { mutableStateOf(phone) }; var darkMode by remember(dark) { mutableStateOf(dark) }; AlertDialog(onDismissRequest = close, title = { Text("إعدادات التطبيق") }, text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedTextField(store, { store = it }, label = { Text("اسم المتجر") }, singleLine = true); OutlinedTextField(storePhone, { storePhone = it }, label = { Text("هاتف المتجر") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), singleLine = true); Row(verticalAlignment = Alignment.CenterVertically) { Text("الوضع الداكن", Modifier.weight(1f)); Switch(checked = darkMode, onCheckedChange = { darkMode = it }) }; OutlinedButton(onClick = printer, Modifier.fillMaxWidth()) { Icon(Icons.Default.Bluetooth, null); Spacer(Modifier.width(6.dp)); Text("إعداد الطابعة") }; Text("الطباعة الحرارية: 58mm / Bluetooth", fontSize = 11.sp, color = Color.Gray) } }, confirmButton = { Button(onClick = { save(store, storePhone, darkMode) }) { Text("حفظ") } }, dismissButton = { TextButton(onClick = close) { Text("إلغاء") } }) }

@Composable private fun PrinterDialog(list: List<BluetoothDevice>, close: () -> Unit, select: (BluetoothDevice) -> Unit) { AlertDialog(onDismissRequest = close, title = { Text("طابعة Bluetooth") }, text = { Column { if (list.isEmpty()) Text("لا توجد طابعات مقترنة. فعّل Bluetooth ثم اقترن بالطابعة من إعدادات الهاتف."); list.forEach { device -> ListItem(headlineContent = { Text(device.name ?: "طابعة حرارية") }, supportingContent = { Text(device.address) }, modifier = Modifier.clickable { select(device) }) } } }, confirmButton = { TextButton(onClick = close) { Text("إغلاق") } }) }
