package com.azizi.pos.nativeapp

import android.Manifest
import android.app.Activity
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

private val Blue=Color(0xFF1565C0); private val Green=Color(0xFF2E7D32); private val Red=Color(0xFFC62828)

class MainActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);setContent{AziziApp()}}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun AziziApp(){
 val context=LocalContext.current; val activity=context as Activity; val db=remember{AppDatabase.get(context)}; val scope=rememberCoroutineScope()
 var tab by remember{mutableStateOf("الفاتورة")}; var invoiceNo by remember{mutableIntStateOf(db.nextInvoice())}; var customer by remember{mutableStateOf("عميل نقدي")}; var phone by remember{mutableStateOf("")}; var payment by remember{mutableStateOf("نقدي")}; var itemName by remember{mutableStateOf("")}; var qty by remember{mutableStateOf("1")}; var unit by remember{mutableStateOf("")}; var lines by remember{mutableStateOf(listOf<SaleLine>())}; var invoices by remember{mutableStateOf(emptyList<InvoiceRow>())}; var customers by remember{mutableStateOf(emptyList<CustomerRow>())}; var items by remember{mutableStateOf(emptyList<ItemRow>())}; var dark by remember{mutableStateOf(false)}; var showCustomer by remember{mutableStateOf(false)}; var selectedCustomer by remember{mutableStateOf<CustomerRow?>(null)}; var showPrinters by remember{mutableStateOf(false)}; var printers by remember{mutableStateOf(emptyList<android.bluetooth.BluetoothDevice>())}; var showSettings by remember{mutableStateOf(false)}
 fun refresh(){scope.launch(Dispatchers.IO){val i=db.invoices();val c=db.customers();val it=db.items();withContext(Dispatchers.Main){invoices=i;customers=c;items=it}}}
 LaunchedEffect(Unit){refresh()}
 MaterialTheme(colorScheme=if(dark)darkColorScheme() else lightColorScheme(primary=Blue)){CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl){
  Scaffold(topBar={TopAppBar(title={Column{Text("بقالة العزي للمواد الغذائية",fontSize=18.sp,fontWeight=FontWeight.Bold);Text("نظام المبيعات والمحاسبة",fontSize=11.sp)}} ,actions={IconButton(onClick={tab="التقارير"}){Icon(Icons.Default.Assessment,"التقارير")};IconButton(onClick={showSettings=true}){Icon(Icons.Default.Settings,"الإعدادات")}})},bottomBar={NavigationBar{listOf("الفاتورة" to Icons.Default.ReceiptLong,"الفواتير" to Icons.Default.History,"العملاء" to Icons.Default.People,"الأصناف" to Icons.Default.Inventory,"التقارير" to Icons.Default.Assessment).forEach{(t,ic)->NavigationBarItem(selected=tab==t,onClick={tab=t},icon={Icon(ic,null)},label={Text(t,fontSize=10.sp)})}}}){pad->Box(Modifier.padding(pad).fillMaxSize()){
   when(tab){
    "الفاتورة"->InvoiceScreen(invoiceNo,customer,phone,payment,itemName,qty,unit,lines,{customer=it},{phone=it},{payment=it},{itemName=it},{qty=it},{unit=it},{lines=it},onSave={
      if(lines.isEmpty()){Toast.makeText(context,"أضف صنفاً أولاً",Toast.LENGTH_SHORT).show();return@InvoiceScreen}; scope.launch(Dispatchers.IO){val now=Date();val date=SimpleDateFormat("yyyy-MM-dd",Locale.US).format(now);val time=SimpleDateFormat("HH:mm",Locale.US).format(now);db.addInvoice(invoiceNo,customer,phone,lines.sumOf{it.total},payment,date,time,lines);withContext(Dispatchers.Main){Toast.makeText(context,"تم حفظ الفاتورة رقم $invoiceNo",Toast.LENGTH_SHORT).show();invoiceNo=db.nextInvoice();lines=emptyList();customer="عميل نقدي";phone="";payment="نقدي";refresh()}}},onCustomer={showCustomer=true},onPrint={showPrinters=true},onShare={val b=NativeServices.receiptBitmap(invoiceNo,"بقالة العزي للمواد الغذائية",customer,lines,lines.sumOf{it.total},payment);val uri=NativeServices.saveFile(activity,b.toPng(),"فاتورة_${invoiceNo}_58mm.png","image/png");NativeServices.share(activity,uri,"image/png","فاتورة رقم $invoiceNo - $customer")})
    "الفواتير"->HistoryScreen(invoices,{inv->val body="فاتورة رقم ${inv.number}\nالعميل: ${inv.customer}\nالتاريخ: ${inv.date} ${inv.time}\nالإجمالي: ${inv.total} ر.ي\nالدفع: ${inv.payment}";val uri=NativeServices.pdf(activity,"فاتورة_${inv.number}",body);NativeServices.share(activity,uri,"application/pdf",body)},{val rows=listOf(listOf("رقم","العميل","الهاتف","الإجمالي","الدفع","التاريخ"))+invoices.map{listOf(it.number.toString(),it.customer,it.phone,it.total.toString(),it.payment,it.date+" "+it.time)};val uri=NativeServices.xlsx(activity,"سجل_الفواتير",rows);NativeServices.share(activity,uri,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    "العملاء"->CustomersScreen(customers,{selectedCustomer=it},{showCustomer=true})
    "الأصناف"->ItemsScreen(items)
    "التقارير"->ReportsScreen(invoices,customers)
   }
   if(showCustomer)CustomerDialog(customers,customer,phone,{n,p->{customer=n;phone=p;showCustomer=false}},{showCustomer=false})
   if(showSettings)SettingsDialog(dark,{dark=it;showSettings=false},{showPrinters=true;showSettings=false})
   if(showPrinters){PrinterDialog(printers,{showPrinters=false}){d->showPrinters=false;val b=NativeServices.receiptBitmap(invoiceNo,"بقالة العزي للمواد الغذائية",customer,lines,lines.sumOf{it.total},payment);NativeServices.printBluetooth(activity,d,b){msg->runOnUiThread{Toast.makeText(context,if(msg=="ok")"تمت الطباعة" else "تعذر الطباعة: $msg",Toast.LENGTH_LONG).show()}}}}
   if(selectedCustomer!=null){LedgerDialog(db,selectedCustomer!!,{selectedCustomer=null})}
  }}
 }}
}

@Composable fun InvoiceScreen(no:Int,customer:String,phone:String,payment:String,name:String,qty:String,unit:String,lines:List<SaleLine],setCustomer:(String)->Unit,setPhone:(String)->Unit,setPayment:(String)->Unit,setName:(String)->Unit,setQty:(String)->Unit,setUnit:(String)->Unit,setLines:(List<SaleLine>)->Unit,onSave:()->Unit,onCustomer:()->Unit,onPrint:()->Unit,onShare:()->Unit){
 Column(Modifier.fillMaxSize().padding(10.dp).verticalScroll(rememberScrollState())){
  Row(horizontalArrangement=Arrangement.spacedBy(8.dp),modifier=Modifier.fillMaxWidth()){StatCard("رقم الفاتورة",no.toString(),Modifier.weight(1f));StatCard("الأصناف",lines.size.toString(),Modifier.weight(1f));StatCard("الإجمالي",fmt(lines.sumOf{it.total}),Modifier.weight(1f))}
  Card(Modifier.fillMaxWidth().padding(vertical=7.dp),shape=RoundedCornerShape(14.dp)){Column(Modifier.padding(10.dp)){Text("بيانات العميل",fontWeight=FontWeight.Bold);Row(horizontalArrangement=Arrangement.spacedBy(7.dp),verticalAlignment=Alignment.CenterVertically){OutlinedTextField(customer,setCustomer,label={Text("اسم العميل")},modifier=Modifier.weight(1f));IconButton(onClick=onCustomer){Icon(Icons.Default.PersonAdd,"عميل")}};OutlinedTextField(phone,setPhone,label={Text("رقم الهاتف / واتساب")},modifier=Modifier.fillMaxWidth());Row{FilterChip(selected=payment=="نقدي",onClick={setPayment("نقدي")},label={Text("نقدي")});Spacer(Modifier.width(6.dp));FilterChip(selected=payment=="آجل",onClick={setPayment("آجل")},label={Text("آجل")})}}}
  Card(Modifier.fillMaxWidth(),shape=RoundedCornerShape(14.dp)){Column(Modifier.padding(10.dp)){Text("إدخال الأصناف",fontWeight=FontWeight.Bold);Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){OutlinedTextField(name,setName,label={Text("الصنف")},modifier=Modifier.weight(1.6f));OutlinedTextField(qty,setQty,label={Text("الكمية")},modifier=Modifier.weight(.7f));OutlinedTextField(unit,setUnit,label={Text("السعر")},modifier=Modifier.weight(.9f));Button(onClick={val q=qty.toDoubleOrNull()?:0.0;val u=unit.toDoubleOrNull()?:0.0;if(name.isNotBlank()&&q>0){setLines(lines+SaleLine(name.trim(),q,u));setName("");setQty("1");setUnit("")}}){Text("إضافة")}};lines.forEachIndexed{i,l->Row(Modifier.fillMaxWidth().padding(top=8.dp),verticalAlignment=Alignment.CenterVertically){Text(l.name,Modifier.weight(1.5f));Text(fmt(l.qty),Modifier.weight(.6f));Text(fmt(l.unit),Modifier.weight(.8f));Text(fmt(l.total),Modifier.weight(.9f));IconButton(onClick={setLines(lines.filterIndexed{idx,_->idx!=i})}){Icon(Icons.Default.Delete,"حذف")}}}}
  }
  Card(Modifier.fillMaxWidth().padding(vertical=8.dp)){Column(Modifier.padding(12.dp)){Text("الإجمالي النهائي",fontSize=22.sp,fontWeight=FontWeight.Bold);Text("${fmt(lines.sumOf{it.total})} ر.ي",fontSize=28.sp,fontWeight=FontWeight.Bold,color=Blue)}}
  Row(horizontalArrangement=Arrangement.spacedBy(7.dp),modifier=Modifier.fillMaxWidth()){Button(onClick=onSave,modifier=Modifier.weight(1f)){Icon(Icons.Default.Save,null);Spacer(Modifier.width(5.dp));Text("حفظ الفاتورة")};OutlinedButton(onClick=onPrint,modifier=Modifier.weight(1f)){Icon(Icons.Default.Bluetooth,null);Spacer(Modifier.width(5.dp));Text("Bluetooth")};OutlinedButton(onClick=onShare){Icon(Icons.Default.Share,null)}}
 }
}

@Composable fun StatCard(a:String,b:String,m:Modifier){Card(m){Column(Modifier.padding(9.dp),horizontalAlignment=Alignment.CenterHorizontally){Text(a,fontSize=10.sp);Text(b,fontSize=18.sp,fontWeight=FontWeight.Bold)}}}
@Composable fun HistoryScreen(list:List<InvoiceRow>,pdf:(InvoiceRow)->Unit,xls:()->Unit){Column(Modifier.fillMaxSize().padding(10.dp)){Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Text("سجل الفواتير",fontSize=22.sp,fontWeight=FontWeight.Bold);Button(onClick=xls){Text("Excel")}};LazyColumn{items(list){v->Card(Modifier.fillMaxWidth().padding(vertical=4.dp),Modifier.clickable{pdf(v)}){Row(Modifier.padding(12.dp),verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("فاتورة #${v.number}",fontWeight=FontWeight.Bold);Text(v.customer);Text("${v.date} ${v.time}",fontSize=11.sp)};Column(horizontalAlignment=Alignment.End){Text("${fmt(v.total)} ر.ي",fontWeight=FontWeight.Bold);Text(v.payment,fontSize=11.sp)}}}}}}}
@Composable fun CustomersScreen(list:List<CustomerRow>,open:(CustomerRow)->Unit,add:()->Unit){Column(Modifier.fillMaxSize().padding(10.dp)){Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text("حسابات العملاء",fontSize=22.sp,fontWeight=FontWeight.Bold);Button(onClick=add){Icon(Icons.Default.PersonAdd,null);Text("عميل جديد")}};LazyColumn{items(list){c->Card(Modifier.fillMaxWidth().padding(vertical=4.dp).clickable{open(c)}){Row(Modifier.padding(14.dp)){Column(Modifier.weight(1f)){Text(c.name,fontWeight=FontWeight.Bold);Text(c.phone.ifBlank{"بدون رقم"},fontSize=12.sp)};Text("${fmt(c.balance)} ر.ي",fontWeight=FontWeight.Bold,color=if(c.balance>0)Red else Green)}}}}}}
@Composable fun ItemsScreen(list:List<ItemRow>){Column(Modifier.fillMaxSize().padding(10.dp)){Text("الأصناف والمخزون",fontSize=22.sp,fontWeight=FontWeight.Bold);LazyColumn{items(list){i->Card(Modifier.fillMaxWidth().padding(vertical=4.dp)){Row(Modifier.padding(12.dp)){Column(Modifier.weight(1f)){Text(i.name,fontWeight=FontWeight.Bold);Text("السعر: ${fmt(i.price)}")};Text("المخزون: ${fmt(i.stock)}",color=if(i.stock<=i.minStock)Red else Green)}}}}}}
@Composable fun ReportsScreen(invoices:List<InvoiceRow>,customers:List<CustomerRow>){val total=invoices.sumOf{it.total};val cash=invoices.filter{it.payment=="نقدي"}.sumOf{it.total};val credit=invoices.filter{it.payment!="نقدي"}.sumOf{it.total};Column(Modifier.fillMaxSize().padding(12.dp).verticalScroll(rememberScrollState())){Text("التقارير",fontSize=24.sp,fontWeight=FontWeight.Bold);Spacer(Modifier.height(10.dp));StatCard("إجمالي المبيعات",fmt(total)+" ر.ي",Modifier.fillMaxWidth());StatCard("مبيعات نقدية",fmt(cash)+" ر.ي",Modifier.fillMaxWidth().padding(top=7.dp));StatCard("مبيعات آجلة",fmt(credit)+" ر.ي",Modifier.fillMaxWidth().padding(top=7.dp));StatCard("أرصدة العملاء",fmt(customers.sumOf{it.balance})+" ر.ي",Modifier.fillMaxWidth().padding(top=7.dp));Text("يمكن تطوير التقرير إلى يومي / شهري / سنوي مع فلترة بالتاريخ في الإصدار التالي.",fontSize=12.sp,modifier=Modifier.padding(top=14.dp))}}

@Composable fun CustomerDialog(customers:List<CustomerRow>,initial:String,initialPhone:String,save:(String,String)->Unit,cancel:()->Unit){var n by remember{mutableStateOf(if(initial=="عميل نقدي")"" else initial)};var p by remember{mutableStateOf(initialPhone)};AlertDialog(onDismissRequest=cancel,title={Text("👤 حفظ عميل جديد")},text={Column{OutlinedTextField(n,{n=it},label={Text("اسم العميل")});OutlinedTextField(p,{p=it},label={Text("الهاتف / واتساب")});if(n.isNotBlank()&&customers.any{it.name.equals(n.trim(),true)})Text("العميل مسجل مسبقاً وسيتم ربط الفاتورة به.",color=Blue,fontSize=12.sp)}},confirmButton={Button(onClick={if(n.isNotBlank())save(n.trim(),p.trim())}){Text("حفظ")}},dismissButton={TextButton(onClick=cancel){Text("إلغاء")}})}
@Composable fun SettingsDialog(dark:Boolean,setDark:(Boolean)->Unit,printer:()->Unit){AlertDialog(onDismissRequest={},title={Text("⚙️ إعدادات بقالة العزي")},text={Column{Text("إعدادات الكاشير الذكية",fontWeight=FontWeight.Bold);Row(verticalAlignment=Alignment.CenterVertically){Text("الوضع الداكن",Modifier.weight(1f));Switch(dark,setDark)};Text("الطابعة الحرارية: Bluetooth فقط",modifier=Modifier.padding(top=10.dp));Text("عرض الإيصال: 58mm / 384px",fontSize=12.sp);Button(onClick=printer,modifier=Modifier.fillMaxWidth().padding(top=8.dp)){Icon(Icons.Default.Bluetooth,null);Text("اختيار الطابعة الحرارية")}}},confirmButton={})}
@Composable fun PrinterDialog(devices:List<android.bluetooth.BluetoothDevice>,cancel:()->Unit,choose:(android.bluetooth.BluetoothDevice)->Unit){var loaded by remember{mutableStateOf(false)};AlertDialog(onDismissRequest=cancel,title={Text("اختر الطابعة الحرارية الصغيرة")},text={Column{if(!loaded){Text("اضغط بحث لإظهار الطابعات المقترنة.");Button(onClick={loaded=true}){Text("بحث Bluetooth")}}else if(devices.isEmpty())Text("لا توجد طابعة مقترنة. قم بإقران الطابعة من إعدادات Bluetooth ثم أعد المحاولة.") else devices.forEach{d->Text((d.name?:"طابعة")+"\n"+d.address,Modifier.fillMaxWidth().clickable{choose(d)}.padding(12.dp))}}},confirmButton={TextButton(onClick=cancel){Text("إغلاق")}})}
@Composable fun LedgerDialog(db:AppDatabase,c:CustomerRow,close:()->Unit){val ctx=LocalContext.current;val activity=ctx as Activity;val tx=remember(c.id){db.customerTransactions(c.id)};AlertDialog(onDismissRequest=close,title={Text("كشف حساب: ${c.name}")},text={Column(Modifier.fillMaxWidth().heightIn(max=500.dp)){Text("الرصيد الحالي: ${fmt(c.balance)} ر.ي",fontWeight=FontWeight.Bold,color=if(c.balance>0)Red else Green);Text(c.phone);LazyColumn{items(tx){t->Row(Modifier.fillMaxWidth().padding(vertical=5.dp)){Column(Modifier.weight(1f)){Text(if(t[0]=="payment")"سداد" else "فاتورة");Text(t[3]+" "+t[4],fontSize=10.sp)};Text(fmt(t[1].toDoubleOrNull()?:0.0))}}};Row{Button(onClick={val text=buildString{append("كشف حساب: ${c.name}\nالرصيد: ${fmt(c.balance)} ر.ي\n\n");tx.forEach{append("${it[3]} ${it[4]} - ${if(it[0]=="payment")"سداد" else "فاتورة"}: ${it[1]}\n")}};val uri=NativeServices.pdf(activity,"كشف_${c.name}",text);NativeServices.share(activity,uri,"application/pdf",text)}){Text("PDF")};Spacer(Modifier.width(5.dp));Button(onClick={val rows=listOf(listOf("النوع","المبلغ","البيان","التاريخ","الوقت"))+tx.map{it.toList()};val uri=NativeServices.xlsx(activity,"كشف_${c.name}",rows);NativeServices.share(activity,uri,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}){Text("Excel")}}}},confirmButton={TextButton(onClick=close){Text("إغلاق")}})}

private fun fmt(v:Double)=if(v%1.0==0.0)v.toInt().toString() else String.format(Locale.US,"%.2f",v)
private fun android.graphics.Bitmap.toPng():ByteArray{val o=java.io.ByteArrayOutputStream();compress(android.graphics.Bitmap.CompressFormat.PNG,100,o);return o.toByteArray()}
