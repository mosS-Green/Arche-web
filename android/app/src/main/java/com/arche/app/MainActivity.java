package com.arche.app;

import android.content.Intent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

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
