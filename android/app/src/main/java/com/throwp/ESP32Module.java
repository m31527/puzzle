package com.throwp;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.UiThreadUtil;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class ESP32Module extends ReactContextBaseJavaModule {
    private static final String TAG = "ESP32Module";
    private static final String ESP32_NAME = "Alchemy_TP";
    // 更新為短 UUID
    private static final UUID SERVICE_UUID = UUID.fromString("0000FFE0-0000-1000-8000-00805F9B34FB");
    private static final UUID CHARACTERISTIC_UUID = UUID.fromString("0000FFE1-0000-1000-8000-00805F9B34FB");
    private static final UUID DESCRIPTOR_UUID = UUID.fromString("00002902-0000-1000-8000-00805F9B34FB");

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner bluetoothLeScanner;
    private BluetoothGatt bluetoothGatt;
    private Handler handler;
    private boolean isScanning = false;
    private boolean deviceConnected = false;

    // 用於檢查短 UUID
    private String getShortUUID(String uuid) {
        return uuid.substring(4, 8);
    }

    private boolean matchesShortUUID(String fullUUID, String shortUUID) {
        return getShortUUID(fullUUID).equalsIgnoreCase(shortUUID);
    }

    public ESP32Module(ReactApplicationContext reactContext) {
        super(reactContext);
        
        // 在主線程上創建 Handler
        handler = new Handler(Looper.getMainLooper());
        
        // 初始化藍牙適配器
        BluetoothManager bluetoothManager = (BluetoothManager) reactContext.getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager != null) {
            bluetoothAdapter = bluetoothManager.getAdapter();
            if (bluetoothAdapter != null) {
                bluetoothLeScanner = bluetoothAdapter.getBluetoothLeScanner();
                Log.d(TAG, "藍牙初始化成功");
            } else {
                Log.e(TAG, "無法獲取藍牙適配器");
            }
        } else {
            Log.e(TAG, "無法獲取藍牙管理器");
        }
    }

    @Override
    public String getName() {
        return "ESP32Module";
    }

    // 添加必要的事件監聽方法
    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built in Event Emitter Calls
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built in Event Emitter Calls
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    // BLE 掃描回調
    private ScanCallback scanCallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            BluetoothDevice device = result.getDevice();
            String deviceName = device.getName();
            String deviceAddress = device.getAddress();
            
            // 記錄所有掃描到的設備
            // Log.d(TAG, "----------------------------------------");
            // Log.d(TAG, String.format("掃描到設備 - 名稱: %s, 地址: %s, RSSI: %d", 
            //     deviceName != null ? deviceName : "未知", 
            //     deviceAddress, 
            //     result.getRssi()));
            
            // 檢查廣播數據
            ScanRecord scanRecord = result.getScanRecord();
            if (scanRecord != null) {
                String advertisedName = scanRecord.getDeviceName();
                //Log.d(TAG, "設備名稱(從廣播): " + (advertisedName != null ? advertisedName : "未知"));
                
                // 打印完整的廣播數據
                byte[] rawBytes = scanRecord.getBytes();
                if (rawBytes != null) {
                    //Log.d(TAG, "完整廣播數據: " + bytesToHex(rawBytes));
                    // 解析廣播數據包
                    int offset = 0;
                    while (offset < rawBytes.length) {
                        int length = rawBytes[offset] & 0xFF;
                        if (length == 0) break;
                        
                        if (offset + length + 1 > rawBytes.length) break;
                        
                        int type = rawBytes[offset + 1] & 0xFF;
                        byte[] data = new byte[length - 1];
                        System.arraycopy(rawBytes, offset + 2, data, 0, length - 1);
                        
                        // Log.d(TAG, String.format("廣播包 - 類型: 0x%02X, 長度: %d, 數據: %s",
                        //     type, length - 1, bytesToHex(data)));
                        
                        offset += length + 1;
                    }
                }
                
                // 打印所有服務 UUID
                List<ParcelUuid> serviceUuids = scanRecord.getServiceUuids();
                if (serviceUuids != null) {
                    for (ParcelUuid uuid : serviceUuids) {
                        String uuidString = uuid.toString().toUpperCase();
                        //Log.d(TAG, "服務 UUID: " + uuidString + " (短 UUID: " + getShortUUID(uuidString) + ")");
                        
                        // 檢查是否匹配目標服務（使用短 UUID）
                        if (matchesShortUUID(uuidString, "FFE0")) {
                            Log.i(TAG, "找到匹配的服務 UUID!");
                            stopScan();
                            connectToDevice(device);
                            return;
                        }
                    }
                }
                
                // 打印所有製造商數據
                android.util.SparseArray<byte[]> manufacturerData = scanRecord.getManufacturerSpecificData();
                if (manufacturerData != null) {
                    for (int i = 0; i < manufacturerData.size(); i++) {
                        int manufacturerId = manufacturerData.keyAt(i);
                        byte[] data = manufacturerData.valueAt(i);
                        // Log.d(TAG, String.format("製造商ID: 0x%04X, 數據: %s", 
                        //     manufacturerId, 
                        //     bytesToHex(data)));
                    }
                }
            }
            
            // 檢查設備名稱匹配
            boolean nameMatches = ESP32_NAME.equals(deviceName) || 
                                (deviceName == null && scanRecord != null && ESP32_NAME.equals(scanRecord.getDeviceName()));
            
            if (nameMatches) {
                Log.i(TAG, "找到目標設備（通過名稱匹配）!");
                stopScan();
                connectToDevice(device);
                return;
            }
            
            Log.d(TAG, "----------------------------------------");
        }

        @Override
        public void onScanFailed(int errorCode) {
            String errorMessage;
            switch (errorCode) {
                case SCAN_FAILED_ALREADY_STARTED:
                    errorMessage = "掃描已經在進行中";
                    break;
                case SCAN_FAILED_APPLICATION_REGISTRATION_FAILED:
                    errorMessage = "應用註冊失敗";
                    break;
                case SCAN_FAILED_FEATURE_UNSUPPORTED:
                    errorMessage = "不支持此功能";
                    break;
                case SCAN_FAILED_INTERNAL_ERROR:
                    errorMessage = "內部錯誤";
                    break;
                default:
                    errorMessage = "未知錯誤: " + errorCode;
            }
            Log.e(TAG, "掃描失敗: " + errorMessage);
            WritableMap params = Arguments.createMap();
            params.putString("error", "掃描失敗: " + errorMessage);
            sendEvent("onESP32Error", params);
        }
    };
    
    private String bytesToHex(byte[] bytes) {
        if (bytes == null) return "null";
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString();
    }

    private void connectToDevice(BluetoothDevice device) {
        Log.d(TAG, "正在連接到設備: " + device.getName() + " (" + device.getAddress() + ")");
        
        // 先斷開現有連接
        if (bluetoothGatt != null) {
            Log.d(TAG, "關閉現有的 GATT 連接");
            bluetoothGatt.close();
            bluetoothGatt = null;
        }

        // 檢查設備狀態
        int bondState = device.getBondState();
        Log.d(TAG, "設備配對狀態: " + bondState);
        
        // 使用 TRANSPORT_LE 參數確保使用 BLE 連接
        bluetoothGatt = device.connectGatt(getReactApplicationContext(), false, gattCallback, BluetoothDevice.TRANSPORT_LE);
        
        if (bluetoothGatt == null) {
            Log.e(TAG, "connectGatt 返回 null");
            WritableMap params = Arguments.createMap();
            params.putString("error", "無法創建 GATT 連接");
            sendEvent("onESP32Error", params);
            return;
        }
        
        // 設置連接超時
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (bluetoothGatt != null && !deviceConnected) {
                    Log.e(TAG, "連接超時");
                    disconnectGatt();
                    WritableMap params = Arguments.createMap();
                    params.putString("error", "連接超時");
                    sendEvent("onESP32Error", params);
                    
                    // 重新開始掃描
                    handler.postDelayed(() -> {
                        Log.d(TAG, "重新開始掃描...");
                        startScan();
                    }, 1000);
                }
            }
        }, 10000);  // 10 秒超時
    }

    // GATT 回調
    private final BluetoothGattCallback gattCallback = new BluetoothGattCallback() {
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            Log.d(TAG, "連接狀態改變: status=" + status + ", newState=" + newState);
            
            WritableMap params = Arguments.createMap();
            
            if (status == BluetoothGatt.GATT_SUCCESS) {
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    deviceConnected = true;
                    Log.i(TAG, "成功連接到GATT服務器");
                    params.putString("status", "CONNECTED");
                    sendEvent("onESP32Connected", params);
                    
                    // 開始發現服務
                    handler.post(() -> {
                        if (bluetoothGatt != null) {
                            Log.d(TAG, "開始發現服務...");
                            bluetoothGatt.discoverServices();
                        }
                    });
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    deviceConnected = false;
                    Log.i(TAG, "與GATT服務器斷開連接");
                    params.putString("status", "DISCONNECTED");
                    sendEvent("onESP32Connected", params);
                    disconnectGatt();
                }
            } else {
                deviceConnected = false;
                Log.e(TAG, "連接狀態改變出錯，status: " + status);
                params.putString("status", "DISCONNECTED");
                sendEvent("onESP32Connected", params);
                disconnectGatt();
                
                // 重新嘗試連接
                handler.postDelayed(() -> connect(), 1000);
            }
        }

        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            Log.d(TAG, "服務發現完成: status=" + status);
            
            if (status == BluetoothGatt.GATT_SUCCESS) {
                BluetoothGattService service = gatt.getService(SERVICE_UUID);
                if (service != null) {
                    Log.d(TAG, "找到目標服務: " + service.getUuid());
                    BluetoothGattCharacteristic characteristic = 
                        service.getCharacteristic(CHARACTERISTIC_UUID);
                    if (characteristic != null) {
                        Log.d(TAG, "找到目標特徵: " + characteristic.getUuid());
                        // 啟用通知
                        boolean success = gatt.setCharacteristicNotification(characteristic, true);
                        Log.d(TAG, "設置通知結果: " + success);
                        
                        BluetoothGattDescriptor descriptor = characteristic.getDescriptor(DESCRIPTOR_UUID);
                        if (descriptor != null) {
                            Log.d(TAG, "找到描述符: " + descriptor.getUuid());
                            descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                            boolean writeSuccess = gatt.writeDescriptor(descriptor);
                            Log.d(TAG, "寫入描述符結果: " + writeSuccess);
                        } else {
                            Log.e(TAG, "未找到描述符");
                        }
                    } else {
                        Log.e(TAG, "未找到目標特徵");
                    }
                } else {
                    Log.e(TAG, "未找到目標服務");
                    // 列出所有可用服務
                    List<BluetoothGattService> services = gatt.getServices();
                    Log.d(TAG, "可用服務列表:");
                    for (BluetoothGattService s : services) {
                        Log.d(TAG, "服務 UUID: " + s.getUuid());
                    }
                }
            } else {
                Log.e(TAG, "服務發現失敗: " + status);
            }
        }

        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt, 
                                          BluetoothGattCharacteristic characteristic) {
            byte[] data = characteristic.getValue();
            String jsonString = new String(data);
            Log.d(TAG, "收到數據: " + jsonString);
            
            WritableMap params = Arguments.createMap();
            params.putString("data", jsonString);
            sendEvent("onESP32Data", params);
        }
        
        @Override
        public void onDescriptorWrite(BluetoothGatt gatt, BluetoothGattDescriptor descriptor, int status) {
            Log.d(TAG, "描述符寫入完成: status=" + status);
            if (status == BluetoothGatt.GATT_SUCCESS) {
                Log.d(TAG, "通知已成功啟用");
            } else {
                Log.e(TAG, "通知啟用失敗");
            }
        }
    };

    private void stopScan() {
        if (isScanning && bluetoothLeScanner != null) {
            isScanning = false;
            bluetoothLeScanner.stopScan(scanCallback);
        }
    }

    private void disconnectGatt() {
        if (bluetoothGatt != null) {
            bluetoothGatt.disconnect();
            bluetoothGatt.close();
            bluetoothGatt = null;
        }
    }

    private boolean checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return getReactApplicationContext().checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED &&
                   getReactApplicationContext().checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED &&
                   getReactApplicationContext().checkSelfPermission(Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED;
        } else {
            return getReactApplicationContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
                   getReactApplicationContext().checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
    }

    @ReactMethod
    public void connect() {
        Log.d(TAG, "開始連接程序");
        
        // 檢查權限
        if (!checkPermissions()) {
            Log.e(TAG, "缺少必要權限");
            WritableMap params = Arguments.createMap();
            params.putString("error", "缺少必要權限");
            sendEvent("onESP32Error", params);
            return;
        }

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            Log.e(TAG, "藍牙未啟用");
            WritableMap params = Arguments.createMap();
            params.putString("error", "藍牙未啟用");
            sendEvent("onESP32Error", params);
            return;
        }

        // 發送連接中狀態
        WritableMap params = Arguments.createMap();
        params.putString("status", "CONNECTING");
        sendEvent("onESP32Connected", params);

        // 先檢查已配對設備
        Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
        BluetoothDevice targetDevice = null;
        
        for (BluetoothDevice device : pairedDevices) {
            String deviceName = device.getName();
            if (deviceName != null && deviceName.equals(ESP32_NAME)) {
                Log.d(TAG, "找到已配對的目標設備: " + deviceName);
                targetDevice = device;
                break;
            }
        }

        if (targetDevice != null) {
            // 如果找到已配對設備，直接連接
            connectToDevice(targetDevice);
        } else {
            // 如果沒有找到已配對設備，才開始掃描
            startScan();
        }
    }

    private void startScan() {
        // 斷開現有連接
        disconnectGatt();

        // 開始掃描
        bluetoothLeScanner = bluetoothAdapter.getBluetoothLeScanner();
        if (bluetoothLeScanner != null) {
            Log.d(TAG, "開始掃描設備");
            
            // 設置掃描過濾器 - 暫時移除過濾器以查看所有設備
            List<ScanFilter> filters = new ArrayList<>();
            
            // 設置掃描設置為低延遲模式
            ScanSettings settings = new ScanSettings.Builder()
                    .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                    .setReportDelay(0)
                    .build();

            isScanning = true;
            bluetoothLeScanner.startScan(null, settings, scanCallback);  // 使用 null 過濾器查看所有設備

            // 10秒後停止掃描
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    if (isScanning) {
                        Log.d(TAG, "掃描超時，停止掃描");
                        stopScan();
                        // 重新開始掃描
                        handler.postDelayed(() -> {
                            Log.d(TAG, "重新開始掃描...");
                            connect();
                        }, 1000);
                    }
                }
            }, 10000);
        } else {
            Log.e(TAG, "無法初始化藍牙掃描器");
            WritableMap errorParams = Arguments.createMap();
            errorParams.putString("error", "無法初始化藍牙掃描器");
            sendEvent("onESP32Error", errorParams);
        }
    }

    @ReactMethod
    public void disconnect() {
        if (bluetoothGatt != null) {
            bluetoothGatt.disconnect();
            bluetoothGatt.close();
            bluetoothGatt = null;
        }
        
        WritableMap params = Arguments.createMap();
        params.putString("status", "DISCONNECTED");
        sendEvent("onESP32Connected", params);
    }
}