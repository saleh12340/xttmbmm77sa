package com.azizipos.grocery;

import android.Manifest;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.provider.MediaStore;
import android.print.PrintManager;
import android.print.PrintDocumentAdapter;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class MainActivity extends BridgeActivity {
    private static final int REQUEST_ANDROID_PERMISSIONS = 7001;
    private static final int REQUEST_CONTACT = 7002;
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private boolean exitDialogVisible = false;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new AziziAndroidBridge(), "AndroidAzizi");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { showExitConfirmation(); }
        });
        requestRequiredAndroidPermissions();
    }

    private void showExitConfirmation() {
        if (exitDialogVisible || isFinishing()) return;
        exitDialogVisible = true;
        new AlertDialog.Builder(this).setTitle("تأكيد الخروج")
                .setMessage("هل تريد الخروج من تطبيق بقالة العزي للمواد الغذائية؟")
                .setNegativeButton("إلغاء", (d, w) -> { exitDialogVisible = false; d.dismiss(); })
                .setPositiveButton("خروج", (d, w) -> { exitDialogVisible = false; d.dismiss(); finishAndRemoveTask(); })
                .setOnCancelListener(d -> exitDialogVisible = false).show();
    }

    private void requestRequiredAndroidPermissions() {
        List<String> permissions = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            addIfNeeded(permissions, Manifest.permission.BLUETOOTH_SCAN);
            addIfNeeded(permissions, Manifest.permission.BLUETOOTH_CONNECT);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            addIfNeeded(permissions, Manifest.permission.READ_MEDIA_IMAGES);
            addIfNeeded(permissions, Manifest.permission.READ_MEDIA_VIDEO);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            addIfNeeded(permissions, Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        if (!permissions.isEmpty()) ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), REQUEST_ANDROID_PERMISSIONS);
    }

    private void addIfNeeded(List<String> permissions, String permission) {
        if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) permissions.add(permission);
    }

    private void requestContactsPermissionAndOpen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_CONTACTS}, REQUEST_CONTACT);
            return;
        }
        openContactPicker();
    }

    private void openContactPicker() {
        try {
            Intent intent = new Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI);
            startActivityForResult(intent, REQUEST_CONTACT);
        } catch (Exception e) {
            try {
                Intent intent = new Intent(Intent.ACTION_PICK, ContactsContract.Contacts.CONTENT_URI);
                startActivityForResult(intent, REQUEST_CONTACT);
            } catch (Exception ignored) {}
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CONTACT) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) openContactPicker();
            else runOnUiThread(() -> new AlertDialog.Builder(this).setTitle("إذن جهات الاتصال")
                    .setMessage("يحتاج التطبيق إلى إذن جهات الاتصال لاختيار اسم العميل ورقم جواله.")
                    .setPositiveButton("حسناً", null).show());
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_CONTACT || resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        String name = "", phone = "";
        Cursor cursor = null;
        try {
            String[] projection = {
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER,
                    ContactsContract.CommonDataKinds.Phone.CONTACT_ID
            };
            cursor = getContentResolver().query(uri, projection, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int ni = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int pi = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                int ci = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
                if (ni >= 0 && !cursor.isNull(ni)) name = cursor.getString(ni);
                if (pi >= 0 && !cursor.isNull(pi)) phone = cursor.getString(pi);
                if ((phone == null || phone.trim().isEmpty()) && ci >= 0 && !cursor.isNull(ci)) {
                    String contactId = cursor.getString(ci);
                    Cursor phoneCursor = null;
                    try {
                        String[] phoneProjection = {
                                ContactsContract.CommonDataKinds.Phone.NUMBER,
                                ContactsContract.CommonDataKinds.Phone.IS_PRIMARY,
                                ContactsContract.CommonDataKinds.Phone._ID
                        };
                        phoneCursor = getContentResolver().query(
                                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                                phoneProjection,
                                ContactsContract.CommonDataKinds.Phone.CONTACT_ID + "=?",
                                new String[]{contactId},
                                ContactsContract.CommonDataKinds.Phone.IS_PRIMARY + " DESC, " + ContactsContract.CommonDataKinds.Phone._ID + " ASC"
                        );
                        if (phoneCursor != null && phoneCursor.moveToFirst()) {
                            int pidx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                            if (pidx >= 0 && !phoneCursor.isNull(pidx)) phone = phoneCursor.getString(pidx);
                        }
                    } finally { if (phoneCursor != null) phoneCursor.close(); }
                }
            }
        } catch (Exception ignored) {
            // Some contact providers return a Contacts URI instead of a Phone URI.
            try {
                Cursor contactCursor = null;
                try {
                    String[] cp = {ContactsContract.Contacts._ID, ContactsContract.Contacts.DISPLAY_NAME, ContactsContract.Contacts.HAS_PHONE_NUMBER};
                    contactCursor = getContentResolver().query(uri, cp, null, null, null);
                    if (contactCursor != null && contactCursor.moveToFirst()) {
                        int idIndex = contactCursor.getColumnIndex(ContactsContract.Contacts._ID);
                        int nameIndex = contactCursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME);
                        if (nameIndex >= 0 && !contactCursor.isNull(nameIndex)) name = contactCursor.getString(nameIndex);
                        if (idIndex >= 0 && !contactCursor.isNull(idIndex)) {
                            String contactId = contactCursor.getString(idIndex);
                            Cursor phoneCursor = null;
                            try {
                                phoneCursor = getContentResolver().query(
                                        ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                                        new String[]{ContactsContract.CommonDataKinds.Phone.NUMBER},
                                        ContactsContract.CommonDataKinds.Phone.CONTACT_ID + "=?",
                                        new String[]{contactId},
                                        ContactsContract.CommonDataKinds.Phone.IS_PRIMARY + " DESC, " + ContactsContract.CommonDataKinds.Phone._ID + " ASC"
                                );
                                if (phoneCursor != null && phoneCursor.moveToFirst()) {
                                    int pidx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                                    if (pidx >= 0 && !phoneCursor.isNull(pidx)) phone = phoneCursor.getString(pidx);
                                }
                            } finally { if (phoneCursor != null) phoneCursor.close(); }
                        }
                    }
                } finally { if (contactCursor != null) contactCursor.close(); }
            } catch (Exception ignoredAgain) {}
        } finally { if (cursor != null) cursor.close(); }
        final String resultName = name == null ? "" : name;
        final String resultPhone = phone == null ? "" : phone;
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(
                "if(window.__aziziOnContactPicked) window.__aziziOnContactPicked(" + jsString(resultName) + "," + jsString(resultPhone) + ");", null));
    }

    private String jsString(String value) {
        String s = value == null ? "" : value;
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }

    public class AziziAndroidBridge {
        @JavascriptInterface public void pickContact() { runOnUiThread(() -> requestContactsPermissionAndOpen()); }

        @JavascriptInterface public void shareImageToWhatsApp(String base64Png, String filename, String text, String phone) {
            runOnUiThread(() -> {
                try {
                    byte[] imageBytes = Base64.decode(base64Png, Base64.DEFAULT);
                    String safeName = filename == null || filename.trim().isEmpty() ? "إيصال_بقالة_العزي.png" : filename.replaceAll("[^\\p{L}\\p{N}._-]", "_");
                    if (!safeName.toLowerCase().endsWith(".png")) safeName += ".png";
                    File file = new File(getCacheDir(), safeName);
                    try (FileOutputStream out = new FileOutputStream(file)) { out.write(imageBytes); }
                    Uri contentUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", file);
                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType("image/png");
                    intent.putExtra(Intent.EXTRA_STREAM, contentUri);
                    intent.putExtra(Intent.EXTRA_TEXT, text == null ? "" : text);
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    intent.setClipData(android.content.ClipData.newRawUri("إيصال بقالة العزي", contentUri));
                    String cleanPhone = normalizeYemeniPhone(phone);
                    String targetPackage = findWhatsAppPackage();
                    if (targetPackage != null) {
                        intent.setPackage(targetPackage);
                        if (!cleanPhone.isEmpty()) {
                            intent.putExtra("jid", cleanPhone + "@s.whatsapp.net");
                            intent.putExtra("address", cleanPhone);
                        }
                        startActivity(intent);
                    } else startActivity(Intent.createChooser(intent, "إرسال الفاتورة عبر واتساب"));
                } catch (Exception e) { shareTextToWhatsApp(text, phone); }
            });
        }

        @JavascriptInterface public void shareTextToWhatsApp(String text, String phone) {
            runOnUiThread(() -> {
                try {
                    String cleanPhone = normalizeYemeniPhone(phone);
                    String targetPackage = findWhatsAppPackage();
                    if (!cleanPhone.isEmpty() && targetPackage != null) {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setPackage(targetPackage);
                        intent.setData(Uri.parse("https://wa.me/" + cleanPhone + "?text=" + Uri.encode(text == null ? "" : text)));
                        startActivity(intent);
                        return;
                    }
                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType("text/plain");
                    intent.putExtra(Intent.EXTRA_TEXT, text == null ? "" : text);
                    if (targetPackage != null) intent.setPackage(targetPackage);
                    startActivity(targetPackage != null ? intent : Intent.createChooser(intent, "إرسال عبر واتساب"));
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface public void saveImage(String base64Png, String filename) {
            runOnUiThread(() -> {
                try {
                    byte[] bytes = Base64.decode(base64Png, Base64.DEFAULT);
                    String safeName = filename == null || filename.trim().isEmpty() ? "إيصال_بقالة_العزي.png" : filename;
                    if (!safeName.toLowerCase().endsWith(".png")) safeName += ".png";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        android.content.ContentValues values = new android.content.ContentValues();
                        values.put(MediaStore.Images.Media.DISPLAY_NAME, safeName);
                        values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                        values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/بقالة العزي");
                        Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                        if (uri == null) throw new Exception("MediaStore insert failed");
                        try (OutputStream out = getContentResolver().openOutputStream(uri)) { if (out == null) throw new Exception("Output unavailable"); out.write(bytes); }
                    } else {
                        File dir = new File(getExternalFilesDir(null), "صور_بقالة_العزي");
                        if (!dir.exists() && !dir.mkdirs()) throw new Exception("Cannot create directory");
                        try (FileOutputStream out = new FileOutputStream(new File(dir, safeName))) { out.write(bytes); }
                    }
                    runOnUiThread(() -> android.widget.Toast.makeText(MainActivity.this, "تم حفظ صورة الإيصال", android.widget.Toast.LENGTH_SHORT).show());
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface public void printHtml(String html, String documentName) {
            runOnUiThread(() -> {
                try {
                    final WebView printWebView = new WebView(MainActivity.this);
                    printWebView.getSettings().setJavaScriptEnabled(true);
                    printWebView.setBackgroundColor(android.graphics.Color.WHITE);
                    printWebView.setWebViewClient(new android.webkit.WebViewClient() {
                        @Override public void onPageFinished(WebView view, String url) {
                            PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                            PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(documentName == null ? "بقالة العزي" : documentName);
                            printManager.print(documentName == null ? "بقالة العزي" : documentName, adapter, null);
                        }
                    });
                    printWebView.loadDataWithBaseURL("https://app.local/", html == null ? "" : html, "text/html", "UTF-8", null);
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface public void printBluetoothReceipt(String base64Png) {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) { requestRequiredAndroidPermissions(); return; }
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null || !adapter.isEnabled()) { new AlertDialog.Builder(MainActivity.this).setTitle("الطابعة البلوتوث").setMessage("فعّل البلوتوث أولاً ثم أعد المحاولة.").setPositiveButton("حسناً", null).show(); return; }
                Set<BluetoothDevice> bonded = adapter.getBondedDevices();
                List<BluetoothDevice> devices = new ArrayList<>(bonded);
                if (devices.isEmpty()) { new AlertDialog.Builder(MainActivity.this).setTitle("الطابعة البلوتوث").setMessage("لا توجد طابعة مقترنة. قم بإقران الطابعة من إعدادات البلوتوث ثم أعد المحاولة.").setPositiveButton("حسناً", null).show(); return; }
                String[] names = new String[devices.size()];
                for (int i = 0; i < devices.size(); i++) names[i] = (devices.get(i).getName() == null ? "جهاز Bluetooth" : devices.get(i).getName()) + "\n" + devices.get(i).getAddress();
                new AlertDialog.Builder(MainActivity.this).setTitle("اختر الطابعة البلوتوث").setItems(names, (dialog, which) -> sendEscPosToDevice(devices.get(which), base64Png)).setNegativeButton("إلغاء", null).show();
            });
        }

        private void sendEscPosToDevice(BluetoothDevice device, String base64Png) {
            new Thread(() -> {
                BluetoothSocket socket = null;
                try {
                    byte[] imageBytes = Base64.decode(base64Png, Base64.DEFAULT);
                    Bitmap bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
                    if (bitmap == null) throw new Exception("Invalid receipt image");
                    int targetWidth = 384;
                    int targetHeight = Math.max(1, Math.round(bitmap.getHeight() * (targetWidth / (float) bitmap.getWidth())));
                    Bitmap scaled = Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true);
                    socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                    socket.connect();
                    OutputStream out = socket.getOutputStream();
                    out.write(new byte[]{0x1B, 0x40}); out.write(new byte[]{0x1B, 0x61, 0x01}); out.write(new byte[]{0x1B, 0x33, 0x00});
                    out.write(bitmapToRaster(scaled)); out.write(new byte[]{0x0A, 0x0A, 0x0A}); out.write(new byte[]{0x1D, 0x56, 0x00}); out.flush();
                    scaled.recycle(); bitmap.recycle(); socket.close();
                    runOnUiThread(() -> android.widget.Toast.makeText(MainActivity.this, "تم إرسال الفاتورة إلى الطابعة", android.widget.Toast.LENGTH_SHORT).show());
                } catch (Exception e) {
                    try { if (socket != null) socket.close(); } catch (Exception ignored) {}
                    runOnUiThread(() -> new AlertDialog.Builder(MainActivity.this).setTitle("تعذر الطباعة").setMessage("تأكد من اقتران الطابعة وتشغيلها وأنها تدعم ESC/POS ثم حاول مرة أخرى.").setPositiveButton("حسناً", null).show());
                }
            }).start();
        }

        private byte[] bitmapToRaster(Bitmap bitmap) throws Exception {
            int width = bitmap.getWidth(), height = bitmap.getHeight(), bytesPerRow = (width + 7) / 8;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            out.write(new byte[]{0x1D,0x76,0x30,0x00,(byte)(bytesPerRow & 0xFF),(byte)((bytesPerRow >> 8) & 0xFF),(byte)(height & 0xFF),(byte)((height >> 8) & 0xFF)});
            int[] pixels = new int[width];
            for (int y = 0; y < height; y++) {
                bitmap.getPixels(pixels, 0, width, 0, y, width, 1);
                for (int xByte = 0; xByte < bytesPerRow; xByte++) {
                    int value = 0;
                    for (int bit = 0; bit < 8; bit++) {
                        int x = xByte * 8 + bit;
                        if (x < width) {
                            int c = pixels[x];
                            int gray = (android.graphics.Color.red(c) * 299 + android.graphics.Color.green(c) * 587 + android.graphics.Color.blue(c) * 114) / 1000;
                            if (gray < 180) value |= (0x80 >> bit);
                        }
                    }
                    out.write(value);
                }
            }
            return out.toByteArray();
        }

        private String normalizeYemeniPhone(String phone) {
            String cleanPhone = phone == null ? "" : phone.replaceAll("[^0-9]", "");
            if (cleanPhone.length() == 9 && cleanPhone.startsWith("7")) cleanPhone = "967" + cleanPhone;
            return cleanPhone;
        }

        private String findWhatsAppPackage() {
            android.content.pm.PackageManager pm = getPackageManager();
            try { pm.getPackageInfo("com.whatsapp", 0); return "com.whatsapp"; }
            catch (Exception ignored) { try { pm.getPackageInfo("com.whatsapp.w4b", 0); return "com.whatsapp.w4b"; } catch (Exception ignoredBusiness) { return null; } }
        }
    }
}