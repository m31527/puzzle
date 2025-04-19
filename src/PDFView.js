// PDFView.js
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';

const PDFView = ({ route }) => {
  const { pdfPath } = route.params;
  const navigation = useNavigation();

  useEffect(() => {
    const openPDF = async () => {
      try {
        console.log('📄 检查 PDF 文件:', pdfPath);
        
        // 确认文件是否存在
        const exists = await RNFS.exists(pdfPath);
        if (!exists) {
          console.error('❌ PDF 文件不存在');
          Alert.alert('错误', '找不到 PDF 文件');
          navigation.goBack();
          return;
        }

        console.log('✅ 文件存在，准备打开...');
        
        // 尝试打开文件
        await FileViewer.open(pdfPath, {
          showOpenWithDialog: true,
          showAppsSuggestions: true
        });
        console.log('✅ PDF 打开成功');
        
        // 成功打开后返回
        navigation.goBack();
      } catch (error) {
        console.error('打开 PDF 时出错:', error);
        Alert.alert('错误', '无法打开 PDF 文件。');
        navigation.goBack();
      }
    };

    openPDF();
  }, [pdfPath, navigation]);

  return null;
};

export default PDFView;