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
import { useLanguage } from './i18n/LanguageContext';

const History = () => {
  const navigation = useNavigation();
  const { t } = useLanguage(); // 使用語言上下文
  const [records, setRecords] = useState([]);

  // 加载游戏记录
  useEffect(() => {
    loadGameRecords();
  }, []);

  const loadGameRecords = async () => {
    try {
      console.log('开始加载游戏记录...');
      await Database.initDB(); // 确保数据库已初始化
      const loadedRecords = await Database.getAllGameRecords();
      console.log('加载到的记录数量:', loadedRecords.length);
      
      if (loadedRecords.length > 0) {
        console.log('第一条记录示例:', JSON.stringify(loadedRecords[0]));
      } else {
        console.log('没有找到游戏记录');
      }
      
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
      console.log('尝试删除记录:', timestamp);
      await Database.initDB(); // 确保数据库已初始化
      const success = await Database.deleteGameRecord(timestamp);
      
      if (success) {
        console.log('删除成功，更新记录列表');
        // 直接从当前状态中移除该记录，而不是重新加载
        setRecords(prevRecords => prevRecords.filter(record => record.timestamp !== timestamp));
        // 同时也重新加载数据库中的记录，确保数据同步
        loadGameRecords();
        Alert.alert(t('success'), t('recordDeleted'));
      } else {
        console.error('删除记录失败');
        Alert.alert(t('error'), t('deleteFailed'));
      }
    } catch (error) {
      console.error('删除记录时发生错误:', error);
      Alert.alert(t('error'), t('deleteFailed'));
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
          <Text style={styles.title}>{t('puzzleGame')}</Text>
        </View>

        <Text style={styles.subtitle}>{t('historyTitle')}</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>{t('time')}</Text>
          <Text style={styles.tableHeaderText}>{t('userName')}</Text>
          <Text style={styles.tableHeaderText}>{t('timer')}</Text>
        </View>
        {/* 添加调试信息显示记录数量 */}
        <Text style={styles.subtitle}>{t('recordCount').replace('{count}', records.length)}</Text>
        
        <FlatList
          data={records}
          keyExtractor={(item, index) => `${item.timestamp || 'null'}-${index}`}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('noRecords')}</Text>}
          contentContainerStyle={styles.flatListContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.tableRow}
              onPress={() => viewRecord(item)}
            >
              <Text style={styles.tableCell}>{formatTimestamp(item.timestamp)}</Text>
              <Text style={styles.tableCell}>{item.userName}</Text>
              <Text style={styles.tableCell}>{item.completionTime}</Text>
              <View style={styles.tableCell}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      t('deleteRecord'),
                      t('deleteConfirm'),
                      [
                        {
                          text: t('cancel'),
                          style: "cancel"
                        },
                        {
                          text: t('confirm'),
                          onPress: () => deleteRecord(item.timestamp)
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.deleteButtonText}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#fff',
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#ff3b30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
