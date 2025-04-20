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

  // 加载游戏记录
  useEffect(() => {
    loadGameRecords();
  }, []);

  const loadGameRecords = async () => {
    try {
      await Database.initDB(); // 确保数据库已初始化
      const loadedRecords = await Database.getAllGameRecords();
      setRecords(loadedRecords);
    } catch (error) {
      console.error('加载记录时发生错误:', error);
    }
  };

  const goBack = () => {
    navigation.navigate('Evaluate');
  };

  // 删除记录
  const deleteRecord = async (timestamp) => {
    try {
      await Database.initDB(); // 确保数据库已初始化
      await Database.deleteGameRecord(timestamp);
      // 重新加载记录
      loadGameRecords();
    } catch (error) {
      console.error('删除记录时发生错误:', error);
      Alert.alert('错误', '删除记录失败');
    }
  };

  // 查看详细记录
  const viewRecord = (record) => {
    // 将历史记录数据包装成正确的格式
    navigation.navigate('Report', {
      historyData: {
        ...record,
        // 确保所有必要的字段都存在
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

  // 格式化时间戳
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
          <Text style={styles.title}>拼图游戏</Text>
        </View>

        <Text style={styles.subtitle}>历史记录</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>时间</Text>
          <Text style={styles.tableHeaderText}>姓名</Text>
          <Text style={styles.tableHeaderText}>计时</Text>
          <Text style={styles.tableHeaderText}>分数</Text>
        </View>
        <FlatList
          data={records}
          keyExtractor={(item, index) => `${item.timestamp || 'null'}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.tableRow}
              onPress={() => viewRecord(item)}
            >
              <Text style={styles.tableCell}>{formatTimestamp(item.timestamp)}</Text>
              <Text style={styles.tableCell}>{item.userName}</Text>
              <Text style={styles.tableCell}>{item.completionTime}</Text>
              <Text style={styles.tableCell}>
                {/* {item.score} */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      "删除记录",
                      "确定要删除这条记录吗？",
                      [
                        {
                          text: "取消",
                          style: "cancel"
                        },
                        {
                          text: "确定",
                          onPress: () => deleteRecord(item.timestamp)
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.deleteButtonText}></Text>
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
    color: '#ff0000',
  },
});
