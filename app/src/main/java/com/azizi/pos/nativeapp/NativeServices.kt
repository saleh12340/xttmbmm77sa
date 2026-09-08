package com.azizi.pos.nativeapp

import android.Manifest
import android.app.Activity
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
    const val REQ_BT = 701
    private const val SPP = "00001101-0000-1000-8000-00805F9B34FB"
    private const val WHATSAPP = "com.whatsapp"

    fun ensureBluetoothPermission(a: Activity): Boolean {
        if (Build.VERSION.SDK_INT >= 31 && ActivityCompat.checkSelfPermission(a, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(a, arrayOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT), REQ_BT)
            return false
        }
        return true
    }

    fun pairedPrinters(a: Activity): List<BluetoothDevice> {
        if (!ensureBluetoothPermission(a)) return emptyList()
        val adapter = a.getSystemService(BluetoothManager::class.java).adapter
        return adapter?.bondedDevices?.toList()?.sortedBy { it.name ?: it.address } ?: emptyList()
    }

    /** Small, clean 58mm receipt bitmap (384px) suitable for WhatsApp and thermal printing. */
    fun receiptBitmap(invoiceNumber: Int, store: String, customer: String, lines: List<SaleLine>, total: Double, payment: String, width: Int = 384): Bitmap {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            typeface = Typeface.create("sans", Typeface.NORMAL)
            textSize = 18f
            color = Color.BLACK
        }
        val bold = Paint(paint).apply {
            typeface = Typeface.create("sans", Typeface.BOLD)
            textSize = 21f
        }
        val rowHeight = 30
        val height = (lines.size * rowHeight + 245).coerceAtMost(2200)
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        var y = 30f

        fun center(text: String, p: Paint) {
            canvas.drawText(text, (width - p.measureText(text)) / 2f, y, p)
            y += p.textSize + 8f
        }
        fun right(text: String, p: Paint) {
            canvas.drawText(text, width - 10f - p.measureText(text), y, p)
            y += p.textSize + 7f
        }

        center(store, bold)
        center("فاتورة رقم $invoiceNumber", paint)
        right("العميل: ${customer.ifBlank { "عميل نقدي" }}", paint)
        right("طريقة الدفع: $payment", paint)
        y += 4f
        right("الصنف                 الكمية       الإجمالي", bold)
        lines.forEach { line ->
            val item = line.name.replace("\n", " ").take(18)
            right("$item    ${fmt(line.qty)}       ${fmt(line.total)}", paint)
        }
        y += 4f
        right("الإجمالي: ${fmt(total)} ر.ي", bold)
        right(SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date()), paint)

        return bitmap
    }

    private fun fmt(v: Double) = if (v % 1.0 == 0.0) v.toInt().toString() else String.format(Locale.US, "%.2f", v)

    fun escpos(bitmap: Bitmap): ByteArray {
        val w = bitmap.width
        val h = bitmap.height
        val out = ByteArrayOutputStream()
        out.write(byteArrayOf(0x1B, 0x40))
        out.write(byteArrayOf(0x1B, 0x61, 0x01))
        for (y in 0 until h step 24) {
            out.write(byteArrayOf(0x1B, 0x2A, 0x21, (w and 255).toByte(), (w shr 8).toByte()))
            for (x in 0 until w) {
                for (bit in 0..2) {
                    var value = 0
                    for (k in 0..7) {
                        val yy = y + bit * 8 + k
                        if (yy < h) {
                            val pixel = bitmap.getPixel(x, yy)
                            val gray = (Color.red(pixel) + Color.green(pixel) + Color.blue(pixel)) / 3
                            if (gray < 150) value = value or (1 shl (7 - k))
                        }
                    }
                    out.write(value)
                }
            }
            out.write(0x0A)
        }
        out.write(byteArrayOf(0x1B, 0x64, 0x03))
        return out.toByteArray()
    }

    fun printBluetooth(a: Activity, device: BluetoothDevice, bitmap: Bitmap, onDone: (String) -> Unit) {
        Thread {
            try {
                if (!ensureBluetoothPermission(a)) { onDone("permission"); return@Thread }
                val socket = device.createRfcommSocketToServiceRecord(UUID.fromString(SPP))
                socket.connect()
                socket.outputStream.use { it.write(escpos(bitmap)); it.flush() }
                socket.close()
                onDone("ok")
            } catch (e: Exception) {
                onDone(e.message ?: "فشل الاتصال")
            }
        }.start()
    }

    /** Saves into the app's Downloads folder and exposes it through FileProvider. */
    fun saveFile(a: Activity, bytes: ByteArray, name: String, mime: String): Uri {
        val base = a.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: a.filesDir
        val dir = File(base, "بقالة العزي للمواد الغذائية")
        dir.mkdirs()
        val file = File(dir, name)
        FileOutputStream(file).use { it.write(bytes) }
        return FileProvider.getUriForFile(a, "${a.packageName}.fileprovider", file)
    }

    fun share(a: Activity, uri: Uri, mime: String, text: String = "") {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mime
            putExtra(Intent.EXTRA_STREAM, uri)
            if (text.isNotBlank()) putExtra(Intent.EXTRA_TEXT, text)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            clipData = ClipData.newRawUri("attachment", uri)
        }
        a.startActivity(Intent.createChooser(intent, "مشاركة الملف"))
    }

    /** Direct WhatsApp share; falls back to the normal Android share sheet if WhatsApp is not installed. */
    fun shareWhatsApp(a: Activity, uri: Uri, mime: String, text: String = "") {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = mime
            putExtra(Intent.EXTRA_STREAM, uri)
            if (text.isNotBlank()) putExtra(Intent.EXTRA_TEXT, text)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            clipData = ClipData.newRawUri("attachment", uri)
            `package` = WHATSAPP
        }
        try {
            a.startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            share(a, uri, mime, text)
        }
    }

    /** Generates a readable one-page PDF and keeps Arabic text selectable/searchable. */
    fun pdf(a: Activity, title: String, body: String): Uri {
        val lines = body.lines().flatMap { wrap(it, 52) }
        val height = (90 + lines.size * 22).coerceAtLeast(220).coerceAtMost(3000)
        val doc = PdfDocument()
        val page = doc.startPage(PdfDocument.PageInfo.Builder(595, height, 1).create())
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.BLACK; textSize = 16f; typeface = Typeface.create("sans", Typeface.NORMAL) }
        val bold = Paint(paint).apply { typeface = Typeface.create("sans", Typeface.BOLD); textSize = 18f }
        var y = 34f
        page.canvas.drawText(title.take(55), 565f - bold.measureText(title.take(55)), y, bold)
        y += 30f
        lines.forEach { line ->
            page.canvas.drawText(line, 565f - paint.measureText(line), y, paint)
            y += 22f
        }
        doc.finishPage(page)
        val out = ByteArrayOutputStream()
        doc.writeTo(out)
        doc.close()
        return saveFile(a, out.toByteArray(), "$title.pdf", "application/pdf")
    }

    private fun wrap(value: String, max: Int): List<String> {
        if (value.length <= max) return listOf(value)
        val result = mutableListOf<String>()
        var rest = value
        while (rest.length > max) {
            var cut = rest.lastIndexOf(' ', max)
            if (cut <= 0) cut = max
            result += rest.substring(0, cut)
            rest = rest.substring(cut).trimStart()
        }
        if (rest.isNotEmpty()) result += rest
        return result
    }

    fun xlsx(a: Activity, title: String, rows: List<List<String>>): Uri {
        val out = ByteArrayOutputStream()
        ZipOutputStream(out).use { z ->
            fun entry(name: String, value: String) {
                z.putNextEntry(ZipEntry(name)); z.write(value.toByteArray(Charsets.UTF_8)); z.closeEntry()
            }
            entry("[Content_Types].xml", "<?xml version=\"1.0\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>")
            entry("_rels/.rels", "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>")
            entry("xl/workbook.xml", "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"البيانات\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>")
            entry("xl/_rels/workbook.xml.rels", "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>")
            val xml = StringBuilder("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>")
            rows.forEachIndexed { r, row ->
                xml.append("<row r=\"${r + 1}\">")
                row.forEachIndexed { c, v ->
                    val col = ('A'.code + c).toChar()
                    val safe = v.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    xml.append("<c r=\"$col${r + 1}\" t=\"inlineStr\"><is><t>$safe</t></is></c>")
                }
                xml.append("</row>")
            }
            xml.append("</sheetData></worksheet>")
            entry("xl/worksheets/sheet1.xml", xml.toString())
        }
        return saveFile(a, out.toByteArray(), "$title.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
}
