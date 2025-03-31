import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Platform, NativeEventEmitter, ImageBackground, TextInput, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TestDataGenerator from './TestDataGenerator';
import { TestProvider } from './contexts/TestContext';

// 使用 require 直接導入原生模組
const NeuroSkyModule = require('react-native').NativeModules.NeuroSkyModule;
// const ESP32Module = require('react-native').NativeModules.ESP32Module;

if (!NeuroSkyModule) {
    console.error('NeuroSkyModule is not available');
}

// if (!ESP32Module) {
//     console.error('ESP32Module is not available');
// }

// 創建事件發射器
const neuroSkyEmitter = new NativeEventEmitter(NeuroSkyModule);
// const esp32Emitter = new NativeEventEmitter(ESP32Module);

const Home = () => {
    const navigation = useNavigation();
    const [thinkGearStatus, setThinkGearStatus] = useState('未連接');
    // const [esp32Status, setEsp32Status] = useState('未連接');
    const [attention, setAttention] = useState(0);
    // const [esp32Data, setEsp32Data] = useState(null);
    const [userName, setUserName] = useState('受試者');
    const [isTestMode, setIsTestMode] = useState(false);
    const [testGenerator, setTestGenerator] = useState(null);

    useEffect(() => {
        const subscriptions = [];

        if (NeuroSkyModule) {
            // ThinkGear 事件監聽
            subscriptions.push(
                neuroSkyEmitter.addListener('onStateChange', (event) => {
                    console.log('ThinkGear 狀態變更:', event.state);
                    switch (event.state) {
                        case 'CONNECTED':
                            setThinkGearStatus('已連接');
                            break;
                        case 'DISCONNECTED':
                            setThinkGearStatus('未連接');
                            break;
                        case 'CONNECTING':
                            setThinkGearStatus('連線中...');
                            break;
                        case 'POOR_SIGNAL':
                            setThinkGearStatus('訊號不良');
                            break;
                        case 'NO_PERMISSION':
                            setThinkGearStatus('需要藍牙權限');
                            break;
                    }
                })
            );

            subscriptions.push(
                neuroSkyEmitter.addListener('onSignalChange', (event) => {
                    if (event.signal === 'ATTENTION') {
                        setAttention(event.value);
                    }
                })
            );

            subscriptions.push(
                neuroSkyEmitter.addListener('onError', (event) => {
                    console.log('ThinkGear 錯誤:', event.error);
                })
            );
        }

        // if (ESP32Module) {
        //     // ESP32 事件監聽
        //     subscriptions.push(
        //         esp32Emitter.addListener('onESP32Data', (event) => {
        //             try {
        //                 const rawData = event.data;
        //                 const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        //                 
        //                 if (data.cast === true || data.castbig === true) {
        //                     setEsp32Data(data);
        //                     console.log('Home - 更新 ESP32 狀態:', data);
        //                     
        //                     // 轉發事件到 Evaluate
        //                     DeviceEventEmitter.emit('onESP32Data', event);
        //                     console.log('Home - 轉發事件到 Evaluate');
        //                 }
        //             } catch (error) {
        //                 console.log('Home - 解析 ESP32 數據錯誤:', error);
        //             }
        //         })
        //     );

        //     subscriptions.push(
        //         esp32Emitter.addListener('onESP32Connected', (event) => {
        //             console.log('ESP32 狀態變更:', event.status);
        //             switch (event.status) {
        //                 case 'CONNECTED':
        //                     setEsp32Status('已連接');
        //                     break;
        //                 case 'DISCONNECTED':
        //                     setEsp32Status('未連接');
        //                     break;
        //                 case 'CONNECTING':
        //                     setEsp32Status('連線中...');
        //                     break;
        //             }
        //         })
        //     );

        //     subscriptions.push(
        //         esp32Emitter.addListener('onESP32Error', (event) => {
        //             console.log('ESP32 錯誤:', event.error);
        //             setEsp32Status('連接錯誤');
        //         })
        //     );
        // }

        // 開始連接設備
        const connectDevices = async () => {
            try {
                if (NeuroSkyModule) {
                    console.log('開始連接 ThinkGear...');
                    await NeuroSkyModule.connect();
                }
                // if (ESP32Module) {
                //     console.log('開始連接 ESP32...');
                //     await ESP32Module.connect();
                // }
            } catch (error) {
                console.error('連接設備錯誤:', error);
            }
        };

        connectDevices();

        // 清理訂閱
        return () => {
            subscriptions.forEach(subscription => subscription.remove());
            if (NeuroSkyModule) NeuroSkyModule.disconnect();
            // if (ESP32Module) ESP32Module.disconnect();
        };
    }, []);

    // 切換測試模式
    const toggleTestMode = () => {
        if (isTestMode) {
            // 關閉測試模式
            if (testGenerator) {
                testGenerator.stopSimulation();
                setTestGenerator(null);
            }
        } else {
            try {
                // 開啟測試模式
                const generator = new TestDataGenerator();
                if (generator) {
                    setupTestGenerator(generator);
                    generator.startSimulation();
                    setTestGenerator(generator);
                }
            } catch (error) {
                console.error('創建測試生成器錯誤:', error);
            }
        }
        setIsTestMode(!isTestMode);
    };

    // 設置測試數據生成器
    const setupTestGenerator = (generator) => {
        generator.setListener('onStateChange', (event) => {
            console.log('ThinkGear 狀態變更:', event.state);
            switch (event.state) {
                case 'CONNECTED':
                    setThinkGearStatus('已連接');
                    break;
                case 'DISCONNECTED':
                    setThinkGearStatus('未連接');
                    break;
                case 'CONNECTING':
                    setThinkGearStatus('連線中...');
                    break;
                case 'POOR_SIGNAL':
                    setThinkGearStatus('訊號不良');
                    break;
                case 'NO_PERMISSION':
                    setThinkGearStatus('需要藍牙權限');
                    break;
            }
        });

        generator.setListener('onSignalChange', (event) => {
            if (event.signal === 'ATTENTION') {
                setAttention(event.value);
            }
        });

        // generator.setListener('onESP32Connected', (event) => {
        //     console.log('ESP32 狀態變更:', event.status);
        //     switch (event.status) {
        //         case 'CONNECTED':
        //             setEsp32Status('已連接');
        //             break;
        //         case 'DISCONNECTED':
        //             setEsp32Status('未連接');
        //             break;
        //         case 'CONNECTING':
        //             setEsp32Status('連線中...');
        //             break;
        //     }
        // });

        // generator.setListener('onESP32Data', (event) => {
        //     try {
        //         const data = JSON.parse(event.data);
        //         if (data.cast === true || data.castbig === true) {
        //             setEsp32Data(data);
        //             console.log('收到 ESP32 投擲數據:', data);
        //         }
        //     } catch (error) {
        //         console.error('解析 ESP32 數據錯誤:', error);
        //     }
        // });
    };

    // 點擊開始按鈕執行的函數
    const handleStart = () => {
        navigation.navigate('Evaluate', { 
            userName,
            isTestMode 
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case '已連接':
                return '#4CAF50'; // 綠色
            case '連線中...':
                return '#FFA500'; // 橘色
            case '未連接':
                return '#FF0000'; // 紅色
            case '訊號不良':
                return '#FF9800'; // 深橘色
            case '需要藍牙權限':
                return '#FF9800'; // 深橘色
            default:
                return '#fff';
        }
    };

    // 只檢查 ThinkGear 是否連接
    const canStart = thinkGearStatus === '已連接';

    return (
        <TestProvider testGenerator={testGenerator}>
            <View style={styles.container}>
                <ImageBackground
                    source={require('../assets/img/background.png')}
                    style={styles.background}>
                    {/* <View style={styles.header}>
                        <TouchableOpacity 
                            style={[styles.testModeButton, isTestMode && styles.testModeButtonActive]}
                            onPress={toggleTestMode}
                        >
                            <Text style={styles.testModeButtonText}>
                                {isTestMode ? '關閉測試模式' : '開啟測試模式'}
                            </Text>
                        </TouchableOpacity>
                    </View> */}

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>益智积木脑里评测</Text>
                        <Image
                            source={require('../assets/img/main.png')}
                            style={styles.mainImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.statusContainer}>
                        <View style={styles.deviceStatus}>
                            <Text style={styles.deviceLabel}>腦波儀狀態:</Text>
                            <Text style={[styles.statusText, { color: getStatusColor(thinkGearStatus) }]}>
                                {thinkGearStatus}
                            </Text>
                            {thinkGearStatus === '已連接' && (
                                <Text style={styles.attentionText}>專注度: {attention}%</Text>
                            )}
                        </View>

                        {/* <View style={styles.deviceStatus}>
                            <Text style={styles.deviceLabel}>投壺狀態:</Text>
                            <Text style={[styles.statusText, { color: getStatusColor(esp32Status) }]}>
                                {esp32Status}
                            </Text>
                        </View> */}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>姓名：</Text>
                        <TextInput
                            style={styles.input}
                            value={userName}
                            onChangeText={setUserName}
                            placeholder="請輸入姓名"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.startButton}
                            onPress={handleStart}
                            disabled={!canStart}
                        >
                            <ImageBackground
                                source={require('../assets/img/btn.png')}
                                style={styles.startButtonImage}
                                resizeMode="stretch"
                            >
                                <Text style={styles.startButtonText}>開始</Text>
                            </ImageBackground>
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
            </View>
        </TestProvider>
    );
};

export default Home;

const styles = StyleSheet.create({
    buttonContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        position: 'absolute',
        top: 50,
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 40,
        color: '#1D417D',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
        marginBottom: 20,
    },
    mainImage: {
        width: 300,
        height: 300,
    },
    statusContainer: {
        marginTop: 250,
        position: 'relative',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deviceStatus: {
        marginVertical: 10,
        alignItems: 'center',
    },
    deviceLabel: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 5,
    },
    attentionText: {
        fontSize: 16,
        color: '#fff',
        marginTop: 10,
    },
    esp32DataText: {
        fontSize: 16,
        color: '#fff',
        marginTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        width: '80%',
        alignSelf: 'center',
    },
    label: {
        fontSize: 18,
        color: '#333',
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    startButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 120,
    },
    puzzleButton: {
        width: '80%',
    },
    startButtonImage: {
        width: 120,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    startButtonDisabled: {
        backgroundColor: '#999',
        borderColor: '#666',
    },
    startButtonText: {
        fontSize: 20,
        color: '#1D417D',
        fontWeight: 'bold',
        // textShadowColor: 'rgba(0, 0, 0, 0.75)',
        // textShadowOffset: { width: 2, height: 2 },
        // textShadowRadius: 3,
    },
    testModeButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginLeft: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    testModeButtonActive: {
        backgroundColor: '#f44336',
    },
    testModeButtonText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
    },
});
