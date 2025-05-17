import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid,
  Clipboard,
  Linking,
  Image
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import Svg, { Circle, Line, Text as SvgText, Path, G } from 'react-native-svg';
import { GAME_CONFIG } from './config/gameConfig';
import { useAppState } from './context/AppStateContext';
import { getLevel, getCoordinationAssessment, getBrainActivityAssessment, getFocusAbilityAssessment, getPerceptionAbilityAssessment } from './utils/reportUtils';
import { useLanguage } from './i18n/LanguageContext';

const Report = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { pauseProcessing, resumeProcessing } = useAppState();
  const isFocused = useIsFocused();
  const { t } = useLanguage(); // 使用語言上下文
  
  // 确保从不同来源进入时都能正确获取数据
  const [reportData, setReportData] = useState(null);

  // 使用 useEffect 来处理页面焦点变化
  useEffect(() => {
    if (isFocused) {
      console.log('Report 页面获得焦点，暂停背景处理');
      pauseProcessing();
    }
    
    return () => {
      if (!isFocused) {
        console.log('Report 页面失去焦点，恢复背景处理');
        resumeProcessing();
      }
    };
  }, [isFocused]);

  useEffect(() => {
    console.log('Report received params:', route.params);
    
    // 检查数据来源并设置数据
    if (route.params) {
      if (route.params.gameData) {
        // 来自游戏结束
        // console.log('Data from game end:', route.params.gameData);
        setReportData(route.params.gameData);
      } else if (route.params.historyData) {
        // 来自历史记录
        // console.log('Data from history:', route.params.historyData);
        setReportData(route.params.historyData);
      }
    }
  }, [route.params]);

  // 如果还没有数据，显示加载中
  if (!reportData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  // 从 reportData 中解构数据
  const {
    superPower = 0,
    brainPower = 0,
    stability = 0,
    endurance = 0,
    successCount = 0,
    throwCount = 0,
    score = 0,
    completionTime = 0,
  } = reportData;

  const userName = '受试者';

  // 使用从游戏传来的分数
  const finalScore = score;  

  // 计算群众百分比位置
  const calculatePercentile = () => {
    let cumulativePercentage = 0;
    for (let i = 0; i < successCount; i++) {
      cumulativePercentage += GAME_CONFIG.HIT_DISTRIBUTION[i] || 0;
    }
    return Math.round(cumulativePercentage);
  };

  const percentilePosition = calculatePercentile();

  // 圈形图表的参数

  // 圆形图表的参数
  const windowWidth = Dimensions.get('window').width;
  const centerX = windowWidth / 2;
  const radius = windowWidth * 0.35;  // 增加图表大小
  const strokeWidth = 1;

  // 绘制同心圆和刻度的函数
  const renderCirclesAndScales = () => {
    const circles = [];
    const numCircles = 5;
    const scaleLabels = ['0', '20', '40', '60', '80', '100'];
    
    for (let i = 0; i <= numCircles; i++) {
      const currentRadius = (radius * i) / numCircles;
      circles.push(
        <G key={`circle-group-${i}`}>
          <Circle
            cx={centerX}
            cy={radius + 100}
            r={currentRadius}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <SvgText
            x={centerX - 15}
            y={radius + 100 - currentRadius}
            fill="rgba(255, 255, 255, 0.6)"
            fontSize="10"
          >
            {scaleLabels[i]}
          </SvgText>
        </G>
      );
    }
    return circles;
  };

  // 绘制轴线的函数
  const renderAxes = () => {
    const axes = [];
    const numAxes = 4;
    const angleStep = (2 * Math.PI) / numAxes;
    const labels = [t('coordination'), t('brainActivity'), t('focusAbility'), t('perception')];
    const labelOffset = 25;

    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const endX = centerX + Math.cos(angle) * radius;
      const endY = (radius + 100) + Math.sin(angle) * radius;
      const labelX = centerX + Math.cos(angle) * (radius + labelOffset);
      const labelY = (radius + 100) + Math.sin(angle) * (radius + labelOffset);

      axes.push(
        <G key={`axis-group-${i}`}>
          <Line
            x1={centerX}
            y1={radius + 100}
            x2={endX}
            y2={endY}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
          />
          <SvgText
            x={labelX}
            y={labelY}
            fill="#000000"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {labels[i]}
          </SvgText>
        </G>
      );
    }
    return axes;
  };

  // 绘制数据区域
  const renderDataArea = () => {
    const values = [superPower, brainPower, stability, endurance];
    console.log('values', values);
    const numPoints = 4;
    const angleStep = (2 * Math.PI) / numPoints;
    let pathD = '';

    values.forEach((value, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const distance = (value / 100) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = (radius + 100) + Math.sin(angle) * distance;
      
      if (i === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    });
    pathD += ' Z';

    return (
      <G>
        <Path
          d={pathD}
          fill="rgba(248, 89, 89, 0.3)"
          stroke="rgba(251, 142, 142, 0.2)"
          strokeWidth={2}
        />
        {values.map((value, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const distance = (value / 100) * radius;
          const x = centerX + Math.cos(angle) * distance;
          const y = (radius + 100) + Math.sin(angle) * distance;
          
          return (
            <G key={`point-group-${i}`}>
              <Circle
                cx={x}
                cy={y}
                r={4}
                fill="#000000"
              />
              <SvgText
                x={x}
                y={y - 10}
                fill="#000000"
                fontSize="12"
                textAnchor="middle"
              >
                {Math.round(value)}
              </SvgText>
            </G>
          );
        })}
      </G>
    );
  };

  const renderAbilityChart = () => {
    return (
      <Svg width={windowWidth} height={windowWidth+20}>
        {renderCirclesAndScales()}
        {renderAxes()}
        {renderDataArea()}
      </Svg>
    );
  };

  const goBack = () => {
    navigation.navigate('History');
  };

  const playAgain = () => {
    navigation.navigate('Evaluate');
  };

  // 显示脑活力报告
  const showBrainActivityReport = (level) => {
    const assessment = getBrainActivityAssessment(level);
    Alert.alert(
      t('brainActivityTitle').replace('{level}', level).replace('{title}', assessment.title),
      assessment.description,
      [
        { 
          text: t('viewFocusAbility'), 
          onPress: () => showFocusReport(getLevel(stability)) 
        },
        { 
          text: t('close'), 
          style: 'cancel' 
        }
      ]
    );
  };
  
  // 显示专注力报告
  const showFocusReport = (level) => {
    const assessment = getFocusAbilityAssessment(level);
    Alert.alert(
      t('focusAbilityTitle').replace('{level}', level).replace('{title}', assessment.title),
      assessment.description,
      [
        { 
          text: t('viewPerception'), 
          onPress: () => showPerceptionReport(getLevel(endurance)) 
        },
        { 
          text: t('close'), 
          style: 'cancel' 
        }
      ]
    );
  };
  
  // 显示感知力报告
  const showPerceptionReport = (level) => {
    const assessment = getPerceptionAbilityAssessment(level);
    Alert.alert(
      t('perceptionTitle').replace('{level}', level).replace('{title}', assessment.title),
      assessment.description,
      [
        { 
          text: t('complete'), 
          style: 'default' 
        }
      ]
    );
  };

  

  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.background}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{t('reportTitle')}</Text>
      </View>
      
      <View style={styles.contentContainer}>
        {renderAbilityChart()}
        
        <Text style={styles.nameText}>{t('nameAndTime').replace('{name}', userName).replace('{time}', completionTime)}</Text>
         {/* 右上角查看报告按钮 - 使用更明显的按钮样式 */}
         <TouchableOpacity
          style={{
            borderColor: '#FFC0CB', // Pink border
            borderWidth: 2,
            padding: 10,
            borderRadius: 5,
            width: '80%', // Make the button longer
            alignItems: 'center',
            marginVertical: 10,
            alignSelf: 'center',
            backgroundColor: '#FFFFFF',
          }}
          onPress={async () => {
            console.log('点击了报告按钮');
            
            try {
              // 显示变化提示
              
              // 获取各项能力的评估级别
              const coordinationLevel = getLevel(brainPower);
              const brainActivityLevel = getLevel(superPower);
              const focusLevel = getLevel(stability);
              const perceptionLevel = getLevel(endurance);
              
              // 获取各项能力的评估详情
              const coordinationAssessment = getCoordinationAssessment(coordinationLevel);
              const brainActivityAssessment = getBrainActivityAssessment(brainActivityLevel);
              const focusAssessment = getFocusAbilityAssessment(focusLevel);
              const perceptionAssessment = getPerceptionAbilityAssessment(perceptionLevel);
              
              
              
              try {
                // 提示用戶查看詳細報告
                Alert.alert(
                  t('reportGenerated'),
                  t('viewDetailReport'),
                  [
                    {
                      text: t('cancel'),
                      style: 'cancel',
                    },
                    {
                      text: t('confirm'),
                      onPress: () => {
                        navigation.navigate('NewReport', { reportData });
                      },
                    },
                  ]
                );
              } catch (error) {
                console.log('RNHTMLtoPDF 不可用，使用备用方案...', error);
                // 备用方案：显示报告内容
                Alert.alert(
                  t('brainwaveReport'),
                  `${t('nameAndTime').replace('{name}', userName).replace('{time}', completionTime)}\n\n${t('coordination')}: ${coordinationAssessment.title}\n${t('brainActivity')}: ${brainActivityAssessment.title}\n${t('focusAbility')}: ${focusAssessment.title}\n${t('perception')}: ${perceptionAssessment.title}`,
                  [
                    { 
                      text: t('copyReport'), 
                      onPress: () => {
                        const reportText = `${t('brainwaveReport')}\n\n${t('nameAndTime').replace('{name}', userName).replace('{time}', completionTime)}\n\n${t('coordination')}: ${coordinationAssessment.title}\n${coordinationAssessment.description}\n\n${t('brainActivity')}: ${brainActivityAssessment.title}\n${brainActivityAssessment.description}\n\n${t('focusAbility')}: ${focusAssessment.title}\n${focusAssessment.description}\n\n${t('perception')}: ${perceptionAssessment.title}\n${perceptionAssessment.description}`;
                        Clipboard.setString(reportText);
                        if (Platform.OS === 'android') {
                          ToastAndroid.show(t('reportCopied'), ToastAndroid.SHORT);
                        } else {
                          Alert.alert(t('success'), t('reportCopied'));
                        }
                      } 
                    },
                    { 
                      text: t('close'), 
                      style: 'cancel' 
                    }
                  ]
                );
              }
              
            } catch (error) {
              console.error('生成PDF报告时发生错误:', error);
              
              // 如果 PDF 生成失败，则显示简化报告
              Alert.alert(
                t('brainwaveReport'), 
                `${t('nameAndTime').replace('{name}', userName).replace('{time}', completionTime)}\n\n${t('coordination')}: ${coordinationAssessment.title}\n${t('brainActivity')}: ${brainActivityAssessment.title}\n${t('focusAbility')}: ${focusAssessment.title}\n${t('perception')}: ${perceptionAssessment.title}`,
                [{ text: t('ok'), style: 'default' }]
              );
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#FFC0CB', fontWeight: 'bold', fontSize: 16 }}>{t('viewReport')}</Text>
        </TouchableOpacity>
        <View style={styles.statsContainer}>
          <View style={[styles.statsBox, styles.throwsBox]}>
            <Text style={styles.statsLabel}>{t('coordination')}</Text>
            <Text style={styles.statsValue}>{t('level').replace('{level}', getLevel(brainPower))}</Text>
          </View>
          <View style={[styles.statsBox, styles.successBox]}>
            <Text style={styles.statsLabel}>{t('brainActivity')}</Text>
            <Text style={styles.statsValue}>{t('level').replace('{level}', getLevel(superPower))}</Text>
          </View>
          <View style={[styles.statsBox, styles.scoreBox]}>
            <Text style={styles.statsLabel}>{t('focusAbility')}</Text>
            <Text style={styles.statsValue}>{t('level').replace('{level}', getLevel(stability))}</Text>
          </View>
          <View style={[styles.statsBox, styles.percentileBox]}>
            <Text style={styles.statsLabel}>{t('perception')}</Text>
            <Text style={styles.statsValue}>{t('level').replace('{level}', getLevel(endurance))}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Home')}
        >
          <ImageBackground
            source={require('../assets/img/btn.png')}
            style={styles.buttonBackground}
            resizeMode="stretch"
          >
            <Text style={styles.buttonText}>{t('backToHome')}</Text>
          </ImageBackground>
        </TouchableOpacity>

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
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#D2B48C',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    position: 'relative',
  },
  titleText: {
    fontSize: 24,
    color: '#1D417D',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    flex: 1,
    alignItems: 'center',
  },
  nameText: {
    fontSize: 18,
    color: '#000000',
    marginTop: 10,
  },
  downloadButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(166, 142, 8, 0.78)',
    borderRadius: 15,
    padding: 5,
  },
  downloadIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginBottom: 2,
  },
  downloadBase: {
    width: 12,
    height: 4,
    backgroundColor: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom:20,
    width: '100%',
  },
  statsBox: {
    width: '40%',
    margin: '2%',
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  throwsBox: {
    backgroundColor: 'rgba(166, 142, 8, 0.78)',  // 金色背景
  },
  successBox: {
    backgroundColor: 'rgba(166, 142, 8, 0.78)',  // 金色背景
  },
  scoreBox: {
    backgroundColor: 'rgba(166, 142, 8, 0.78)',  // 金色背景
  },
  percentileBox: {
    backgroundColor: 'rgba(166, 142, 8, 0.78)',  // 金色背景
  },
  statsLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
  },
  statsValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default Report;