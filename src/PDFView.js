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
        console.log('📄 檢查 PDF 檔案:', pdfPath);
        
        // 確認檔案是否存在
        const exists = await RNFS.exists(pdfPath);
        if (!exists) {
          console.error('❌ PDF 檔案不存在');
          Alert.alert('錯誤', '找不到 PDF 檔案');
          navigation.goBack();
          return;
        }

        console.log('✅ 檔案存在，準備開啟...');
        
        // 嘗試開啟檔案
        await FileViewer.open(pdfPath, {
          showOpenWithDialog: true,
          showAppsSuggestions: true
        });
        console.log('✅ PDF 開啟成功');
        
        // 成功開啟後返回
        navigation.goBack();
      } catch (error) {
        console.error('無法打開 PDF:', error);
        Alert.alert('錯誤', '無法打開報告文件。');
        navigation.goBack();
      }
    };

    openPDF();
  }, [pdfPath]);

  return null;
};

export default PDFView;