package com.arche.app;

import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "IntentHandler")
public class IntentHandlerPlugin extends Plugin {

    @PluginMethod
    public void getLaunchIntent(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity not available");
            return;
        }
        Intent intent = getActivity().getIntent();
        if (intent == null) {
            JSObject empty = new JSObject();
            empty.put("type", "none");
            call.resolve(empty);
            return;
        }
        
        JSObject result = parseIntent(intent);
        call.resolve(result);
    }

    @PluginMethod
    public void clearIntent(PluginCall call) {
        if (getActivity() != null) {
            getActivity().setIntent(new Intent());
        }
        call.resolve();
    }

    public void handleNewIntent(Intent intent) {
        JSObject result = parseIntent(intent);
        notifyListeners("onNewIntent", result);
    }

    private JSObject parseIntent(Intent intent) {
        JSObject result = new JSObject();
        String action = intent.getAction();
        
        if ("com.arche.app.action.QS_CAMERA".equals(action)) {
            result.put("type", "qs_camera");
        } else if (Intent.ACTION_SEND.equals(action)) {
            result.put("type", "share");
            String mimeType = intent.getType();
            result.put("mimeType", mimeType);
            
            if (mimeType != null && mimeType.startsWith("text/")) {
                String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                result.put("text", sharedText);
            } else if (mimeType != null && mimeType.startsWith("image/")) {
                Uri imageUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
                if (imageUri != null) {
                    result.put("imageUri", imageUri.toString());
                    String base64Data = convertUriToBase64(imageUri);
                    if (base64Data != null) {
                        result.put("imageBase64", "data:" + mimeType + ";base64," + base64Data);
                    }
                }
            }
        } else {
            result.put("type", "none");
        }
        return result;
    }

    private String convertUriToBase64(Uri uri) {
        try {
            ContentResolver resolver = getContext().getContentResolver();
            InputStream inputStream = resolver.openInputStream(uri);
            if (inputStream == null) return null;
            
            ByteArrayOutputStream byteBuffer = new ByteArrayOutputStream();
            int bufferSize = 1024;
            byte[] buffer = new byte[bufferSize];
            
            int len;
            while ((len = inputStream.read(buffer)) != -1) {
                byteBuffer.write(buffer, 0, len);
            }
            byte[] bytes = byteBuffer.toByteArray();
            return Base64.encodeToString(bytes, Base64.NO_WRAP);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
