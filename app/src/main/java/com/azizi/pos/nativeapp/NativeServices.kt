package com.azizi.pos.nativeapp

import android.Manifest
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.content.*
import android.content.pm.PackageManager
import android.graphics.*
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import androidx.core.app.ActivityCompat
import androidx.core.content.FileProvider
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

object NativeServices {
    const val REQ_BT=701
    private const val SPP="00001101-0000-1000-8000-00805F9B34FB"
    fun ensureBluetoothPermission(a:Activity):Boolean { if(Build.VERSION.SDK_INT>=31 && ActivityCompat.checkSelfPermission(a,Manifest.permission.BLUETOOTH_CONNECT)!=PackageManager.PERMISSION_GRANTED){ActivityCompat.requestPermissions(a,arrayOf(Manifest.permission.BLUETOOTH_SCAN,Manifest.permission.BLUETOOTH_CONNECT),REQ_BT);return false};return true }
    fun pairedPrinters(a:Activity):List<BluetoothDevice>{ if(!ensureBluetoothPermission(a))return emptyList(); val m=a.getSystemService(BluetoothManager::class.java).adapter; return m?.bondedDevices?.toList()?.sortedBy{it.name?:(it.address)}?:emptyList() }
    fun receiptBitmap(invoiceNumber:Int,store:String,customer:String,lines:List<SaleLine>,total:Double,payment:String,width:Int=384):Bitmap {
        val paint=Paint(Paint.ANTI_ALIAS_FLAG).apply{typeface=Typeface.create("sans",Typeface.NORMAL);textSize=20f;color=Color.BLACK}
        val bold=Paint(paint).apply{typeface=Typeface.create("sans",Typeface.BOLD);textSize=23f}
        val rows=lines.size*31+230; val b=Bitmap.createBitmap(width,rows,Bitmap.Config.ARGB_8888); val c=Canvas(b);c.drawColor(Color.WHITE);var y=34f
        fun center(t:String,p:Paint){c.drawText(t,(width-p.measureText(t))/2,y,p);y+=p.textSize+10}
        fun right(t:String,p:Paint){c.drawText(t,width-10-p.measureText(t),y,p);y+=p.textSize+8}
        center(store,bold); center("فاتورة رقم $invoiceNumber",paint); right("العميل: $customer",paint); right("طريقة الدفع: $payment",paint); y+=4
        right("الصنف                 الكمية       الإجمالي",bold)
        lines.forEach{ val text="${it.name.take(17)}   ${fmt(it.qty)}       ${fmt(it.total)}";right(text,paint)}
        y+=5;right("الإجمالي: ${fmt(total)} ر.ي",bold); right("التاريخ: "+SimpleDateFormat("yyyy-MM-dd HH:mm",Locale.US).format(Date()),paint)
        return b
    }
    private fun fmt(v:Double)=if(v%1.0==0.0)v.toInt().toString() else String.format(Locale.US,"%.2f",v)
    fun escpos(bitmap:Bitmap):ByteArray { val w=bitmap.width;val h=bitmap.height;val out=ByteArrayOutputStream();out.write(byteArrayOf(0x1B,0x40));out.write(byteArrayOf(0x1B,0x61,0x01)); for(y in 0 until h step 24){out.write(byteArrayOf(0x1B,0x2A,0x21,(w and 255).toByte(),(w shr 8).toByte()));for(x in 0 until w){for(bit in 0..2){var v=0;for(k in 0..7){val yy=y+bit*8+k;if(yy<h){val p=bitmap.getPixel(x,yy);val g=(Color.red(p)+Color.green(p)+Color.blue(p))/3;if(g<150)v=v or (1 shl (7-k))}};out.write(v)}};out.write(0x0A)};out.write(byteArrayOf(0x1B,0x64,0x03));return out.toByteArray() }
    fun printBluetooth(a:Activity,device:BluetoothDevice,bitmap:Bitmap,onDone:(String)->Unit){ Thread{try{if(!ensureBluetoothPermission(a)){onDone("permission");return@Thread};val s=device.createRfcommSocketToServiceRecord(UUID.fromString(SPP));s.connect();s.outputStream.use{it.write(escpos(bitmap));it.flush()};s.close();onDone("ok")}catch(e:Exception){onDone(e.message?:"فشل الاتصال")}}.start() }
    fun saveFile(a:Activity,bytes:ByteArray,name:String,mime:String):Uri {val dir=File(a.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),"بقالة العزي للمواد الغذائية");dir.mkdirs();val f=File(dir,name);FileOutputStream(f).use{it.write(bytes)};return FileProvider.getUriForFile(a,"${a.packageName}.fileprovider",f)}
    fun share(a:Activity,uri:Uri,mime:String,text:String=""){val i=Intent(Intent.ACTION_SEND).apply{type=mime;putExtra(Intent.EXTRA_STREAM,uri);putExtra(Intent.EXTRA_TEXT,text);addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)};a.startActivity(Intent.createChooser(i,"مشاركة"))}
    fun pdf(a:Activity,title:String,body:String):Uri {val doc=PdfDocument();val page=doc.startPage(PdfDocument.PageInfo.Builder(384,1000,1).create());val p=Paint(Paint.ANTI_ALIAS_FLAG).apply{color=Color.BLACK;textSize=16f};var y=35f;page.canvas.drawText(title,20f,y,p);y+=30;body.lines().take(45).forEach{page.canvas.drawText(it.take(48),20f,y,p);y+=21};doc.finishPage(page);val out=ByteArrayOutputStream();doc.writeTo(out);doc.close();return saveFile(a,out.toByteArray(),"$title.pdf","application/pdf")}
    fun xlsx(a:Activity,title:String,rows:List<List<String>>):Uri {val out=ByteArrayOutputStream();ZipOutputStream(out).use{z->fun e(n:String,s:String){z.putNextEntry(ZipEntry(n));z.write(s.toByteArray(Charsets.UTF_8));z.closeEntry()};e("[Content_Types].xml","<?xml version=\"1.0\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>");e("_rels/.rels","<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");e("xl/workbook.xml","<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"البيانات\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");e("xl/_rels/workbook.xml.rels","<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>");val xml=StringBuilder("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");rows.forEachIndexed{r,row->xml.append("<row r=\"${r+1}\">");row.forEachIndexed{c,v->val col=('A'.code+c).toChar();xml.append("<c r=\"$col${r+1}\" t=\"inlineStr\"><is><t>${v.replace("&","&amp;").replace("<","&lt;")}</t></is></c>")};xml.append("</row>")};xml.append("</sheetData></worksheet>");e("xl/worksheets/sheet1.xml",xml.toString())};return saveFile(a,out.toByteArray(),"$title.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
}
