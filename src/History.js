import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Database from './utils/database';

const History = () => {
  const navigation = useNavigation();
  const [records, setRecords] = useState([]);

  // 加載遊戲記錄
  useEffect(() => {
    loadGameRecords();
  }, []);

  const loadGameRecords = async () => {
    try {
      await Database.initDB(); // 確保數據庫已初始化
      const loadedRecords = await Database.getAllGameRecords();
      setRecords(loadedRecords);
    } catch (error) {
      console.error('載入記錄時發生錯誤:', error);
    }
  };

  const goBack = () => {
    navigation.navigate('Evaluate');
  };

  // 刪除記錄
  const deleteRecord = async (timestamp) => {
    try {
      await Database.initDB(); // 確保數據庫已初始化
      await Database.deleteGameRecord(timestamp);
      // 重新加載記錄
      loadGameRecords();
    } catch (error) {
      console.error('刪除記錄時發生錯誤:', error);
      Alert.alert('錯誤', '刪除記錄失敗');
    }
  };

  // 查看詳細記錄
  const viewRecord = (record) => {
    // 將歷史記錄數據包裝成正確的格式
    navigation.navigate('Report', {
      historyData: {
        ...record,
        // 確保所有必要的字段都存在
        superPower: record.superPower || 0,
        brainPower: record.brainPower || 0,
        endurance: record.endurance || 0,
        stability: record.stability || 0,
        successCount: record.successCount || 0,
        throwCount: record.throwCount || 0,
        score: record.score || 0,
        timestamp: record.timestamp
      }
    });
  };

  // 格式化時間戳
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day}_${hours}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/img/background.png')}
        style={styles.background}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>意念投壺</Text>
        </View>

        <Text style={styles.subtitle}>歷史記錄</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>時間</Text>
          <Text style={styles.tableHeaderText}>姓名</Text>
          <Text style={styles.tableHeaderText}>命中</Text>
          <Text style={styles.tableHeaderText}>分數</Text>
        </View>
        <FlatList
          data={records}
          keyExtractor={(item) => item.timestamp}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.tableRow}
              onPress={() => viewRecord(item)}
            >
              <Text style={styles.tableCell}>{formatTimestamp(item.timestamp)}</Text>
              <Text style={styles.tableCell}>{item.userName}</Text>
              <Text style={styles.tableCell}>{item.successCount}次</Text>
              <Text style={styles.tableCell}>
                {item.score}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      "刪除記錄",
                      "確定要刪除這條記錄嗎？",
                      [
                        {
                          text: "取消",
                          style: "cancel"
                        },
                        {
                          text: "確定",
                          onPress: () => deleteRecord(item.timestamp)
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </Text>
            </TouchableOpacity>
          )}
        />
      </ImageBackground>
    </View>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#b22222',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#dcdcdc',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  tableHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dcdcdc',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#000',
  },
  deleteButton: {
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#ff4500',
  },
});
