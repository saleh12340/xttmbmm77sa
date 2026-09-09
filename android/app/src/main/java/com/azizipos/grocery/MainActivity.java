package com.azizipos.grocery;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final int REQUEST_ANDROID_PERMISSIONS = 7001;
    private boolean exitDialogVisible = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Native Android bridge for image + text sharing directly to WhatsApp.
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new AziziAndroidBridge(), "AndroidAzizi");

        // Native Android back handling: show a real Android confirmation dialog.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                showExitConfirmation();
            }
        });

        requestRequiredAndroidPermissions();
    }

    private void showExitConfirmation() {
        if (exitDialogVisible || isFinishing()) return;
        exitDialogVisible = true;

        new AlertDialog.Builder(this)
                .setTitle("تأكيد الخروج")
                .setMessage("هل تريد الخروج من تطبيق بقالة العزي للمواد الغذائية؟")
                .setNegativeButton("إلغاء", (dialog, which) -> {
                    exitDialogVisible = false;
                    dialog.dismiss();
                })
                .setPositiveButton("خروج", (dialog, which) -> {
                    exitDialogVisible = false;
                    dialog.dismiss();
                    finishAndRemoveTask();
                })
                .setOnCancelListener(dialog -> exitDialogVisible = false)
                .show();
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

        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(
                    this,
                    permissions.toArray(new String[0]),
                    REQUEST_ANDROID_PERMISSIONS
            );
        }
    }

    private void addIfNeeded(List<String> permissions, String permission) {
        if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(permission);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    public class AziziAndroidBridge {
        @JavascriptInterface
        public void shareImageToWhatsApp(String base64Png, String filename, String text, String phone) {
            runOnUiThread(() -> {
                try {
                    byte[] imageBytes = Base64.decode(base64Png, Base64.DEFAULT);
                    String safeName = filename == null || filename.trim().isEmpty()
                            ? "إيصال_بقالة_العزي.png"
                            : filename.replaceAll("[^\\p{L}\\p{N}._-]", "_");
                    if (!safeName.toLowerCase().endsWith(".png")) safeName += ".png";

                    File file = new File(getCacheDir(), safeName);
                    try (FileOutputStream out = new FileOutputStream(file)) {
                        out.write(imageBytes);
                    }

                    Uri contentUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".fileprovider",
                            file
                    );

                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType("image/png");
                    intent.putExtra(Intent.EXTRA_STREAM, contentUri);
                    intent.putExtra(Intent.EXTRA_TEXT, text == null ? "" : text);
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    intent.setClipData(android.content.ClipData.newRawUri("إيصال بقالة العزي", contentUri));

                    String targetPackage = findWhatsAppPackage();
                    if (targetPackage != null) {
                        intent.setPackage(targetPackage);
                        startActivity(intent);
                    } else {
                        startActivity(Intent.createChooser(intent, "إرسال الفاتورة عبر واتساب"));
                    }
                } catch (Exception e) {
                    // Fallback to text-only WhatsApp if the image cannot be shared.
                    shareTextToWhatsApp(text, phone);
                }
            });
        }

        @JavascriptInterface
        public void shareTextToWhatsApp(String text, String phone) {
            runOnUiThread(() -> {
                try {
                    String cleanPhone = phone == null ? "" : phone.replaceAll("[^0-9]", "");
                    if (cleanPhone.length() == 9 && cleanPhone.startsWith("7")) cleanPhone = "967" + cleanPhone;

                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType("text/plain");
                    intent.putExtra(Intent.EXTRA_TEXT, text == null ? "" : text);
                    String targetPackage = findWhatsAppPackage();
                    if (targetPackage != null) intent.setPackage(targetPackage);
                    startActivity(targetPackage != null ? intent : Intent.createChooser(intent, "إرسال عبر واتساب"));
                } catch (Exception ignored) {
                }
            });
        }

        private String findWhatsAppPackage() {
            android.content.pm.PackageManager pm = getPackageManager();
            try {
                pm.getPackageInfo("com.whatsapp", 0);
                return "com.whatsapp";
            } catch (Exception ignored) {
                try {
                    pm.getPackageInfo("com.whatsapp.w4b", 0);
                    return "com.whatsapp.w4b";
                } catch (Exception ignoredBusiness) {
                    return null;
                }
            }
        }
    }
}
