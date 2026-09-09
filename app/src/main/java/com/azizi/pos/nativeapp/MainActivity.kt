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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

private val PrimaryBlue = Color(0xFF1565C0)
private fun money(v: Double) = if (v % 1.0 == 0.0) v.toInt().toString() else String.format(Locale.US, "%.2f", v)
private fun today() = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
private fun now() = SimpleDateFormat("HH:mm", Locale.US).format(Date())

class MainActivity : ComponentActivity() {
    override fun onCreate(state: Bundle?) { super.onCreate(state); setContent { AziziApp() } }
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
    var settingsOpen by remember { mutableStateOf(false) }
    var customerOpen by remember { mutableStateOf(false) }
    var selectedCustomer by remember { mutableStateOf<CustomerRow?>(null) }
    var printerOpen by remember { mutableStateOf(false) }
    var printers by remember { mutableStateOf(emptyList<BluetoothDevice>()) }

    fun refresh() { scope.launch(Dispatchers.IO) { val i=db.invoices(); val c=db.customers(); val p=db.items(); withContext(Dispatchers.Main){invoices=i;customers=c;inventory=p} } }
    LaunchedEffect(Unit) { refresh() }
    LaunchedEffect(printerOpen) { if(printerOpen) printers=withContext(Dispatchers.IO){NativeServices.pairedPrinters(act)} }

    fun saveInvoice() {
        if(lines.isEmpty()){Toast.makeText(ctx,"أضف صنفاً أولاً",Toast.LENGTH_SHORT).show();return}
        scope.launch(Dispatchers.IO){db.addInvoice(no,customer,phone,lines.sumOf{it.total},payment,today(),now(),lines);withContext(Dispatchers.Main){Toast.makeText(ctx,"تم حفظ الفاتورة رقم $no",Toast.LENGTH_SHORT).show();no=db.nextInvoice();lines=emptyList();customer="عميل نقدي";phone="";payment="نقدي";name="";qty="1";totalInput="";refresh()}}
    }

    MaterialTheme(colorScheme=if(dark)darkColorScheme() else lightColorScheme(primary=PrimaryBlue)) {
        CompositionLocalProvider(androidx.compose.ui.platform.LocalLayoutDirection provides LayoutDirection.Rtl) {
            Scaffold(
                topBar={TopAppBar(title={Column{Text(storeName,fontWeight=FontWeight.Bold,fontSize=17.sp);Text("نقطة بيع ومحاسبة",fontSize=10.sp)}},actions={IconButton({tab="التقارير"}){Icon(Icons.Default.Assessment,"التقارير")};IconButton({settingsOpen=true}){Icon(Icons.Default.Settings,"الإعدادات")}})},
                bottomBar={NavigationBar{listOf("الفاتورة" to Icons.Default.ReceiptLong,"الفواتير" to Icons.Default.History,"العملاء" to Icons.Default.People,"الأصناف" to Icons.Default.Inventory,"التقارير" to Icons.Default.Assessment).forEach{(t,icon)->NavigationBarItem(tab==t,{tab=t},icon={Icon(icon,t)},label={Text(t,fontSize=9.sp)})}}}
            ){pad->Box(Modifier.padding(pad).fillMaxSize()){
                when(tab){
                    "الفاتورة"->InvoiceScreen(no,customer,phone,payment,name,qty,totalInput,lines,inventory,{customer=it},{phone=it},{payment=it},{name=it},{qty=it},{totalInput=it},{lines=it},{saveInvoice()},{customerOpen=true},{printerOpen=true}){val b=NativeServices.receiptBitmap(no,storeName,customer,lines,lines.sumOf{it.total},payment);val u=NativeServices.saveFile(act,b.pngBytes(),"فاتورة_${no}_58mm.png","image/png");NativeServices.share(act,u,"image/png","فاتورة رقم $no - $customer")}
                    "الفواتير"->HistoryScreen(invoices,{v->val text="فاتورة رقم ${v.number}\nالعميل: ${v.customer}\nالهاتف: ${v.phone}\n${v.date} ${v.time}\nالإجمالي: ${money(v.total)} ر.ي\nالدفع: ${v.payment}";val u=NativeServices.pdf(act,"فاتورة_${v.number}",text);NativeServices.share(act,u,"application/pdf",text)},{val rows=listOf(listOf("رقم","العميل","الهاتف","الإجمالي","الدفع","التاريخ"))+invoices.map{listOf(it.number.toString(),it.customer,it.phone,it.total.toString(),it.payment,"${it.date} ${it.time}")};val u=NativeServices.xlsx(act,"سجل_الفواتير",rows);NativeServices.share(act,u,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
                    "العملاء"->CustomersScreen(customers,{selectedCustomer=it},{customerOpen=true})
                    "الأصناف"->InventoryScreen(inventory,db){refresh()}
                    "التقارير"->ReportsScreen(invoices,customers,inventory,storeName)
                }
                if(customerOpen)CustomerDialog(customers,customer,phone,{n,p->customer=n;phone=p;customerOpen=false;refresh()},{customerOpen=false})
                selectedCustomer?.let{LedgerDialog(db,it){selectedCustomer=null;refresh()}}
                if(settingsOpen)SettingsDialog(storeName,storePhone,dark,{n,p,d->storeName=n.ifBlank{"بقالة العزي للمواد الغذائية"};storePhone=p;dark=d;prefs.edit().putString("storeName",storeName).putString("storePhone",p).putBoolean("dark",d).apply();settingsOpen=false},{settingsOpen=false;printerOpen=true}){settingsOpen=false}
                if(printerOpen)PrinterDialog(printers,{printerOpen=false}){device->printerOpen=false;if(lines.isEmpty())Toast.makeText(ctx,"لا توجد أصناف للطباعة",Toast.LENGTH_SHORT).show()else{val b=NativeServices.receiptBitmap(no,storeName,customer,lines,lines.sumOf{it.total},payment);NativeServices.printBluetooth(act,device,b){r->act.runOnUiThread{Toast.makeText(ctx,if(r=="ok")"تمت الطباعة بنجاح" else "فشل الطباعة: $r",Toast.LENGTH_LONG).show()}}}}
            }}
        }
    }
}

private fun android.graphics.Bitmap.pngBytes():ByteArray{val o=java.io.ByteArrayOutputStream();compress(android.graphics.Bitmap.CompressFormat.PNG,100,o);return o.toByteArray()}

@Composable private fun InvoiceScreen(no:Int,customer:String,phone:String,payment:String,name:String,qty:String,totalInput:String,rows:List<SaleLine>,inventory:List<ItemRow>,setCustomer:(String)->Unit,setPhone:(String)->Unit,setPayment:(String)->Unit,setName:(String)->Unit,setQty:(String)->Unit,setTotal:(String)->Unit,setRows:(List<SaleLine>)->Unit,save:()->Unit,customer:()->Unit,print:()->Unit,share:()->Unit){
    val grand=rows.sumOf{it.total};val shape=RoundedCornerShape(16.dp)
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(9.dp)){
        Row(horizontalArrangement=Arrangement.spacedBy(5.dp),modifier=Modifier.fillMaxWidth()){StatCard("الإجمالي",money(grand),Modifier.weight(1f));StatCard("الأصناف",rows.size.toString(),Modifier.weight(1f));StatCard("رقم",no.toString(),Modifier.weight(1f))}
        Card(Modifier.fillMaxWidth().padding(vertical=6.dp)){Column(Modifier.padding(10.dp)){SectionTitle(Icons.Default.Person,"العميل");Row(verticalAlignment=Alignment.CenterVertically){OutlinedTextField(customer,setCustomer,label={Text("اسم العميل")},modifier=Modifier.weight(1f),shape=shape,singleLine=true);IconButton(customer){Icon(Icons.Default.PersonAdd,"عميل جديد")}};OutlinedTextField(phone,setPhone,label={Text("الهاتف / واتساب")},modifier=Modifier.fillMaxWidth(),shape=shape,keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Phone),singleLine=true);Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){FilterChip(payment=="نقدي",{setPayment("نقدي")},label={Text("نقدي")});FilterChip(payment=="آجل",{setPayment("آجل")},label={Text("آجل")})}}}
        Card(Modifier.fillMaxWidth()){Column(Modifier.padding(10.dp)){SectionTitle(Icons.Default.AddShoppingCart,"إضافة صنف بسرعة");if(inventory.isNotEmpty()){Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(5.dp)){inventory.take(8).forEach{item->AssistChip(onClick={setName(item.name);setTotal(money(item.price*(qty.toDoubleOrNull()?:1.0)))},label={Text(item.name,maxLines=1)},leadingIcon={Icon(Icons.Default.Inventory2,null)})}};Spacer(Modifier.height(6.dp))};Row(horizontalArrangement=Arrangement.spacedBy(5.dp),verticalAlignment=Alignment.CenterVertically){OutlinedTextField(totalInput,setTotal,label={Text("الإجمالي")},modifier=Modifier.weight(1f),shape=shape,keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Decimal),singleLine=true);OutlinedTextField(qty,setQty,label={Text("الكمية")},modifier=Modifier.weight(.72f),shape=shape,keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Decimal),singleLine=true);OutlinedTextField(name,setName,label={Text("التفاصيل")},modifier=Modifier.weight(1.65f),shape=shape,singleLine=true);FilledIconButton(onClick={val total=totalInput.toDoubleOrNull()?:0.0;val q=qty.toDoubleOrNull()?:0.0;if(name.isNotBlank()&&q>0&&total>0){setRows(rows+SaleLine(name.trim(),q,total/q));setName("");setTotal("");setQty("1")}}){Icon(Icons.Default.Add,"إضافة")}};if(rows.isEmpty())Text("اختر صنفاً أو اكتب اسمه ثم أضفه",color=Color.Gray,fontSize=12.sp,modifier=Modifier.padding(7.dp));rows.forEachIndexed{i,line->Card(Modifier.fillMaxWidth().padding(vertical=2.dp)){Row(Modifier.padding(5.dp),verticalAlignment=Alignment.CenterVertically){Text(money(line.total),Modifier.weight(1f),fontWeight=FontWeight.Bold,textAlign=TextAlign.Center);Text(money(line.qty),Modifier.weight(.72f),textAlign=TextAlign.Center);Text(line.name,Modifier.weight(1.65f),fontWeight=FontWeight.Medium);IconButton({setRows(rows.filterIndexed{j,_->j!=i})}){Icon(Icons.Default.Delete,"حذف")}}}}}}
        Card(Modifier.fillMaxWidth().padding(vertical=6.dp)){Row(Modifier.padding(12.dp),verticalAlignment=Alignment.CenterVertically){Icon(Icons.Default.Payments,null);Spacer(Modifier.width(8.dp));Column(Modifier.weight(1f)){Text("الإجمالي النهائي",fontWeight=FontWeight.Bold);Text("${money(grand)} ر.ي",fontWeight=FontWeight.Bold,fontSize=25.sp,color=PrimaryBlue)}}}
        Row(horizontalArrangement=Arrangement.spacedBy(5.dp),modifier=Modifier.fillMaxWidth()){Button(save,Modifier.weight(1f)){Icon(Icons.Default.Save,null);Spacer(Modifier.width(4.dp));Text("حفظ")};OutlinedButton(print,Modifier.weight(1f)){Icon(Icons.Default.Bluetooth,null);Spacer(Modifier.width(4.dp));Text("طباعة")};OutlinedButton(share){Icon(Icons.Default.Share,null)}}
    }
}

@Composable private fun StatCard(a:String,b:String,m:Modifier)=Card(m){Column(Modifier.padding(7.dp).fillMaxWidth(),horizontalAlignment=Alignment.CenterHorizontally){Text(a,fontSize=10.sp);Text(b,fontSize=17.sp,fontWeight=FontWeight.Bold)}}
@Composable private fun SectionTitle(icon:androidx.compose.ui.graphics.vector.ImageVector,title:String){Row(verticalAlignment=Alignment.CenterVertically){Icon(icon,null);Spacer(Modifier.width(5.dp));Text(title,fontWeight=FontWeight.Bold)}}

@Composable private fun HistoryScreen(list:List<InvoiceRow>,open:(InvoiceRow)->Unit,excel:()->Unit){Column(Modifier.fillMaxSize().padding(10.dp)){Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Text("سجل الفواتير",fontSize=21.sp,fontWeight=FontWeight.Bold);IconButton(excel){Icon(Icons.Default.TableView,"Excel")}};LazyColumn{items(list){v->Card(Modifier.fillMaxWidth().padding(3.dp).clickable{open(v)}){Row(Modifier.padding(11.dp)){Column(Modifier.weight(1f)){Text("فاتورة #${v.number}",fontWeight=FontWeight.Bold);Text(v.customer);Text("${v.date} ${v.time}",fontSize=11.sp)};Column(horizontalAlignment=Alignment.End){Text("${money(v.total)} ر.ي",fontWeight=FontWeight.Bold);Text(v.payment,fontSize=11.sp)}}}}}}}

@Composable private fun CustomersScreen(list:List<CustomerRow>,open:(CustomerRow)->Unit,new:()->Unit){Column(Modifier.fillMaxSize().padding(10.dp)){Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Text("العملاء والحسابات",fontSize=21.sp,fontWeight=FontWeight.Bold);FilledIconButton(new){Icon(Icons.Default.PersonAdd,"إضافة")}};LazyColumn{items(list){c->Card(Modifier.fillMaxWidth().padding(3.dp).clickable{open(c)}){Row(Modifier.padding(11.dp)){Column(Modifier.weight(1f)){Text(c.name,fontWeight=FontWeight.Bold);Text(c.phone.ifBlank{"بدون هاتف"},fontSize=11.sp)};Text("${money(c.balance)} ر.ي",fontWeight=FontWeight.Bold,color=if(c.balance>0)Color(0xFFC62828) else Color(0xFF2E7D32))}}}}}}

@Composable private fun InventoryScreen(list:List<ItemRow>,db:AppDatabase,refresh:()->Unit){val scope=rememberCoroutineScope();var selected by remember{mutableStateOf<ItemRow?>(null)};Column(Modifier.fillMaxSize().padding(10.dp)){Text("الأصناف والمخزون",fontSize=21.sp,fontWeight=FontWeight.Bold);Text("اضغط على الصنف لتعديل الكمية",fontSize=11.sp,color=Color.Gray);LazyColumn{items(list){x->Card(Modifier.fillMaxWidth().padding(3.dp).clickable{selected=x}){Row(Modifier.padding(11.dp),verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text(x.name,fontWeight=FontWeight.Bold);Text("سعر البيع: ${money(x.price)} ر.ي",fontSize=11.sp)};Column(horizontalAlignment=Alignment.End){Text("المخزون: ${money(x.stock)}",fontWeight=FontWeight.Bold,color=if(x.minStock>0&&x.stock<=x.minStock)Color(0xFFC62828) else Color(0xFF2E7D32));Text("الحد الأدنى: ${money(x.minStock)}",fontSize=10.sp)}}}}}};selected?.let{x->StockDialog(x,{amount->scope.launch(Dispatchers.IO){db.adjustStock(x.id,amount);withContext(Dispatchers.Main){selected=null;refresh()}}},{selected=null})}}

@Composable private fun ReportsScreen(invoices:List<InvoiceRow>,customers:List<CustomerRow>,inventory:List<ItemRow>,store:String){val sales=invoices.filter{it.date==today()}.sumOf{it.total};val due=customers.sumOf{it.balance};val low=inventory.count{it.minStock>0&&it.stock<=it.minStock};Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp)){Text("لوحة التقارير",fontSize=23.sp,fontWeight=FontWeight.Bold);Text(store,fontSize=12.sp,color=Color.Gray);Spacer(Modifier.height(10.dp));StatCard("مبيعات اليوم","${money(sales)} ر.ي",Modifier.fillMaxWidth());Spacer(Modifier.height(7.dp));StatCard("إجمالي الديون","${money(due)} ر.ي",Modifier.fillMaxWidth());Spacer(Modifier.height(7.dp));StatCard("أصناف تحتاج شراء",low.toString(),Modifier.fillMaxWidth());Spacer(Modifier.height(12.dp));Text("آخر الفواتير",fontWeight=FontWeight.Bold);invoices.take(8).forEach{v->ListItem(headlineContent={Text("#${v.number} — ${v.customer}")},supportingContent={Text("${v.date} ${v.time} • ${money(v.total)} ر.ي")})}}}

@Composable private fun CustomerDialog(list:List<CustomerRow>,current:String,phone:String,onSave:(String,String)->Unit,onClose:()->Unit){var n by remember(current){mutableStateOf(current.takeUnless{it=="عميل نقدي"}?:"")};var p by remember(phone){mutableStateOf(phone)};AlertDialog(onDismissRequest=onClose,title={Text("بيانات العميل")},text={Column{OutlinedTextField(n,{n=it},label={Text("الاسم")},singleLine=true);OutlinedTextField(p,{p=it},label={Text("الهاتف / واتساب")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Phone),singleLine=true);if(list.isNotEmpty())Text("العملاء المحفوظون",fontWeight=FontWeight.Bold);list.take(6).forEach{c->Text(c.name,Modifier.fillMaxWidth().clickable{n=c.name;p=c.phone}.padding(4.dp))}},confirmButton={Button({onSave(n.trim().ifBlank{"عميل نقدي"},p.trim())}){Text("حفظ")}},dismissButton={TextButton(onClose){Text("إلغاء")}})}

@Composable private fun LedgerDialog(db:AppDatabase,c:CustomerRow,onClose:()->Unit){val scope=rememberCoroutineScope();var tx by remember{mutableStateOf(listOf<Array<String>>())};var amount by remember{mutableStateOf("")};LaunchedEffect(c.id){withContext(Dispatchers.IO){tx=db.customerTransactions(c.id)}};AlertDialog(onDismissRequest=onClose,title={Text("حساب ${c.name}")},text={Column(Modifier.heightIn(max=440.dp)){Text("الرصيد: ${money(c.balance)} ر.ي",fontSize=20.sp,fontWeight=FontWeight.Bold);Row(verticalAlignment=Alignment.CenterVertically){OutlinedTextField(amount,{amount=it},label={Text("دفعة")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Decimal),modifier=Modifier.weight(1f),singleLine=true);IconButton({val a=amount.toDoubleOrNull()?:0.0;if(a>0)scope.launch(Dispatchers.IO){db.addPayment(c.id,a,"سداد حساب",today(),now());tx=db.customerTransactions(c.id);withContext(Dispatchers.Main){amount=""}}}){Icon(Icons.Default.Payment,"تسجيل دفعة")}};LazyColumn{items(tx){r->ListItem(headlineContent={Text("${r[0]} — ${money(r[1].toDoubleOrNull()?:0.0)} ر.ي")},supportingContent={Text("${r[2]} • ${r[3]} ${r[4]}")})}}}},confirmButton={TextButton(onClose){Text("إغلاق")}})}

@Composable private fun StockDialog(item:ItemRow,onAdjust:(Double)->Unit,onClose:()->Unit){var v by remember{mutableStateOf("")};AlertDialog(onDismissRequest=onClose,title={Text("تعديل مخزون: ${item.name}")},text={Column{Text("المخزون الحالي: ${money(item.stock)}");OutlinedTextField(v,{v=it},label={Text("الكمية المضافة / المسحوبة")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Decimal),singleLine=true);Text("اكتب + للزيادة أو - للنقص",fontSize=11.sp,color=Color.Gray)}},confirmButton={Button({v.toDoubleOrNull()?.let(onAdjust)}){Text("تطبيق")}},dismissButton={TextButton(onClose){Text("إلغاء")}})}

@Composable private fun SettingsDialog(name:String,phone:String,dark:Boolean,onSave:(String,String,Boolean)->Unit,onPrinter:()->Unit,onClose:()->Unit){var n by remember(name){mutableStateOf(name)};var p by remember(phone){mutableStateOf(phone)};var d by remember(dark){mutableStateOf(dark)};AlertDialog(onDismissRequest=onClose,title={Text("إعدادات التطبيق")},text={Column(verticalArrangement=Arrangement.spacedBy(8.dp)){OutlinedTextField(n,{n=it},label={Text("اسم المتجر")},singleLine=true);OutlinedTextField(p,{p=it},label={Text("هاتف المتجر")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Phone),singleLine=true);Row(verticalAlignment=Alignment.CenterVertically){Text("الوضع الداكن",Modifier.weight(1f));Switch(d,{d=it})};OutlinedButton(onPrinter,Modifier.fillMaxWidth()){Icon(Icons.Default.Bluetooth,null);Spacer(Modifier.width(6.dp));Text("إعداد الطابعة")};Text("الطباعة الحرارية: 58mm / Bluetooth",fontSize=11.sp,color=Color.Gray)},confirmButton={Button({onSave(n,p,d)}){Text("حفظ")}},dismissButton={TextButton(onClose){Text("إلغاء")}})}

@Composable private fun PrinterDialog(list:List<BluetoothDevice>,close:()->Unit,onSelect:(BluetoothDevice)->Unit){AlertDialog(onDismissRequest=close,title={Text("طابعة Bluetooth")},text={Column{if(list.isEmpty())Text("لا توجد طابعات مقترنة. فعّل Bluetooth ثم اقترن بالطابعة من إعدادات الهاتف.");list.forEach{d->ListItem(headlineContent={Text(d.name?:"طابعة حرارية")},supportingContent={Text(d.address)},modifier=Modifier.clickable{onSelect(d)})}}},confirmButton={TextButton(close){Text("إغلاق")}})}
