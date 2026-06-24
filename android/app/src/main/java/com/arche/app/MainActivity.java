package com.arche.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(IntentHandlerPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        
        try {
            IntentHandlerPlugin plugin = (IntentHandlerPlugin) getBridge().getPlugin("IntentHandler").getInstance();
            if (plugin != null) {
                plugin.handleNewIntent(intent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
