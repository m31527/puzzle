import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    NativeModules, 
    Platform, 
    NativeEventEmitter, 
    ImageBackground, 
    TextInput, 
    Image,
    Alert,
    PermissionsAndroid
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TestDataGenerator from './TestDataGenerator';
import { TestProvider } from './contexts/TestContext';

// 使用 require 直接导入原生模块
const NeuroSkyModule = require('react-native').NativeModules.NeuroSkyModule;
// const ESP32Module = require('react-native').NativeModules.ESP32Module;

if (!NeuroSkyModule) {
    console.error('NeuroSkyModule is not available');
}

// if (!ESP32Module) {
//     console.error('ESP32Module is not available');
// }

// 创建事件发射器
const neuroSkyEmitter = new NativeEventEmitter(NeuroSkyModule);
// const esp32Emitter = new NativeEventEmitter(ESP32Module);

const Home = () => {
    const navigation = useNavigation();
    const [thinkGearStatus, setThinkGearStatus] = useState('未连接');
    // const [esp32Status, setEsp32Status] = useState('未连接');
    const [attention, setAttention] = useState(0);
    // const [esp32Data, setEsp32Data] = useState(null);
    const [userName, setUserName] = useState('受试者');
    const [isTestMode, setIsTestMode] = useState(false);
    const [testGenerator, setTestGenerator] = useState(null);

    // 请求蓝牙权限
    const requestBluetoothPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
                ]);
                
                const allPermissionsGranted = Object.values(granted).every(
                    status => status === PermissionsAndroid.RESULTS.GRANTED
                );
                
                if (allPermissionsGranted) {
                    console.log('所有蓝牙相关权限已授予');
                    return true;
                } else {
                    console.log('部分权限被拒绝:', granted);
                    Alert.alert(
                        '权限被拒绝',
                        '需要蓝牙和位置权限才能连接设备。请在设置中允许这些权限。',
                        [{ text: '确定', onPress: () => console.log('用户确认权限提示') }]
                    );
                    return false;
                }
            } catch (error) {
                console.error('请求权限时发生错误:', error);
                return false;
            }
        }
        return true; // iOS 暂不需要显式请求权限
    };

    useEffect(() => {
        const subscriptions = [];

        // 在组件加载时立即请求蓝牙权限
        requestBluetoothPermissions().then(permissionsGranted => {
            if (permissionsGranted && NeuroSkyModule) {
                // ThinkGear 事件监听
                subscriptions.push(
                    neuroSkyEmitter.addListener('onStateChange', (event) => {
                        console.log('ThinkGear 状态变更:', event.state);
                        switch (event.state) {
                            case 'CONNECTED':
                                setThinkGearStatus('已连接');
                                break;
                            case 'DISCONNECTED':
                                setThinkGearStatus('未连接');
                                break;
                            case 'CONNECTING':
                                setThinkGearStatus('连接中...');
                                break;
                            case 'POOR_SIGNAL':
                                setThinkGearStatus('信号不良');
                                break;
                            case 'NO_PERMISSION':
                                setThinkGearStatus('需要蓝牙权限');
                                // 如果收到权限错误，再次请求权限
                                requestBluetoothPermissions();
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
                        console.log('ThinkGear 错误:', event.error);
                    })
                );
            }
        });

        // if (ESP32Module) {
        //     // ESP32 事件监听
        //     subscriptions.push(
        //         esp32Emitter.addListener('onESP32Data', (event) => {
        //             try {
        //                 const rawData = event.data;
        //                 const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        //                 
        //                 if (data.cast === true || data.castbig === true) {
        //                     setEsp32Data(data);
        //                     console.log('Home - 更新 ESP32 状态:', data);
        //                     
        //                     // 转发事件到 Evaluate
        //                     DeviceEventEmitter.emit('onESP32Data', event);
        //                     console.log('Home - 转发事件到 Evaluate');
        //                 }
        //             } catch (error) {
        //                 console.log('Home - 解析 ESP32 数据错误:', error);
        //             }
        //         })
        //     );

        //     subscriptions.push(
        //         esp32Emitter.addListener('onESP32Connected', (event) => {
        //             console.log('ESP32 状态变更:', event.status);
        //             switch (event.status) {
        //                 case 'CONNECTED':
        //                     setEsp32Status('已连接');
        //                     break;
        //                 case 'DISCONNECTED':
        //                     setEsp32Status('未连接');
        //                     break;
        //                 case 'CONNECTING':
        //                     setEsp32Status('连接中...');
        //                     break;
        //             }
        //         })
        //     );

        //     subscriptions.push(
        //         esp32Emitter.addListener('onESP32Error', (event) => {
        //             console.log('ESP32 错误:', event.error);
        //             setEsp32Status('连接错误');
        //         })
        //     );
        // }

        // 开始连接设备
        const connectDevices = async () => {
            try {
                if (NeuroSkyModule) {
                    console.log('开始连接 ThinkGear...');
                    await NeuroSkyModule.connect();
                }
                // if (ESP32Module) {
                //     console.log('开始连接 ESP32...');
                //     await ESP32Module.connect();
                // }
            } catch (error) {
                console.error('连接设备错误:', error);
            }
        };

        connectDevices();

        // 清理订阅
        return () => {
            subscriptions.forEach(subscription => subscription.remove());
            if (NeuroSkyModule) NeuroSkyModule.disconnect();
            // if (ESP32Module) ESP32Module.disconnect();
        };
    }, []);

    // 切换测试模式
    const toggleTestMode = () => {
        if (isTestMode) {
            // 关闭测试模式
            if (testGenerator) {
                testGenerator.stopSimulation();
                setTestGenerator(null);
            }
        } else {
            try {
                // 开启测试模式
                const generator = new TestDataGenerator();
                if (generator) {
                    setupTestGenerator(generator);
                    generator.startSimulation();
                    setTestGenerator(generator);
                }
            } catch (error) {
                console.error('创建测试生成器错误:', error);
            }
        }
        setIsTestMode(!isTestMode);
    };

    // 设置测试数据生成器
    const setupTestGenerator = (generator) => {
        generator.setListener('onStateChange', (event) => {
            console.log('ThinkGear 状态变更:', event.state);
            switch (event.state) {
                case 'CONNECTED':
                    setThinkGearStatus('已连接');
                    break;
                case 'DISCONNECTED':
                    setThinkGearStatus('未连接');
                    break;
                case 'CONNECTING':
                    setThinkGearStatus('连接中...');
                    break;
                case 'POOR_SIGNAL':
                    setThinkGearStatus('信号不良');
                    break;
                case 'NO_PERMISSION':
                    setThinkGearStatus('需要蓝牙权限');
                    break;
            }
        });

        generator.setListener('onSignalChange', (event) => {
            if (event.signal === 'ATTENTION') {
                setAttention(event.value);
            }
        });

        // generator.setListener('onESP32Connected', (event) => {
        //     console.log('ESP32 状态变更:', event.status);
        //     switch (event.status) {
        //         case 'CONNECTED':
        //             setEsp32Status('已连接');
        //             break;
        //         case 'DISCONNECTED':
        //             setEsp32Status('未连接');
        //             break;
        //         case 'CONNECTING':
        //             setEsp32Status('连接中...');
        //             break;
        //     }
        // });

        // generator.setListener('onESP32Data', (event) => {
        //     try {
        //         const data = JSON.parse(event.data);
        //         if (data.cast === true || data.castbig === true) {
        //             setEsp32Data(data);
        //             console.log('收到 ESP32 投投数据:', data);
        //         }
        //     } catch (error) {
        //         console.error('解析 ESP32 数据错误:', error);
        //     }
        // });
    };

    // 点击开始按钮执行的函数
    const handleStart = () => {
        navigation.navigate('Evaluate', { 
            userName,
            isTestMode 
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case '已连接':
                return '#4CAF50'; // 绿色
            case '连接中...':
                return '#FFA500'; // 橙色
            case '未连接':
                return '#FF0000'; // 红色
            case '信号不良':
                return '#FF9800'; // 深橙色
            case '需要蓝牙权限':
                return '#FF9800'; // 深橙色
            default:
                return '#fff';
        }
    };

    // 只检查 ThinkGear 是否连接
    const canStart = thinkGearStatus === '已连接';

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
                                {isTestMode ? '关闭测试模式' : '开启测试模式'}
                            </Text>
                        </TouchableOpacity>
                    </View> */}

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>益智积木脑力评测</Text>
                        <Image
                            source={require('../assets/img/main.png')}
                            style={styles.mainImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.statusContainer}>
                        <View style={styles.deviceStatus}>
                            <Text style={styles.deviceLabel}>脑波仪状态:</Text>
                            <Text style={[styles.statusText, { color: getStatusColor(thinkGearStatus) }]}>
                                {thinkGearStatus}
                            </Text>
                            {thinkGearStatus === '已连接' && (
                                <Text style={styles.attentionText}>专注度: {attention}%</Text>
                            )}
                        </View>

                        {/* <View style={styles.deviceStatus}>
                            <Text style={styles.deviceLabel}>投壶状态:</Text>
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
                            placeholder="请输入姓名"
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
                                <Text style={styles.startButtonText}>开始</Text>
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
