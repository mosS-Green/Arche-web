package com.arche.app;

import android.content.Intent;
import android.app.PendingIntent;
import android.service.quicksettings.TileService;

public class QSCameraTileService extends TileService {
    @Override
    public void onClick() {
        super.onClick();
        final Intent intent = new Intent(this, MainActivity.class);
        intent.setAction("com.arche.app.action.QS_CAMERA");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        if (isLocked()) {
            unlockAndRun(new Runnable() {
                @Override
                public void run() {
                    startAppActivity(intent);
                }
            });
        } else {
            startAppActivity(intent);
        }
    }

    private void startAppActivity(Intent intent) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // API 34+
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            startActivityAndCollapse(pendingIntent);
        } else {
            startActivityAndCollapse(intent);
        }
    }
}
