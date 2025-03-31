import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const CircularProgress = ({ score }) => {
  // 將分數轉換為字母等級
  const getGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // 計算圓形進度條的顏色分佈
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
                transform: [{ rotate: `${index * 72}deg` }],              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const NewReport = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { gameData } = route.params || {};

  // 假設數據
  const data = {
    labels: ['0', '20', '40', '60', '80', '100'],
    datasets: [
      {
        data: gameData?.attentionHistory ?? [65, 70, 55, 80, 75, 90],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: gameData?.meditationHistory ?? [60, 65, 50, 70, 60, 75],
        color: (opacity = 1) => `rgba(255, 45, 85, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['專注度', '放鬆度'],
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.backgroundImage}>
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>益智積木腦力評測報告</Text>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>分數 {gameData?.score || 89}</Text>
        <Text style={styles.timeText}>完成時間 {gameData?.completionTime || 120} 秒</Text>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.evaluationContainer}>
        <Text style={styles.evaluationTitle}>評語：</Text>
        <View style={styles.gradeSection}>
          <CircularProgress score={gameData?.attention || 89} />
          <View style={styles.gradeTextContainer}>
            <Text style={styles.gradeText}>
              評語內容顯示，可視長短撰寫，沒意外應該是要放簡體字。評語內容顯示，可視長短撰寫，沒意外應該是要放簡體字。
            </Text>
          </View>
        </View>
        <View style={styles.gradeSection}>
          <CircularProgress score={gameData?.meditation || 85} />
          <View style={styles.gradeTextContainer}>
            <Text style={styles.gradeText}>
              評語內容顯示，可視長短撰寫，沒意外應該是要放簡體字。評語內容顯示，可視長短撰寫，沒意外應該是要放簡體字。
            </Text>
          </View>
        </View>
      </View>


      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}>
        <ImageBackground
            source={require('../assets/img/btn.png')}
            style={styles.startButtonImage}
            resizeMode="stretch"
        >
            <Text style={styles.startButtonText}>回主頁</Text>
        </ImageBackground>
      </TouchableOpacity>
    </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
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
