package com.zancada.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;

/**
 * Envoltorio nativo de la PWA Zancada: carga runner/index.html desde los assets
 * con un origen https y expone a la web (window.Android) el seguimiento en segundo
 * plano, la voz, los pitidos, la vibración y el guardado de archivos.
 */
public class MainActivity extends Activity implements TrackingService.Listener {
    private static final String START_URL = "https://appassets.androidplatform.net/assets/index.html";
    private static final int REQ_LOCATION = 1;
    private static final int REQ_FILE = 2;
    private static final int REQ_SAVE = 3;
    private static final int REQ_NATIVE_PERMS = 4;

    private WebView webView;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private AudioManager audio;
    private ToneGenerator tones;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private String pendingGeoOrigin;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingSaveText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        audio = (AudioManager) getSystemService(AUDIO_SERVICE);
        try {
            tones = new ToneGenerator(AudioManager.STREAM_MUSIC, 90);
        } catch (RuntimeException e) {
            tones = null;
        }

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(new Locale("es", "ES"));
                tts.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build());
                // baja el volumen de la música mientras habla y lo recupera al terminar
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { }
                    @Override public void onDone(String id) { audio.abandonAudioFocus(null); }
                    @Override public void onError(String id) { audio.abandonAudioFocus(null); }
                });
                ttsReady = true;
            }
        });

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setGeolocationEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        // que el motor de la web no se congele con la pantalla apagada
        if (Build.VERSION.SDK_INT >= 26) webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("appassets.androidplatform.net".equals(url.getHost())) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, url));
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                } else {
                    pendingGeoOrigin = origin;
                    pendingGeoCallback = callback;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOCATION);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                startActivityForResult(Intent.createChooser(i, "Importar copia"), REQ_FILE);
                return true;
            }
        });

        webView.addJavascriptInterface(new Bridge(), "Android");
        setContentView(webView);
        TrackingService.listener = this;
        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl(START_URL);
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void js(String code) {
        runOnUiThread(() -> webView.evaluateJavascript(code, null));
    }

    // ---- TrackingService.Listener ----
    @Override
    public void onLocation(Location l) {
        String json = String.format(Locale.US,
                "{\"lat\":%.7f,\"lon\":%.7f,\"acc\":%.1f,\"alt\":%s,\"t\":%d,\"spd\":%s}",
                l.getLatitude(), l.getLongitude(), l.hasAccuracy() ? l.getAccuracy() : 99f,
                l.hasAltitude() ? String.format(Locale.US, "%.1f", l.getAltitude()) : "null",
                l.getTime(), l.hasSpeed() ? String.format(Locale.US, "%.2f", l.getSpeed()) : "null");
        js("window.zNative&&zNative.loc(" + json + ")");
    }

    @Override
    public void onTick() {
        js("window.zNative&&zNative.tick()");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        if (requestCode == REQ_LOCATION && pendingGeoCallback != null) {
            pendingGeoCallback.invoke(pendingGeoOrigin, hasLocationPermission(), false);
            pendingGeoCallback = null;
        }
        if (requestCode == REQ_NATIVE_PERMS) js("window.zNative&&zNative.perm(" + hasLocationPermission() + ")");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE && fileCallback != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) result = new Uri[]{data.getData()};
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        }
        if (requestCode == REQ_SAVE) {
            boolean ok = false;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingSaveText != null) {
                try (OutputStream os = getContentResolver().openOutputStream(data.getData())) {
                    os.write(pendingSaveText.getBytes(StandardCharsets.UTF_8));
                    ok = true;
                } catch (Exception e) {
                    ok = false;
                }
            }
            pendingSaveText = null;
            js("window.zNative&&zNative.saved(" + ok + ")");
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else moveTaskToBack(true); // no cierra la app: un entrenamiento puede estar en curso
    }

    @Override
    protected void onDestroy() {
        if (TrackingService.listener == this) TrackingService.listener = null;
        TrackingService.stop(this);
        if (tts != null) tts.shutdown();
        if (tones != null) tones.release();
        webView.destroy();
        super.onDestroy();
    }

    private class Bridge {
        @JavascriptInterface
        public void speak(String text) {
            if (!ttsReady) return;
            audio.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "zancada");
        }

        /** kind: 0 pitido corto, 1 doble (empieza serie), 2 suave (recuperación), 3 final */
        @JavascriptInterface
        public void tone(int kind) {
            if (tones == null) return;
            int[] types = {ToneGenerator.TONE_PROP_BEEP, ToneGenerator.TONE_PROP_BEEP2, ToneGenerator.TONE_PROP_ACK, ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD};
            int[] durations = {150, 300, 250, 600};
            int k = Math.max(0, Math.min(kind, 3));
            tones.startTone(types[k], durations[k]);
        }

        @JavascriptInterface
        public void vibrate(long ms) {
            Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (v == null) return;
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
            else v.vibrate(ms);
        }

        @JavascriptInterface
        public void keepScreenOn(boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public boolean hasLocation() {
            return hasLocationPermission();
        }

        /** Pide ubicación (y notificaciones en Android 13+); responde en zNative.perm(bool) */
        @JavascriptInterface
        public void requestLocation() {
            ArrayList<String> p = new ArrayList<>();
            p.add(Manifest.permission.ACCESS_FINE_LOCATION);
            p.add(Manifest.permission.ACCESS_COARSE_LOCATION);
            if (Build.VERSION.SDK_INT >= 33) p.add(Manifest.permission.POST_NOTIFICATIONS);
            runOnUiThread(() -> requestPermissions(p.toArray(new String[0]), REQ_NATIVE_PERMS));
        }

        @JavascriptInterface
        public void startTracking() {
            runOnUiThread(() -> TrackingService.start(MainActivity.this));
        }

        @JavascriptInterface
        public void stopTracking() {
            runOnUiThread(() -> TrackingService.stop(MainActivity.this));
        }

        @JavascriptInterface
        public void notify(String text) {
            TrackingService.updateText(MainActivity.this, text);
        }

        @JavascriptInterface
        public boolean isIgnoringBattery() {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
        }

        @JavascriptInterface
        public void batteryExempt() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
                } catch (Exception e) {
                    startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                }
            });
        }

        /** Guarda un archivo donde elija la persona; responde en zNative.saved(bool) */
        @JavascriptInterface
        public void saveFile(String fileName, String mime, String text) {
            pendingSaveText = text;
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType(mime);
            i.putExtra(Intent.EXTRA_TITLE, fileName);
            runOnUiThread(() -> startActivityForResult(i, REQ_SAVE));
        }

        @JavascriptInterface
        public void shareText(String fileName, String text) {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_SUBJECT, fileName);
            i.putExtra(Intent.EXTRA_TEXT, text);
            runOnUiThread(() -> startActivity(Intent.createChooser(i, "Compartir")));
        }
    }
}
