# xttmbmm77sa — بقالة العزي للمواد الغذائية

نسخة Native Android مبنية بـ **Kotlin + Jetpack Compose** لتطبيق بقالة العزي.

## البنية
- Kotlin + Jetpack Compose + Material 3.
- SQLite محلي داخل Android، وليس LocalStorage.
- RTL عربي بالكامل.
- فواتير مبيعات، عملاء، حسابات، أصناف ومخزون، تقارير وسجل فواتير.
- ربط الفاتورة بالعميل ورقم الهاتف/واتساب.
- مشاركة PDF / Excel / صورة إيصال 58mm.
- طباعة حرارية Bluetooth Classic عبر ESC/POS، بعرض 58mm و384px.
- GitHub Actions لإنتاج Debug APK.

## البناء
افتح المشروع في Android Studio أو شغّل:

```bash
gradle assembleDebug
```

ملف APK الناتج: `app/build/outputs/apk/debug/app-debug.apk`.
