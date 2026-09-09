package com.azizipos.grocery;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final int REQUEST_ANDROID_PERMISSIONS = 7001;
    private boolean exitDialogVisible = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Native Android back handling: show a real Android confirmation dialog
        // instead of relying on a browser/WebView JavaScript confirm dialog.
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

        // Android 12+ Bluetooth runtime permissions used by compatible printers/devices.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            addIfNeeded(permissions, Manifest.permission.BLUETOOTH_SCAN);
            addIfNeeded(permissions, Manifest.permission.BLUETOOTH_CONNECT);
        }

        // Android 13+ granular media permissions. File creation/export should use
        // MediaStore/SAF and does not require MANAGE_EXTERNAL_STORAGE.
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
        if (requestCode == REQUEST_ANDROID_PERMISSIONS) {
            // The app remains usable if a user declines an optional permission.
            // Android will request it again only when the corresponding feature needs it.
        }
    }
}
