package com.throwp;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Looper;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.neurosky.thinkgear.*;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import javax.annotation.Nullable;
import java.util.Set;
import java.lang.reflect.Field;
import android.content.Context;
import android.content.SharedPreferences;

public class NeuroSkyModule extends ReactContextBaseJavaModule {
    private static final String TAG = "NeuroSkyModule";
    private static final String PREFS_NAME = "NeuroSkyPrefs";
    private static final String LAST_DEVICE_ADDRESS = "LastDeviceAddress";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private final ReactApplicationContext reactContext;
    private BluetoothAdapter bluetoothAdapter;
    private TGDevice tgDevice;
    private static final String TARGET_DEVICE_NAME = "Alchemy";
    private BluetoothDevice lastConnectedDevice = null;
    private String lastSuccessfulAddress = null; // 保存最後一次成功連接的地址
    private boolean isConnected = false;
    private Handler handler;
    private static NeuroSkyModule instance;
    private static final int MAX_RETRY_COUNT = 10;  // 最大重試次數
    private static final int INITIAL_RETRY_DELAY_MS = 2000;  // 初始重試延遲
    private static final int MAX_RETRY_DELAY_MS = 30000;  // 最大重試延遲（30秒）
    private int retryCount = 0;  // 當前重試次數
    private int currentRetryDelay = INITIAL_RETRY_DELAY_MS;  // 當前重試延遲
    private boolean isRetrying = false;  // 是否正在重試中
    private Handler retryHandler = new Handler(Looper.getMainLooper());
    private Runnable retryRunnable;

    public NeuroSkyModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        this.handler = new Handler(Looper.getMainLooper(), handlerCallback);
        instance = this;

        // 讀取保存的設備地址
        SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        lastSuccessfulAddress = prefs.getString(LAST_DEVICE_ADDRESS, null);
        
        Log.i(TAG, "NeuroSkyModule 已初始化，上次連接的設備地址: " + lastSuccessfulAddress);
    }

    public static NeuroSkyModule getInstance() {
        return instance;
    }

    @Override
    public String getName() {
        return "NeuroSkyModule";
    }

    private final Handler.Callback handlerCallback = new Handler.Callback() {
        @Override
        public boolean handleMessage(Message msg) {
            WritableMap params = Arguments.createMap();

            switch (msg.what) {
                case TGDevice.MSG_STATE_CHANGE:
                    switch (msg.arg1) {
                        case TGDevice.STATE_CONNECTED:
                            isConnected = true;
                            // 保存成功連接的設備地址
                            if (lastConnectedDevice != null) {
                                lastSuccessfulAddress = lastConnectedDevice.getAddress();
                                SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                                prefs.edit().putString(LAST_DEVICE_ADDRESS, lastSuccessfulAddress).apply();
                                Log.i(TAG, "保存成功連接的設備地址: " + lastSuccessfulAddress);
                            }
                            Log.i(TAG, "設備已連接");
                            params.putString("state", "CONNECTED");
                            sendEvent("onStateChange", params);
                            // 連接成功後自動開始監測
                            if (tgDevice != null) {
                                Log.i(TAG, "自動開始監測數據");
                                tgDevice.start();
                            }
                            break;
                        case TGDevice.STATE_DISCONNECTED:
                            isConnected = false;
                            Log.i(TAG, "設備已斷開連接");
                            params.putString("state", "DISCONNECTED");
                            sendEvent("onStateChange", params);
                            // 設備斷開時嘗試重新連接
                            if (tgDevice != null && !isRetrying) {
                                Log.i(TAG, "設備斷開，開始重試連接");
                                scheduleRetry();
                            }
                            break;
                        case TGDevice.STATE_CONNECTING:
                            Log.i(TAG, "正在連接設備...");
                            params.putString("state", "CONNECTING");
                            sendEvent("onStateChange", params);
                            break;
                        case TGDevice.STATE_NOT_FOUND:
                            Log.e(TAG, "錯誤：找不到設備");
                            params.putString("error", "找不到設備");
                            sendEvent("onError", params);
                            // 找不到設備時嘗試重新連接
                            scheduleRetry();
                            break;
                        case TGDevice.STATE_NOT_PAIRED:
                            Log.e(TAG, "錯誤：設備未配對");
                            params.putString("error", "設備未配對");
                            sendEvent("onError", params);
                            break;
                        default:
                            break;
                    }
                    break;

                case TGDevice.MSG_POOR_SIGNAL:
                    params.putString("signal", "POOR_SIGNAL");
                    params.putInt("value", msg.arg1);
                    sendEvent("onSignalChange", params);
                    break;

                case TGDevice.MSG_ATTENTION:
                    //Log.d(TAG, "專注度: " + msg.arg1);
                    params.putString("signal", "ATTENTION");
                    params.putInt("value", msg.arg1);
                    sendEvent("onSignalChange", params);
                    break;

                case TGDevice.MSG_MEDITATION:
                    //Log.d(TAG, "冥想度: " + msg.arg1);
                    params.putString("signal", "MEDITATION");
                    params.putInt("value", msg.arg1);
                    sendEvent("onSignalChange", params);
                    break;

                case TGDevice.MSG_EEG_POWER:
                    TGEegPower power = (TGEegPower)msg.obj;
                    if (power != null) {
                        WritableMap eegParams = Arguments.createMap();
                        eegParams.putInt("delta", power.delta);
                        eegParams.putInt("theta", power.theta);
                        eegParams.putInt("lowAlpha", power.lowAlpha);
                        eegParams.putInt("highAlpha", power.highAlpha);
                        eegParams.putInt("lowBeta", power.lowBeta);
                        eegParams.putInt("highBeta", power.highBeta);
                        eegParams.putInt("lowGamma", power.lowGamma);
                        eegParams.putInt("midGamma", power.midGamma);

                        // 輸出所有 EEG 參數
                        // Log.d("NeuroSky", String.format(
                        //     "EEG Power - delta: %d, theta: %d, lowAlpha: %d, highAlpha: %d, " +
                        //     "lowBeta: %d, highBeta: %d, lowGamma: %d, midGamma: %d",
                        //     power.delta, power.theta, power.lowAlpha, power.highAlpha,
                        //     power.lowBeta, power.highBeta, power.lowGamma, power.midGamma
                        // ));

                        sendEvent("onEegPower", eegParams);
                    }
                    break;

                default:
                    break;
            }
            return true;
        }
    };

    private void resetRetryParams() {
        retryCount = 0;
        currentRetryDelay = INITIAL_RETRY_DELAY_MS;
        isRetrying = false;
        if (retryRunnable != null) {
            retryHandler.removeCallbacks(retryRunnable);
        }
    }

    private void scheduleRetry() {
        if (retryCount >= MAX_RETRY_COUNT) {
            Log.i(TAG, "已達到最大重試次數，停止重試");
            resetRetryParams();
            return;
        }

        if (isRetrying) {
            return;  // 已經在重試中
        }

        isRetrying = true;
        retryCount++;
        
        // 使用指數退避策略增加重試間隔
        currentRetryDelay = Math.min(currentRetryDelay * 2, MAX_RETRY_DELAY_MS);
        
        Log.i(TAG, "安排第 " + retryCount + " 次重試，延遲: " + currentRetryDelay + "ms");
        
        retryRunnable = new Runnable() {
            @Override
            public void run() {
                isRetrying = false;
                connect();  // 重試連接
            }
        };
        
        retryHandler.postDelayed(retryRunnable, currentRetryDelay);
    }

    @ReactMethod
    public void connect() {
        if (isConnected && tgDevice != null) {
            WritableMap params = Arguments.createMap();
            params.putString("state", "CONNECTED");
            sendEvent("onStateChange", params);
            return;
        }

        // 檢查藍牙權限
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!checkBluetoothPermissions()) {
                requestBluetoothPermissions();
                return;
            }
        }

        try {
            if (bluetoothAdapter == null) {
                bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
            }

            if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
                WritableMap params = Arguments.createMap();
                params.putString("error", "藍牙未啟用");
                sendEvent("onError", params);
                return;
            }

            // 優先使用保存的設備地址
            if (lastSuccessfulAddress != null) {
                try {
                    BluetoothDevice device = bluetoothAdapter.getRemoteDevice(lastSuccessfulAddress);
                    if (device != null) {
                        Log.i(TAG, "使用保存的設備地址連接: " + lastSuccessfulAddress);
                        connectToDevice(device);
                        return;
                    }
                } catch (Exception e) {
                    Log.e(TAG, "使用保存的地址連接失敗: " + e.getMessage());
                    // 如果使用保存的地址失敗，清除它
                    clearSavedAddress();
                }
            }

            // 如果沒有保存的地址或連接失敗，則搜索設備
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            BluetoothDevice targetDevice = null;

            // 先找名稱完全匹配的設備
            for (BluetoothDevice device : pairedDevices) {
                if (device.getName() != null && device.getName().equals(TARGET_DEVICE_NAME)) {
                    targetDevice = device;
                    break;
                }
            }

            // 如果沒找到完全匹配的，再找包含目標名稱的設備
            if (targetDevice == null) {
                for (BluetoothDevice device : pairedDevices) {
                    if (device.getName() != null && device.getName().contains(TARGET_DEVICE_NAME)) {
                        targetDevice = device;
                        break;
                    }
                }
            }

            if (targetDevice == null) {
                WritableMap params = Arguments.createMap();
                params.putString("error", "找不到 Alchemy 設備，請確保已配對");
                sendEvent("onError", params);
                scheduleRetry();
                return;
            }

            connectToDevice(targetDevice);

        } catch (Exception e) {
            Log.e(TAG, "連接時發生錯誤: " + e.getMessage());
            WritableMap params = Arguments.createMap();
            params.putString("error", "連接時發生錯誤: " + e.getMessage());
            sendEvent("onError", params);
            scheduleRetry();
        }
    }

    private void connectToDevice(BluetoothDevice device) {
        try {
            // 重置重試參數
            resetRetryParams();

            // 如果已有設備實例，先關閉
            if (tgDevice != null) {
                tgDevice.close();
                tgDevice = null;
            }

            // 記錄當前連接的設備
            lastConnectedDevice = device;
            
            // 創建新的 TGDevice 並連接
            tgDevice = new TGDevice(bluetoothAdapter, handler);
            tgDevice.connect(false);

            WritableMap params = Arguments.createMap();
            params.putString("state", "CONNECTING");
            sendEvent("onStateChange", params);
            
            Log.i(TAG, "正在連接到設備: " + device.getName() + " (" + device.getAddress() + ")");
            
        } catch (Exception e) {
            Log.e(TAG, "連接設備失敗: " + e.getMessage());
            WritableMap params = Arguments.createMap();
            params.putString("error", "連接設備失敗: " + e.getMessage());
            sendEvent("onError", params);
            scheduleRetry();
        }
    }

    @ReactMethod
    public void disconnect() {
        resetRetryParams();  // 手動斷開時重置重試參數
        if (tgDevice != null) {
            tgDevice.close();
            tgDevice = null;
        }
        isConnected = false;
        WritableMap params = Arguments.createMap();
        params.putString("state", "DISCONNECTED");
        sendEvent("onStateChange", params);
    }

    @ReactMethod
    public void getConnectionStatus(Promise promise) {
        try {
            WritableMap status = Arguments.createMap();
            status.putBoolean("isConnected", isConnected);
            status.putBoolean("hasDevice", tgDevice != null);
            promise.resolve(status);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    // 添加清除保存地址的方法
    private void clearSavedAddress() {
        lastSuccessfulAddress = null;
        SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(LAST_DEVICE_ADDRESS).apply();
        Log.i(TAG, "清除保存的設備地址");
    }

    // 檢查藍牙權限
    private boolean checkBluetoothPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ContextCompat.checkSelfPermission(reactContext, Manifest.permission.BLUETOOTH_CONNECT) 
                == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    // 請求藍牙權限
    private void requestBluetoothPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // 發送權限錯誤
            WritableMap errorParams = Arguments.createMap();
            errorParams.putString("error", "需要藍牙權限");
            sendEvent("onError", errorParams);

            // 更新連接狀態
            WritableMap stateParams = Arguments.createMap();
            stateParams.putString("state", "NO_PERMISSION");
            sendEvent("onStateChange", stateParams);

            Activity activity = getCurrentActivity();
            if (activity != null) {
                ActivityCompat.requestPermissions(
                    activity,
                    new String[]{
                        Manifest.permission.BLUETOOTH_CONNECT,
                        Manifest.permission.BLUETOOTH_SCAN
                    },
                    PERMISSION_REQUEST_CODE
                );
            }
        }
    }

    // 處理權限請求結果
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // 權限已獲得，重新嘗試連接
                connect();
            } else {
                // 權限被拒絕，發送錯誤和狀態更新
                WritableMap errorParams = Arguments.createMap();
                errorParams.putString("error", "藍牙權限被拒絕，無法連接設備");
                sendEvent("onError", errorParams);

                // 更新連接狀態
                WritableMap stateParams = Arguments.createMap();
                stateParams.putString("state", "NO_PERMISSION");
                sendEvent("onStateChange", stateParams);
            }
        }
    }
}
