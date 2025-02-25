// TestDataGenerator.js
class TestDataGenerator {
    constructor() {
        this.listeners = {
            onStateChange: null,
            onSignalChange: null,
            onEegPower: null,
            onESP32Data: null,
            onESP32Connected: null
        };
        this.isRunning = false;
        this.gameStartTime = null;
        this.gameTimeLimit = 90000; // 90秒 (毫秒)
        this.isGenerating = false;
        this.currentAttention = 0;
        this.currentMeditation = 0;
        this.interval = null;
    }

    // 註冊監聽器
    setListener(type, callback) {
        this.listeners[type] = callback;
    }

    // 生成隨機專注度 (0-100)
    generateAttention() {
        // 生成一個較為穩定的專注度，基於正弦波形
        const baseValue = 70; // 基準值
        const amplitude = 20; // 振幅
        const now = Date.now();
        const phase = (now % 10000) / 10000 * Math.PI * 2; // 10秒一個完整週期
        const value = Math.floor(baseValue + amplitude * Math.sin(phase));
        return Math.max(0, Math.min(100, value)); // 確保值在 0-100 範圍內
    }

    // 生成冥想度數據 (0-100)
    generateMeditation() {
        // 生成一個較為穩定的冥想度，使用餘弦波形（與專注度相位差90度）
        const baseValue = 60;
        const amplitude = 15;
        const now = Date.now();
        const phase = (now % 12000) / 12000 * Math.PI * 2; // 12秒一個完整週期
        const value = Math.floor(baseValue + amplitude * Math.cos(phase));
        return Math.max(0, Math.min(100, value)); // 確保值在 0-100 範圍內
    }

    // 生成信號強度 (0-200)
    generatePoorSignal() {
        // 大部分時間保持較低的信號值（表示信號良好）
        const value = Math.random() < 0.8 ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 200);
        return Math.max(0, Math.min(200, value)); // 確保值在 0-200 範圍內
    }

    // 生成腦波能量數據
    generateEegPower() {
        // 生成各種腦波頻段的能量值
        // 這些值的範圍通常在0-1,000,000之間
        return {
            delta: Math.floor(Math.random() * 1000000),    // 1-3Hz
            theta: Math.floor(Math.random() * 800000),     // 4-7Hz
            lowAlpha: Math.floor(Math.random() * 600000),  // 8-9Hz
            highAlpha: Math.floor(Math.random() * 500000), // 10-12Hz
            lowBeta: Math.floor(Math.random() * 400000),   // 13-17Hz
            highBeta: Math.floor(Math.random() * 300000),  // 18-30Hz
            lowGamma: Math.floor(Math.random() * 200000),  // 31-40Hz
            midGamma: Math.floor(Math.random() * 100000)   // 41-50Hz
        };
    }

    // 生成 ESP32 投擲數據
    generateThrowData() {
        return {
            cast: true
        };
    }

    // 開始模擬數據
    startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.gameStartTime = Date.now();

        // 模擬設備連接
        if (this.listeners.onStateChange) {
            this.listeners.onStateChange({ state: 'CONNECTED' });
        }

        // 使用 RAF 來優化性能
        let lastUpdate = 0;
        const UPDATE_INTERVAL = 100; // 100ms 更新一次

        const updateLoop = () => {
            if (!this.isRunning) return;

            const now = Date.now();
            if (now - lastUpdate >= UPDATE_INTERVAL) {
                lastUpdate = now;

                // 發送專注度數據
                if (this.listeners.onSignalChange) {
                    this.listeners.onSignalChange({
                        signal: 'ATTENTION',
                        value: this.generateAttention()
                    });
                    
                    this.listeners.onSignalChange({
                        signal: 'MEDITATION',
                        value: this.generateMeditation()
                    });
                    
                    this.listeners.onSignalChange({
                        signal: 'POOR_SIGNAL',
                        value: this.generatePoorSignal()
                    });
                }
            }

            requestAnimationFrame(updateLoop);
        };

        updateLoop();
    }

    stopSimulation() {
        this.isRunning = false;
        this.gameStartTime = null;

        // 模擬設備斷開連接
        if (this.listeners.onStateChange) {
            this.listeners.onStateChange({ state: 'DISCONNECTED' });
        }
    }

    // 生成測試數據
    generateTestData() {
        if (this.isGenerating) {
            this.currentAttention = Math.floor(Math.random() * 100);
            this.currentMeditation = Math.floor(Math.random() * 100);
            return {
                attention: this.currentAttention,
                meditation: this.currentMeditation
            };
        }
        return null;
    }

    // 開始生成數據
    startGenerating() {
        this.isGenerating = true;
        console.log('開始生成測試數據');
    }

    // 停止生成數據
    stopGenerating() {
        this.isGenerating = false;
        console.log('停止生成測試數據');
    }

    // 模擬投中
    simulateHit() {
        if (this.isGenerating) {
            const eventData = this.generateThrowData();
            console.log('模擬投中:', eventData);
            if (this.listeners.onESP32Data) {
                this.listeners.onESP32Data(eventData);
            }
            return eventData;
        }
        return null;
    }

    // 模擬未中
    simulateMiss() {
        if (this.isGenerating) {
            const eventData = {
                ...this.generateThrowData(),
                cast: false
            };
            console.log('模擬未中:', eventData);
            if (this.listeners.onESP32Data) {
                this.listeners.onESP32Data(eventData);
            }
            return eventData;
        }
        return null;
    }
}

export default TestDataGenerator;
