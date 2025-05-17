import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ImageBackground,
  ToastAndroid,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getLevel, getCoordinationAssessment, getBrainActivityAssessment, getFocusAbilityAssessment, getPerceptionAbilityAssessment } from '../utils/reportUtils';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const screenWidth = Dimensions.get('window').width;


const NewReport = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { reportData } = route.params || {};
  const [userName, setUserName] = useState('受试者');

  const coordinationLevel = getLevel(reportData?.brainPower ?? 0);
  const brainActivityLevel = getLevel(reportData?.superPower ?? 0);
  const focusLevel = getLevel(reportData?.stability ?? 0);
  const perceptionLevel = getLevel(reportData?.endurance ?? 0);

  const coordinationAssessment = getCoordinationAssessment(coordinationLevel);
  const brainActivityAssessment = getBrainActivityAssessment(brainActivityLevel);
  const focusAssessment = getFocusAbilityAssessment(focusLevel);
  const perceptionAssessment = getPerceptionAbilityAssessment(perceptionLevel);

  const downloadReport = () => {
    navigation.navigate('History');
  };

  const playAgain = () => {
    navigation.navigate('Evaluate');
  };

  // 创建 HTML 报告内容
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>脑电波分析报告</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #4CAF50; text-align: center; }
          h2 { color: #2196F3; margin-top: 20px; }
          .info { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
          .level { font-weight: bold; color: #FF5722; }
          .features { margin-left: 20px; }
          .suggestions { margin-left: 20px; }
          .feature-item, .suggestion-item { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <h1>脑电波指标等级评估报告</h1>
        
        <div class="info">
          <p><strong>姓名：</strong>${userName}</p>
          <p><strong>完成时间：</strong>${reportData?.completionTime} 秒</p>
          <p><strong>报告生成时间：</strong>${new Date().toLocaleString()}</p>
        </div>
        
        <h2>★ 协调力：<span class="level">${coordinationLevel}级 - ${coordinationAssessment.title}</span></h2>
        <p>${coordinationAssessment.description}</p>
        
        <p><strong>表现特征：</strong></p>
        <ul class="features">
          ${coordinationAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
        </ul>
        
        <p><strong>建议：</strong></p>
        <ul class="suggestions">
          ${coordinationAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
        </ul>
        
        <h2>★ 脑活力：<span class="level">${brainActivityLevel}级 - ${brainActivityAssessment.title}</span></h2>
        <p>${brainActivityAssessment.description}</p>
        
        <p><strong>表现特征：</strong></p>
        <ul class="features">
          ${brainActivityAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
        </ul>
        
        <p><strong>建议：</strong></p>
        <ul class="suggestions">
          ${brainActivityAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
        </ul>
        
        <h2>★ 专注力：<span class="level">${focusLevel}级 - ${focusAssessment.title}</span></h2>
        <p>${focusAssessment.description}</p>
        
        <p><strong>表现特征：</strong></p>
        <ul class="features">
          ${focusAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
        </ul>
        
        <p><strong>建议：</strong></p>
        <ul class="suggestions">
          ${focusAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
        </ul>
        
        <h2>★ 感知力：<span class="level">${perceptionLevel}级 - ${perceptionAssessment.title}</span></h2>
        <p>${perceptionAssessment.description}</p>
        
        <p><strong>表现特征：</strong></p>
        <ul class="features">
          ${perceptionAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
        </ul>
        
        <p><strong>建议：</strong></p>
        <ul class="suggestions">
          ${perceptionAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
        </ul>

        <h2>综合评估</h2>
        <p>通过对四项指标的综合评估，我们可以了解个体的脑功能特点和潜力所在。这些指标不仅可以作为个人能力的参考，还可以指导有针对性的训练和发展计划。</p>
        
        <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <tr>
            <th>等级组合</th>
            <th>特点描述</th>
            <th>发展建议</th>
          </tr>
          <tr>
            <td>全部为1级</td>
            <td>脑功能处于基础发展阶段，有较大提升空间</td>
            <td>从基础训练开始，全面提升各项能力</td>
          </tr>
          <tr>
            <td>1-2级为主</td>
            <td>脑功能发展不均衡，具备一定基础</td>
            <td>重点提升薄弱项，适度发展优势项</td>
          </tr>
          <tr>
            <td>2-3级为主</td>
            <td>脑功能发展良好，部分领域表现突出</td>
            <td>平衡发展各项能力，强化特长</td>
          </tr>
          <tr>
            <td>3-4级为主</td>
            <td>脑功能发展优异，具备综合优势</td>
            <td>挑战极限，发掘特殊才能</td>
          </tr>
        </table>

        <p>每个人的脑功能特点和发展潜力各不相同，本评估报告旨在提供参考和指导，而非绝对评判。通过有针对性的训练和发展，每个人都能够提升自己的脑功能水平，发挥更大潜力。</p>
      </body>
      </html>
    `;

    const goDownload = async () => {
      // 使用 handleDownload 函数生成 PDF
      const fileName = `脑电波报告_${userName}_${new Date().getTime()}`;
      await handleDownload(htmlContent, fileName);
    }
    // 生成 PDF 并打开查看
      const handleDownload = async (htmlContent, fileName) => {
        try {
          console.log('开始生成 PDF...');
          
          // 生成 PDF 文件
          const options = {
            html: htmlContent,
            fileName: fileName || `脑电波报告_${new Date().getTime()}`,
            directory: 'Documents',
            orientation: 'landscape', // Ensure A4 landscape
            pageSize: 'A4', // Ensure it's A4
          };
          console.log('---RNHTMLtoPDF:', RNHTMLtoPDF);
          const file = await RNHTMLtoPDF.convert(options);
          console.log('生成的PDF文件路径:', file.filePath);
          
          // 导航到 PDFView 页面查看 PDF
          navigation.navigate('PDFView', { pdfPath: file.filePath });
          
          // 显示成功提示
          if (Platform.OS === 'android') {
            ToastAndroid.show('报告生成成功', ToastAndroid.SHORT);
          }
          
          return file.filePath;
        } catch (error) {
          console.error('生成PDF时发生错误:', error);
          Alert.alert('错误', `生成PDF时发生错误: ${error.message || error}`);
          return null;
        }
      };

// 圖表配置
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#ffa726',
  },
  formatYLabel: (value) => Math.round(value).toString(),
  formatXLabel: (value) => '',
};

const [chartData, setChartData] = useState(null);

useEffect(() => {
  // 确保数据有效
  const validAttentionData = Array.isArray(reportData.attentionData) 
    ? reportData.attentionData.map(v => Number(v) || 0)
    : [0];
  const validMeditationData = reportData.meditationData.map(v => Number(v) || 0);
  const validSignalData = reportData.signalData.map(v => Number(v) || 0);

  const chartData = {
    labels: Array.from({ length: Math.max(validAttentionData.length, 30) }, (_, i) => ''),
    datasets: [
      {
        data: validAttentionData,
        color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 紅色
        strokeWidth: 2,
      },
      {
        data: validMeditationData.length ? validMeditationData : [0],
        color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`, // 綠色
        strokeWidth: 2,
      },
      {
        data: validSignalData.length ? validSignalData : [0],
        color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 藍色
        strokeWidth: 2,
      },
    ],
    legend: ['专注度', '放松度', '信号强度']
  };

  setChartData(chartData);
}, [reportData]);

const renderChart = () => {
  if (!chartData) return null;

  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 16}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        withDots={false}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={false}
        withHorizontalLabels={true}
        fromZero={true}
        yAxisInterval={20}
      />
    </View>
  );
};

const CircularProgress = ({ score }) => {
  const getGrade = (score) => {
    if (score >= 0 && score <= 30) return 1;
    if (score >= 31 && score <= 45) return 2;
    if (score >= 46 && score <= 60) return 3;
    if (score >= 61 && score <= 100) return 4;
    return 1;
  };

  const getSegmentColors = (score) => {
    const colors = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];
    const segments = [];
    const totalSegments = 5;
    const segmentSize = 100 / totalSegments;

    colors.forEach((color, index) => {
      const percentage = (index + 1) * segmentSize;
      if (score >= percentage - segmentSize) {
        segments.push({
          percentage: segmentSize,
          color: color,
        });
      }
    });

    return segments;
  };

  return (
    <View style={styles.gradeContainer}>
      <Text style={styles.grade}>{getGrade(score)}</Text>
      <View style={styles.circularProgress}>
        {getSegmentColors(score).map((segment, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: segment.color,
                transform: [{ rotate: `${index * 72}deg` }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};
  
  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <Text style={styles.title}>益智积木脑力评测报告</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.timeText}>完成时间 {reportData?.completionTime || 120} 秒</Text>
          </View>
          <View style={styles.chartContainer}>
          {renderChart()}
          </View>
          <View style={styles.evaluationContainer}>
            <Text style={styles.evaluationTitle}>评语：</Text>
            <View style={styles.gradeSection}>
              <CircularProgress score={reportData?.attention || 89} />
              <View style={styles.gradeTextContainer}>
                <Text style={styles.gradeText}>协调力: {coordinationAssessment.title}</Text>
                <Text style={styles.gradeText}>{coordinationAssessment.description}</Text>
                <Text style={styles.gradeText}>{coordinationAssessment.features}</Text>
                <Text style={styles.gradeText}>{coordinationAssessment.suggestions}</Text>
              </View>
            </View>
            <View style={styles.gradeSection}>
              <CircularProgress score={reportData?.meditation || 85} />
              <View style={styles.gradeTextContainer}>
                <Text style={styles.gradeText}>脑活力: {brainActivityAssessment.title}</Text>
                <Text style={styles.gradeText}>{brainActivityAssessment.description}</Text>
                <Text style={styles.gradeText}>{brainActivityAssessment.features}</Text>
                <Text style={styles.gradeText}>{brainActivityAssessment.suggestions}</Text>
              </View>
            </View>
            <View style={styles.gradeSection}>
              <CircularProgress score={reportData?.stability || 80} />
              <View style={styles.gradeTextContainer}>
                <Text style={styles.gradeText}>专注力: {focusAssessment.title}</Text>
                <Text style={styles.gradeText}>{focusAssessment.description}</Text>
                <Text style={styles.gradeText}>{focusAssessment.features}</Text>
                <Text style={styles.gradeText}>{focusAssessment.suggestions}</Text>
              </View>
            </View>
            <View style={styles.gradeSection}>
              <CircularProgress score={reportData?.endurance || 75} />
              <View style={styles.gradeTextContainer}>
                <Text style={styles.gradeText}>感知力: {perceptionAssessment.title}</Text>
                <Text style={styles.gradeText}>{perceptionAssessment.description}</Text>
                <Text style={styles.gradeText}>{perceptionAssessment.features}</Text>
                <Text style={styles.gradeText}>{perceptionAssessment.suggestions}</Text>
              </View>
            </View>
          </View>
          <View style={styles.buttonContainer}>

          
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={playAgain}
                  >
                    <ImageBackground
                      source={require('../assets/img/btn.png')}
                      style={styles.buttonBackground}
                      resizeMode="stretch"
                    >
                      <Text style={styles.buttonText}>再玩一次</Text>
                    </ImageBackground>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={goDownload}
                  >
                    <ImageBackground
                      source={require('../assets/img/btn.png')}
                      style={styles.buttonBackground}
                      resizeMode="stretch"
                    >
                      <Text style={styles.buttonText}>下载报告</Text>
                    </ImageBackground>
                  </TouchableOpacity>
                </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    width: '45%',
  },
  buttonBackground: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  startButtonImage: {
    width: 120,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
  },
  scrollViewContainer: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2C3E50',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  evaluationContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  evaluationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50',
  },
  gradeSection: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  gradeContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  grade: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    zIndex: 1,
    left: 20,
    top: 15,
  },
  circularProgress: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  gradeTextContainer: {
    flex: 1,
  },
  gradeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  backButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NewReport;
