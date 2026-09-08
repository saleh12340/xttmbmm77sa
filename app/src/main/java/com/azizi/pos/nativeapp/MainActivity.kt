package com.azizi.pos.nativeapp

import android.app.Activity
import android.bluetooth.BluetoothDevice
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

private val Blue = Color(0xFF1565C0)
private val Green = Color(0xFF2E7D32)
private val Red = Color(0xFFC62828)
private fun money(v: Double) = if (v % 1.0 == 0.0) v.toInt().toString() else String.format(Locale.US, "%.2f", v)
private fun android.graphics.Bitmap.png(): ByteArray { val o = java.io.ByteArrayOutputStream(); compress(android.graphics.Bitmap.CompressFormat.PNG, 100, o); return o.toByteArray() }

class MainActivity : ComponentActivity() {
    override fun onCreate(b: Bundle?) { super.onCreate(b); setContent { AziziApp() } }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AziziApp() {
    val ctx = LocalContext.current
    val act = ctx as Activity
    val db = remember { AppDatabase.get(ctx) }
    val scope = rememberCoroutineScope()
    var tab by remember { mutableStateOf("الفاتورة") }
    var no by remember { mutableIntStateOf(db.nextInvoice()) }
    var customer by remember { mutableStateOf("عميل نقدي") }
    var phone by remember { mutableStateOf("") }
    var payment by remember { mutableStateOf("نقدي") }
    var name by remember { mutableStateOf("") }
    var qty by remember { mutableStateOf("1") }
    var totalInput by remember { mutableStateOf("") }
    var lines by remember { mutableStateOf(emptyList<SaleLine>()) }
    var invoices by remember { mutableStateOf(emptyList<InvoiceRow>()) }
    var customers by remember { mutableStateOf(emptyList<CustomerRow>()) }
    var inventory by remember { mutableStateOf(emptyList<ItemRow>()) }
    var dark by remember { mutableStateOf(false) }
    var customerDialog by remember { mutableStateOf(false) }
    var settings by remember { mutableStateOf(false) }
    var printerDialog by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<CustomerRow?>(null) }
    var printers by remember { mutableStateOf(emptyList<BluetoothDevice>()) }

    fun refresh() {
        scope.launch(Dispatchers.IO) {
            val a = db.invoices(); val b = db.customers(); val c = db.items()
            withContext(Dispatchers.Main) { invoices = a; customers = b; inventory = c }
        }
    }
    LaunchedEffect(Unit) { refresh() }
    LaunchedEffect(printerDialog) { if (printerDialog) printers = withContext(Dispatchers.IO) { NativeServices.pairedPrinters(act) } }

    MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme(primary = Blue)) {
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { Column { Text("بقالة العزي للمواد الغذائية", fontWeight = FontWeight.Bold, fontSize = 18.sp); Text("نظام المبيعات والمحاسبة", fontSize = 11.sp) } },
                        actions = { IconButton(onClick = { tab = "التقارير" }) { Icon(Icons.Default.Assessment, "التقارير") }; IconButton(onClick = { settings = true }) { Icon(Icons.Default.Settings, "الإعدادات") } }
                    )
                },
                bottomBar = {
                    NavigationBar {
                        listOf("الفاتورة" to Icons.Default.ReceiptLong, "الفواتير" to Icons.Default.History, "العملاء" to Icons.Default.People, "الأصناف" to Icons.Default.Inventory, "التقارير" to Icons.Default.Assessment).forEach { (t, i) ->
                            NavigationBarItem(selected = tab == t, onClick = { tab = t }, icon = { Icon(i, t) }, label = { Text(t, fontSize = 10.sp) })
                        }
                    }
                }
            ) { pad ->
                Box(Modifier.padding(pad).fillMaxSize()) {
                    when (tab) {
                        "الفاتورة" -> InvoiceView(
                            no, customer, phone, payment, name, qty, totalInput, lines,
                            { customer = it }, { phone = it }, { payment = it }, { name = it }, { qty = it }, { totalInput = it }, { lines = it },
                            save = {
                                if (lines.isEmpty()) Toast.makeText(ctx, "أضف صنفاً أولاً", Toast.LENGTH_SHORT).show()
                                else scope.launch(Dispatchers.IO) {
                                    val d = Date()
                                    db.addInvoice(no, customer, phone, lines.sumOf { it.total }, payment, SimpleDateFormat("yyyy-MM-dd", Locale.US).format(d), SimpleDateFormat("HH:mm", Locale.US).format(d), lines)
                                    withContext(Dispatchers.Main) { Toast.makeText(ctx, "تم حفظ الفاتورة رقم $no", Toast.LENGTH_SHORT).show(); no = db.nextInvoice(); lines = emptyList(); customer = "عميل نقدي"; phone = ""; payment = "نقدي"; totalInput = ""; name = ""; qty = "1"; refresh() }
                                }
                            },
                            customer = { customerDialog = true }, print = { printerDialog = true },
                            share = { val b = NativeServices.receiptBitmap(no, "بقالة العزي للمواد الغذائية", customer, lines, lines.sumOf { it.total }, payment); val u = NativeServices.saveFile(act, b.png(), "فاتورة_${no}_58mm.png", "image/png"); NativeServices.share(act, u, "image/png", "فاتورة رقم $no - $customer") }
                        )
                        "الفواتير" -> HistoryView(invoices, { v -> val text = "فاتورة رقم ${v.number}\nالعميل: ${v.customer}\n${v.date} ${v.time}\nالإجمالي: ${money(v.total)} ر.ي\nالدفع: ${v.payment}"; val u = NativeServices.pdf(act, "فاتورة_${v.number}", text); NativeServices.share(act, u, "application/pdf", text) }, { val rows = listOf(listOf("رقم", "العميل", "الهاتف", "الإجمالي", "الدفع", "التاريخ")) + invoices.map { listOf(it.number.toString(), it.customer, it.phone, it.total.toString(), it.payment, it.date + " " + it.time) }; val u = NativeServices.xlsx(act, "سجل_الفواتير", rows); NativeServices.share(act, u, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") })
                        "العملاء" -> CustomersView(customers, { selected = it }, { customerDialog = true })
                        "الأصناف" -> InventoryView(inventory)
                        "التقارير" -> ReportsView(invoices, customers)
                    }
                    if (customerDialog) CustomerDialog(customers, customer, phone, { n, p -> customer = n; phone = p; customerDialog = false }, { customerDialog = false })
                    if (settings) SettingsDialog(dark, { dark = it }, { settings = false; printerDialog = true }, onClose = { settings = false })
                    if (printerDialog) PrinterDialog(printers, { printerDialog = false }) { d ->
                        printerDialog = false
                        if (lines.isNotEmpty()) {
                            val b = NativeServices.receiptBitmap(no, "بقالة العزي للمواد الغذائية", customer, lines, lines.sumOf { it.total }, payment)
                            NativeServices.printBluetooth(act, d, b) { m -> act.runOnUiThread { Toast.makeText(ctx, if (m == "ok") "تمت الطباعة" else "فشل الطباعة: $m", Toast.LENGTH_LONG).show() } }
                        } else Toast.makeText(ctx, "لا توجد أصناف للطباعة", Toast.LENGTH_SHORT).show()
                    }
                    selected?.let { LedgerDialog(db, it) { selected = null } }
                }
            }
        }
    }
}

@Composable
private fun InvoiceView(no: Int, c: String, ph: String, pay: String, n: String, q: String, totalInput: String, rows: List<SaleLine>, sc: (String) -> Unit, sph: (String) -> Unit, spay: (String) -> Unit, sn: (String) -> Unit, sq: (String) -> Unit, st: (String) -> Unit, srows: (List<SaleLine>) -> Unit, save: () -> Unit, customer: () -> Unit, print: () -> Unit, share: () -> Unit) {
    val grand = rows.sumOf { it.total }
    val fieldShape = RoundedCornerShape(18.dp)
    val fieldShape = RoundedCornerShape(18.dp)
    Column(Modifier.fillMaxSize().padding(10.dp).verticalScroll(rememberScrollState())) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Info("رقم", no.toString(), Modifier.weight(1f)); Info("الأصناف", rows.size.toString(), Modifier.weight(1f)); Info("الإجمالي", money(grand), Modifier.weight(1f))
        }
        Card(Modifier.fillMaxWidth().padding(vertical = 7.dp)) {
            Column(Modifier.padding(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Person, null); Spacer(Modifier.width(6.dp)); Text("بيانات العميل", fontWeight = FontWeight.Bold) }
                Row(verticalAlignment = Alignment.CenterVertically) { OutlinedTextField(c, sc, label = { Text("اسم العميل") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(18.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text), singleLine = true); IconButton(customer) { Icon(Icons.Default.PersonAdd, "عميل جديد") } }
                OutlinedTextField(ph, sph, label = { Text("رقم الهاتف / واتساب") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), singleLine = true)
                Row { FilterChip(pay == "نقدي", { spay("نقدي") }, { Text("نقدي") }); Spacer(Modifier.width(6.dp)); FilterChip(pay == "آجل", { spay("آجل") }, { Text("آجل") }) }
            }
        }
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.AddShoppingCart, null); Spacer(Modifier.width(6.dp)); Text("إضافة صنف", fontWeight = FontWeight.Bold) }
                Spacer(Modifier.height(7.dp))
                // RTL order: إجمالي القيمة (right) ← الكمية ← التفاصيل (left)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(totalInput, st, label = { Text("القيمة الإجمالية") }, modifier = Modifier.weight(1f), shape = fieldShape, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true)
                    OutlinedTextField(q, sq, label = { Text("الكمية") }, modifier = Modifier.weight(.72f), shape = fieldShape, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true)
                    OutlinedTextField(n, sn, label = { Text("التفاصيل") }, modifier = Modifier.weight(1.65f), shape = fieldShape, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text), singleLine = true)
                    FilledIconButton(onClick = {
                        val total = totalInput.toDoubleOrNull() ?: 0.0
                        val quantity = q.toDoubleOrNull() ?: 0.0
                        if (n.isNotBlank() && quantity > 0 && total > 0) srows(rows + SaleLine(n.trim(), quantity, total / quantity))
                    }) { Icon(Icons.Default.Add, "إضافة") }
                }
                Spacer(Modifier.height(8.dp))
                if (rows.isEmpty()) Text("لا توجد أصناف مضافة بعد", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(8.dp))
                rows.forEachIndexed { i, x ->
                    Card(Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                        // RTL order: total right, quantity middle, details left
                        Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(money(x.total), Modifier.weight(1f), fontWeight = FontWeight.Bold, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                            Text(money(x.qty), Modifier.weight(.72f), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                            Text(x.name, Modifier.weight(1.65f), fontWeight = FontWeight.Medium)
                            IconButton(onClick = { srows(rows.filterIndexed { j, _ -> i != j }) }) { Icon(Icons.Default.Delete, "حذف") }
                        }
                    }
                }
            }
        }
        Card(Modifier.fillMaxWidth().padding(vertical = 7.dp)) {
            Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Payments, null); Spacer(Modifier.width(8.dp)); Column(Modifier.weight(1f)) { Text("الإجمالي النهائي", fontWeight = FontWeight.Bold, fontSize = 18.sp); Text("${money(grand)} ر.ي", fontWeight = FontWeight.Bold, fontSize = 27.sp, color = Blue) }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.fillMaxWidth()) {
            Button(save, Modifier.weight(1f)) { Icon(Icons.Default.Save, null); Spacer(Modifier.width(4.dp)); Text("حفظ") }
            OutlinedButton(print, Modifier.weight(1f)) { Icon(Icons.Default.Bluetooth, null); Spacer(Modifier.width(4.dp)); Text("Bluetooth") }
            OutlinedButton(share) { Icon(Icons.Default.Share, null) }
        }
    }
}

@Composable private fun Info(a: String, b: String, m: Modifier) = Card(m) { Column(Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(a, fontSize = 10.sp); Text(b, fontWeight = FontWeight.Bold, fontSize = 17.sp) } }

@Composable private fun HistoryView(list: List<InvoiceRow>, open: (InvoiceRow) -> Unit, excel: () -> Unit) = Column(Modifier.fillMaxSize().padding(10.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("سجل الفواتير", fontWeight = FontWeight.Bold, fontSize = 22.sp); Button(excel) { Icon(Icons.Default.TableView, null); Text("Excel") } }; LazyColumn { items(list) { v -> Card(Modifier.fillMaxWidth().padding(4.dp).clickable { open(v) }) { Row(Modifier.padding(12.dp)) { Column(Modifier.weight(1f)) { Text("فاتورة #${v.number}", fontWeight = FontWeight.Bold); Text(v.customer); Text("${v.date} ${v.time}", fontSize = 11.sp) }; Column(horizontalAlignment = Alignment.End) { Text("${money(v.total)} ر.ي", fontWeight = FontWeight.Bold); Text(v.payment) } } } } } }

@Composable private fun CustomersView(list: List<CustomerRow>, open: (CustomerRow) -> Unit, new: () -> Unit) = Column(Modifier.fillMaxSize().padding(10.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.People, null); Spacer(Modifier.width(6.dp)); Text("حسابات العملاء", fontSize = 22.sp, fontWeight = FontWeight.Bold) }; Button(new) { Icon(Icons.Default.PersonAdd, null); Text("عميل جديد") } }; LazyColumn { items(list) { c -> Card(Modifier.fillMaxWidth().padding(4.dp).clickable { open(c) }) { Row(Modifier.padding(13.dp)) { Column(Modifier.weight(1f)) { Text(c.name, fontWeight = FontWeight.Bold); Text(c.phone.ifBlank { "بدون رقم" }, fontSize = 11.sp) }; Text("${money(c.balance)} ر.ي", color = if (c.balance > 0) Red else Green, fontWeight = FontWeight.Bold) } } } } }

@Composable private fun InventoryView(list: List<ItemRow>) = Column(Modifier.fillMaxSize().padding(10.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Inventory, null); Spacer(Modifier.width(6.dp)); Text("الأصناف والمخزون", fontSize = 22.sp, fontWeight = FontWeight.Bold) }; LazyColumn { items(list) { i -> Card(Modifier.fillMaxWidth().padding(4.dp)) { Row(Modifier.padding(12.dp)) { Column(Modifier.weight(1f)) { Text(i.name, fontWeight = FontWeight.Bold); Text("السعر: ${money(i.price)}") }; Text("المخزون: ${money(i.stock)}", color = if (i.stock <= i.minStock) Red else Green) } } } } }

@Composable private fun ReportsView(inv: List<InvoiceRow>, cus: List<CustomerRow>) { val total = inv.sumOf { it.total }; Column(Modifier.fillMaxSize().padding(12.dp).verticalScroll(rememberScrollState())) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Assessment, null); Spacer(Modifier.width(6.dp)); Text("التقارير", fontSize = 24.sp, fontWeight = FontWeight.Bold) }; Spacer(Modifier.height(10.dp)); Info("إجمالي المبيعات", "${money(total)} ر.ي", Modifier.fillMaxWidth()); Info("نقدي", "${money(inv.filter { it.payment == "نقدي" }.sumOf { it.total })} ر.ي", Modifier.fillMaxWidth().padding(top = 6.dp)); Info("آجل", "${money(inv.filter { it.payment != "نقدي" }.sumOf { it.total })} ر.ي", Modifier.fillMaxWidth().padding(top = 6.dp)); Info("أرصدة العملاء", "${money(cus.sumOf { it.balance })} ر.ي", Modifier.fillMaxWidth().padding(top = 6.dp)); Text("التقارير مبنية على قاعدة SQLite المحلية داخل التطبيق.", fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp)) } }

@Composable private fun CustomerDialog(list: List<CustomerRow>, initial: String, initialPhone: String, save: (String, String) -> Unit, cancel: () -> Unit) { var n by remember { mutableStateOf(if (initial == "عميل نقدي") "" else initial) }; var p by remember { mutableStateOf(initialPhone) }; AlertDialog(onDismissRequest = cancel, title = { Text("👤 حفظ عميل جديد") }, text = { Column { OutlinedTextField(n, { n = it }, label = { Text("اسم العميل") }, shape = RoundedCornerShape(18.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text), singleLine = true); OutlinedTextField(p, { p = it }, label = { Text("الهاتف / واتساب") }, shape = RoundedCornerShape(18.dp), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), singleLine = true); if (n.isNotBlank() && list.any { it.name.equals(n, true) }) Text("العميل مسجل مسبقاً وسيتم ربط الفاتورة به.", color = Blue, fontSize = 12.sp) } }, confirmButton = { Button({ if (n.isNotBlank()) save(n.trim(), p.trim()) }) { Text("حفظ") } }, dismissButton = { TextButton(cancel) { Text("إلغاء") } }) }

@Composable private fun SettingsDialog(dark: Boolean, setDark: (Boolean) -> Unit, printer: () -> Unit, onClose: () -> Unit) { AlertDialog(onDismissRequest = onClose, title = { Text("⚙️ إعدادات الكاشير") }, text = { Column { Row(verticalAlignment = Alignment.CenterVertically) { Text("الوضع الداكن", Modifier.weight(1f)); Switch(dark, setDark) }; Text("الطابعة الحرارية: Bluetooth فقط", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 10.dp)); Text("الإيصال الحراري: 58mm / 384px", fontSize = 12.sp); Button(printer, Modifier.fillMaxWidth().padding(top = 8.dp)) { Icon(Icons.Default.Bluetooth, null); Text("اختيار الطابعة") } } }, confirmButton = { TextButton(onClick = onClose) { Text("إغلاق") } }) }

@Composable private fun PrinterDialog(list: List<BluetoothDevice>, close: () -> Unit, choose: (BluetoothDevice) -> Unit) { AlertDialog(onDismissRequest = close, title = { Text("اختر الطابعة الحرارية الصغيرة") }, text = { Column { if (list.isEmpty()) Text("لا توجد طابعة مقترنة. قم بإقران الطابعة من إعدادات Bluetooth ثم افتح الاختيار مرة أخرى.") else list.forEach { d -> Text("${d.name ?: "طابعة حرارية"}\n${d.address}", Modifier.fillMaxWidth().clickable { choose(d) }.padding(12.dp)) } } }, confirmButton = { TextButton(close) { Text("إغلاق") } }) }

@Composable private fun LedgerDialog(db: AppDatabase, c: CustomerRow, close: () -> Unit) { val ctx = LocalContext.current; val act = ctx as Activity; val tx = remember(c.id) { db.customerTransactions(c.id) }; AlertDialog(onDismissRequest = close, title = { Text("كشف حساب: ${c.name}") }, text = { Column { Text("الرصيد الحالي: ${money(c.balance)} ر.ي", fontWeight = FontWeight.Bold, color = if (c.balance > 0) Red else Green); Text(c.phone); LazyColumn(Modifier.heightIn(max = 320.dp)) { items(tx) { t -> Row(Modifier.fillMaxWidth().padding(5.dp)) { Text(if (t[0] == "payment") "سداد" else "فاتورة", Modifier.weight(1f)); Text("${t[3]} ${t[4]}  ${money(t[1].toDoubleOrNull() ?: 0.0)}") } } }; Row { Button({ val text = "كشف حساب: ${c.name}\nالرصيد: ${money(c.balance)} ر.ي"; val u = NativeServices.pdf(act, "كشف_${c.name}", text); NativeServices.share(act, u, "application/pdf", text) }) { Text("PDF") }; Spacer(Modifier.width(5.dp)); Button({ val u = NativeServices.xlsx(act, "كشف_${c.name}", listOf(listOf("النوع", "المبلغ", "البيان", "التاريخ", "الوقت")) + tx.map { it.toList() }); NativeServices.share(act, u, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") }) { Text("Excel") } } } }, confirmButton = { TextButton(close) { Text("إغلاق") } }) }
