package com.azizi.pos.nativeapp

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

data class InvoiceRow(val id: Long, val number: Int, val customer: String, val phone: String, val total: Double, val payment: String, val date: String, val time: String)
data class CustomerRow(val id: Long, val name: String, val phone: String, val balance: Double)
data class ItemRow(val id: Long, val name: String, val price: Double, val stock: Double, val minStock: Double)

data class SaleLine(val name: String, val qty: Double, val unit: Double) { val total get() = qty * unit }

class AppDatabase private constructor(context: Context) : SQLiteOpenHelper(context, "azizi_grocery.db", null, 1) {
    companion object { @Volatile private var instance: AppDatabase? = null; fun get(c: Context) = instance ?: synchronized(this) { instance ?: AppDatabase(c.applicationContext).also { instance = it } } }
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("CREATE TABLE invoices(id INTEGER PRIMARY KEY AUTOINCREMENT, number INTEGER, customer TEXT, phone TEXT, total REAL, payment TEXT, date TEXT, time TEXT)")
        db.execSQL("CREATE TABLE invoice_lines(id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER, name TEXT, qty REAL, unit REAL, total REAL)")
        db.execSQL("CREATE TABLE customers(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, phone TEXT, balance REAL DEFAULT 0)")
        db.execSQL("CREATE TABLE transactions(id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, invoice_id INTEGER, type TEXT, amount REAL, note TEXT, date TEXT, time TEXT)")
        db.execSQL("CREATE TABLE items(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, price REAL DEFAULT 0, stock REAL DEFAULT 0, min_stock REAL DEFAULT 0)")
        db.execSQL("CREATE TABLE expenses(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, amount REAL, date TEXT, note TEXT)")
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) { }
    fun nextInvoice(): Int = readableDatabase.rawQuery("SELECT COALESCE(MAX(number),1000)+1 FROM invoices", null).use { if (it.moveToFirst()) it.getInt(0) else 1001 }
    fun addInvoice(number:Int, customer:String, phone:String, total:Double, payment:String, date:String, time:String, lines:List<SaleLine>):Long {
        val db=writableDatabase; db.beginTransaction(); try {
            val v=ContentValues().apply { put("number",number);put("customer",customer);put("phone",phone);put("total",total);put("payment",payment);put("date",date);put("time",time) }
            val id=db.insert("invoices",null,v)
            lines.forEach { l -> db.insert("invoice_lines",null,ContentValues().apply{put("invoice_id",id);put("name",l.name);put("qty",l.qty);put("unit",l.unit);put("total",l.total)}) ; db.execSQL("INSERT OR IGNORE INTO items(name,price) VALUES(?,?)",arrayOf(l.name,l.unit)); db.execSQL("UPDATE items SET price=? WHERE name=?",arrayOf(l.unit,l.name)) }
            if(customer.isNotBlank() && customer != "عميل نقدي") {
                db.execSQL("INSERT OR IGNORE INTO customers(name,phone,balance) VALUES(?,?,0)",arrayOf(customer,phone)); db.execSQL("UPDATE customers SET phone=? WHERE name=?",arrayOf(phone,customer))
                if(payment.contains("آجل") || payment.contains("دين")) { val cid=db.rawQuery("SELECT id FROM customers WHERE name=?",arrayOf(customer)).use{it.moveToFirst();it.getLong(0)}; db.execSQL("UPDATE customers SET balance=balance+? WHERE id=?",arrayOf(total,cid)); db.execSQL("INSERT INTO transactions(customer_id,invoice_id,type,amount,note,date,time) VALUES(?,?,?,?,?,?,?)",arrayOf(cid,id,"invoice",total,"فاتورة آجلة",date,time)) }
            }
            db.setTransactionSuccessful(); return id
        } finally { db.endTransaction() }
    }
    fun invoices():List<InvoiceRow>{ val out=mutableListOf<InvoiceRow>(); readableDatabase.rawQuery("SELECT id,number,customer,phone,total,payment,date,time FROM invoices ORDER BY id DESC",null).use{while(it.moveToNext())out+=InvoiceRow(it.getLong(0),it.getInt(1),it.getString(2),it.getString(3),it.getDouble(4),it.getString(5),it.getString(6),it.getString(7))};return out }
    fun customers():List<CustomerRow>{val out=mutableListOf<CustomerRow>();readableDatabase.rawQuery("SELECT id,name,phone,balance FROM customers ORDER BY name",null).use{while(it.moveToNext())out+=CustomerRow(it.getLong(0),it.getString(1),it.getString(2),it.getDouble(3))};return out}
    fun items():List<ItemRow>{val out=mutableListOf<ItemRow>();readableDatabase.rawQuery("SELECT id,name,price,stock,min_stock FROM items ORDER BY name",null).use{while(it.moveToNext())out+=ItemRow(it.getLong(0),it.getString(1),it.getDouble(2),it.getDouble(3),it.getDouble(4))};return out}
    fun addPayment(customerId:Long,amount:Double,note:String,date:String,time:String){val db=writableDatabase;db.execSQL("UPDATE customers SET balance=balance-? WHERE id=?",arrayOf(amount,customerId));db.execSQL("INSERT INTO transactions(customer_id,type,amount,note,date,time) VALUES(?,?,?,?,?,?)",arrayOf(customerId,"payment",amount,note,date,time))}
    fun customerTransactions(id:Long):List<Array<String>>{val out=mutableListOf<Array<String>>();readableDatabase.rawQuery("SELECT type,amount,note,date,time FROM transactions WHERE customer_id=? ORDER BY id DESC",arrayOf(id.toString())).use{while(it.moveToNext())out+=arrayOf(it.getString(0),it.getString(1),it.getString(2),it.getString(3),it.getString(4))};return out}
}
