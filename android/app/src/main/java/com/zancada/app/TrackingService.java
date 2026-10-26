package com.zancada.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.Manifest;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

/**
 * Servicio en primer plano que mantiene vivo el entrenamiento con la pantalla
 * apagada: recibe el GPS, mantiene la CPU despierta y emite un "tic" cada segundo
 * para que la web actualice cronómetro, series, voz y pitidos.
 */
public class TrackingService extends Service implements LocationListener {
    public interface Listener {
        void onLocation(Location l);
        void onTick();
    }

    static final String ACTION_START = "com.zancada.app.START";
    static final String ACTION_STOP = "com.zancada.app.STOP";
    private static final String CHANNEL = "tracking";
    private static final int NOTIF_ID = 1;

    static Listener listener;
    static boolean running = false;
    private static String text = "Preparando el GPS…";

    private PowerManager.WakeLock wakeLock;
    private LocationManager locationManager;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            if (listener != null) listener.onTick();
            handler.postDelayed(this, 1000);
        }
    };

    static void start(Context c) {
        Intent i = new Intent(c, TrackingService.class).setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i);
        else c.startService(i);
    }

    static void stop(Context c) {
        c.stopService(new Intent(c, TrackingService.class));
    }

    static void updateText(Context c, String t) {
        text = t;
        if (!running) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIF_ID, build(c));
    }

    private static Notification build(Context c) {
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat)
                .setContentTitle("Zancada · entrenamiento en curso")
                .setContentText(text)
                .setContentIntent(pi)
                .setOngoing(true)
                .setOnlyAlertOnce(true);
        if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        return b.build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (running) return START_NOT_STICKY;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Entrenamiento en curso", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        text = "Preparando el GPS…";
        // tipo "ubicación" solo con permiso (Android 14 cierra el servicio si no); sin él, solo audio (series sin GPS)
        boolean hasLoc = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                int type = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK | (hasLoc ? ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION : 0);
                startForeground(NOTIF_ID, build(this), type);
            } else startForeground(NOTIF_ID, build(this));
        } catch (RuntimeException e) {
            stopSelf();
            return START_NOT_STICKY;
        }
        running = true;

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "zancada:tracking");
        wakeLock.acquire(6 * 60 * 60 * 1000L); // tope de seguridad: 6 h

        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        try {
            if (hasLoc) locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 0, this, Looper.getMainLooper());
        } catch (SecurityException | IllegalArgumentException e) {
            // sin permiso o sin GPS: el cronómetro sigue funcionando
        }
        handler.post(tick);
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        handler.removeCallbacks(tick);
        if (locationManager != null) locationManager.removeUpdates(this);
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        super.onDestroy();
    }

    @Override
    public void onLocationChanged(Location l) {
        if (listener != null) listener.onLocation(l);
    }

    // Implementados explícitamente: en Android < 11 no tienen implementación por defecto
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) { }

    @Override
    public void onProviderEnabled(String provider) { }

    @Override
    public void onProviderDisabled(String provider) { }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
