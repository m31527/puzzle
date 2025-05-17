import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
  Text,
  ImageBackground,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import Database from './utils/database';

// 預先導入所有拼圖圖片
const puzzleImages = {
  1: require('../assets/img/puzzle/puzzle_1.png'),
  2: require('../assets/img/puzzle/puzzle_2.png'),
  3: require('../assets/img/puzzle/puzzle_3.png'),
  4: require('../assets/img/puzzle/puzzle_4.png'),
  5: require('../assets/img/puzzle/puzzle_5.png'),
  6: require('../assets/img/puzzle/puzzle_6.png'),
  7: require('../assets/img/puzzle/puzzle_7.png'),
  8: require('../assets/img/puzzle/puzzle_8.png'),
  9: require('../assets/img/puzzle/puzzle_9.png'),
  10: require('../assets/img/puzzle/puzzle_10.png'),
  11: require('../assets/img/puzzle/puzzle_11.png'),
  12: require('../assets/img/puzzle/puzzle_12.png'),
  13: require('../assets/img/puzzle/puzzle_13.png'),
  14: require('../assets/img/puzzle/puzzle_14.png'),
  15: require('../assets/img/puzzle/puzzle_15.png'),
  16: require('../assets/img/puzzle/puzzle_16.png'),
};

const PUZZLE_SIZE = 4; // 4x4 拼圖
const TOTAL_PIECES = PUZZLE_SIZE * PUZZLE_SIZE;
const GRID_SIZE = 360; // 背景圖的大小
const PIECE_SIZE = GRID_SIZE / PUZZLE_SIZE; // 根據背景圖大小計算拼圖片大小

// 計算中心對齊的偏移量
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const GRID_OFFSET_X = (screenWidth - GRID_SIZE) / 4; // 水平對齊
const GRID_OFFSET_Y = 50; // 垂直位置

const PuzzleGame = ({ gameData, completed: parentCompleted, handlePiecePress, pieces: parentPieces }) => {
  const navigation = useNavigation();
  const [pieces, setPieces] = useState(parentPieces || []);
  const [completed, setCompleted] = useState(parentCompleted || new Array(TOTAL_PIECES).fill(false));
  const [completedCount, setCompletedCount] = useState(0);
  const [timeCounter, setTimeCounter] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('加载中...');
  const subscriptionsRef = useRef([]);

  // 重置遊戲狀態
  const resetGame = () => {
    // 重置完成狀態
    setCompleted(new Array(TOTAL_PIECES).fill(false));
    setCompletedCount(0);

    // 重新初始化拼圖
    const initialPieces = Array.from({ length: TOTAL_PIECES }, (_, index) => ({
      id: index + 1,
      position: new Animated.ValueXY(),
      isPlaced: false,
      pan: new Animated.ValueXY(),
    }));

    // 計算固定位置
    const positions = [];
    const piecesPerSide = Math.ceil(TOTAL_PIECES / 4);

    for (let i = 0; i < TOTAL_PIECES; i++) {
      const sideIndex = Math.floor(i / piecesPerSide);
      const positionInSide = i % piecesPerSide;
      const margin = PIECE_SIZE * 0.5;
      
      let x, y;
      
      switch(sideIndex) {
        case 0: // 上方
          x = puzzleLeft + (positionInSide * GRID_SIZE / piecesPerSide) + margin;
          y = puzzleTop + margin;
          break;
        case 1: // 右方
          x = puzzleRight - margin;
          y = puzzleTop + (positionInSide * GRID_SIZE / piecesPerSide) + margin;
          break;
        case 2: // 下方
          x = puzzleRight - (positionInSide * GRID_SIZE / piecesPerSide) - margin;
          y = puzzleBottom - margin;
          break;
        case 3: // 左方
          x = puzzleLeft + margin;
          y = puzzleBottom - (positionInSide * GRID_SIZE / piecesPerSide) - margin;
          break;
      }
      positions.push({ x, y });
    }

    // 創建隨機的拼圖編號陣列
    const pieceIds = Array.from({ length: TOTAL_PIECES }, (_, i) => i + 1);
    const shuffledPieceIds = pieceIds.sort(() => Math.random() - 0.5);

    // 將隨機的拼圖編號分配到固定位置
    initialPieces.forEach((piece, index) => {
      const position = positions[index];
      piece.id = shuffledPieceIds[index];
      piece.position.setValue(position);
    });

    // 在 Animated.timing 中使用 useNativeDriver
    initialPieces.forEach((piece, index) => {
      Animated.timing(piece.position, {
        toValue: positions[index],
        duration: 500,
        useNativeDriver: true // 設定為 true 以提高性能
      }).start();
    });

    setPieces(initialPieces);
  };

  // 自動完成所有拼圖
  const handleAutoComplete = useCallback(() => {
    const newPieces = [...pieces];
    newPieces.forEach(piece => {
      const correctPos = correctPositions[piece.id];
      piece.position.setValue({ x: correctPos.x, y: correctPos.y });
      piece.pan.setValue({ x: 0, y: 0 });
    });
    setPieces(newPieces);
    setCompleted(new Array(TOTAL_PIECES).fill(true));
    setCompletedCount(TOTAL_PIECES);
    setShowCompletionModal(true);
  }, [pieces, correctPositions]);
  
  const completeAllPieces = () => {
    handleAutoComplete();
  };

  const correctPositions = {
    1:  { x:  45,  y:  80 },  // 橘色十字
    2:  { x: 115,  y:  80 },  // 藍色圓形
    3:  { x: 185,  y:  80 },  // 紫色三角
    4:  { x: 245,  y:  80 },  // 綠色半圓
    5:  { x:  45,  y: 155 },  // 粉紅色星星
    6:  { x: 115,  y: 155 },  // 橘色橢圓
    7:  { x: 180,  y: 155 },  // 黃色五邊形
    8:  { x: 245,  y: 155 },  // 淺藍色方形
    9:  { x:  45,  y: 215 },  // 綠色梯形
    10: { x: 110,  y: 220 },  // 紅色六角
    11: { x: 175,  y: 215 },  // 藍色梅花
    12: { x: 245,  y: 215 },  // 綠色愛心
    13: { x:  45,  y: 285 },  // 黃色箭頭屋
    14: { x: 105,  y: 285 },  // 紫色X星
    15: { x: 175,  y: 285 },  // 粉色方塊
    16: { x: 245,  y: 285 },  // 紅色平行四邊形
  };
  // 計算拼圖的正確位置
  const getCorrectPosition = (index) => {
    return correctPositions[index];
  };

  // 处理游戏结束
  const handleEndGame = async () => {
    setIsLoading(true);
    setLoadingText('正在生成报告...');
    
    try {
      // 这里可以添加游戏结束时的数据处理逻辑
      const gameData = {
        date: new Date().toISOString(),
        duration: timeCounter,
        completed: completed.every(isComplete => isComplete),
        // 可以添加其他游戏数据
      };
      
      // 保存游戏记录
      await Database.saveGameRecord(gameData);
      
      // 导航到报告页面
      navigation.navigate('Report', {
        gameData: gameData
      });
    } catch (error) {
      console.error('保存游戏记录失败:', error);
      Alert.alert('错误', '保存游戏记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // // 初始化計時器
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setTimeCounter(prev => prev + 1);
  //   }, 1000);

  //   return () => {
  //     clearInterval(timer);
  //   };
  // }, []);

  // 初始化拼圖位置
  useEffect(() => {
    const initialPieces = Array.from({ length: TOTAL_PIECES }, (_, index) => ({
      id: index + 1,
      position: new Animated.ValueXY(),
      isPlaced: false,
      pan: new Animated.ValueXY(),
      correctPosition: getCorrectPosition(index),
    }));

    // 隨機分配初始位置
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const padding = PIECE_SIZE;
    
    // 計算安全的可視範圍（考慮拼圖大小）
    const safeMargin = PIECE_SIZE;
    const safeLeft = safeMargin;
    const safeRight = screenWidth - PIECE_SIZE - safeMargin;
    const safeTop = safeMargin;
    const safeBottom = screenHeight - PIECE_SIZE - safeMargin;

    // 計算拼圖底圖的邊界
    const puzzleLeft = GRID_OFFSET_X;
    const puzzleRight = GRID_OFFSET_X + GRID_SIZE;
    const puzzleTop = GRID_OFFSET_Y;
    const puzzleBottom = GRID_OFFSET_Y + GRID_SIZE;

    // 先計算所有固定位置
    const positions = [];
    const piecesPerSide = Math.ceil(TOTAL_PIECES / 4);

    for (let i = 0; i < TOTAL_PIECES; i++) {
      const sideIndex = Math.floor(i / piecesPerSide);
      const positionInSide = i % piecesPerSide;
      const margin = PIECE_SIZE * 0.5;
      
      let x, y;
      
      switch(sideIndex) {
        case 0: // 上方
          x = puzzleLeft + (positionInSide * GRID_SIZE / piecesPerSide) + margin;
          y = puzzleTop + margin;
          break;
        case 1: // 右方
          x = puzzleRight - margin;
          y = puzzleTop + (positionInSide * GRID_SIZE / piecesPerSide) + margin;
          break;
        case 2: // 下方
          x = puzzleRight - (positionInSide * GRID_SIZE / piecesPerSide) - margin;
          y = puzzleBottom - margin;
          break;
        case 3: // 左方
          x = puzzleLeft + margin;
          y = puzzleBottom - (positionInSide * GRID_SIZE / piecesPerSide) - margin;
          break;
      }
      positions.push({ x, y });
    }

    // 創建隨機的拼圖編號陣列
    const pieceIds = Array.from({ length: TOTAL_PIECES }, (_, i) => i + 1);
    const shuffledPieceIds = pieceIds.sort(() => Math.random() - 0.5);

    // 將隨機的拼圖編號分配到固定位置
    initialPieces.forEach((piece, index) => {
      const position = positions[index];
      piece.id = shuffledPieceIds[index];
      piece.position.setValue(position);
    });

    setPieces(initialPieces);
  }, []);

  // 為每個拼圖片創建 PanResponder
  const createPanResponder = (index) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pieces[index].pan.setOffset({
          x: pieces[index].pan.x._value,
          y: pieces[index].pan.y._value,
        });
        pieces[index].pan.setValue({ x: 0, y: 0 });
      },
      // 修改拖动处理方式，直接设置值而不使用 Animated.event
      onPanResponderMove: (evt, gestureState) => {
        // 直接设置值，避免在嵌套组件中使用 Animated.event 导致的冲突
        pieces[index].pan.setValue({
          x: gestureState.dx,
          y: gestureState.dy
        });
      },
      onPanResponderRelease: (e, gesture) => {
        pieces[index].pan.flattenOffset();
        
        const currentX = pieces[index].position.x._value + pieces[index].pan.x._value;
        const currentY = pieces[index].position.y._value + pieces[index].pan.y._value;
        const correctPos = getCorrectPosition(pieces[index].id);
        
        const tolerance = 45; // 調整容許誤差
        
        console.log(`Piece ${pieces[index].id} position:`, { 
          current: { x: currentX, y: currentY },
          correct: correctPos,
          diff: {
            x: Math.abs(currentX - correctPos.x),
            y: Math.abs(currentY - correctPos.y)
          }
        });
        
        if (
          Math.abs(currentX - correctPos.x) < tolerance &&
          Math.abs(currentY - correctPos.y) < tolerance
        ) {
          // 直接設置到正確位置
          pieces[index].position.setValue({
            x: correctPos.x,
            y: correctPos.y
          });
          
          pieces[index].pan.setValue({ x: 0, y: 0 });
          
          if (!completed[index]) {
            const newCompleted = [...completed];
            newCompleted[index] = true;
            setCompleted(newCompleted);
            const newCount = completedCount + 1;
            setCompletedCount(newCount);
            console.log(`Piece ${pieces[index].id} completed! Total: ${newCount}`);

            // 檢查是否全部完成
            if (newCount === TOTAL_PIECES) {
              completeAllPieces();
            }
          }
        }
      },
    });
  };
  

  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.background}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>拼图游戏</Text>
      </View>
      <View style={styles.container}>
        {/* 游戏区域 */}
        <View style={styles.puzzleGameZone}>
          <View style={styles.puzzleContainer}>
            {/* 進度提示 */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{completedCount}/{TOTAL_PIECES}</Text>
              <Text onPress={handleAutoComplete} style={styles.autoCompleteButton}>
                停止
              </Text>
            </View>

            {/* 背景圖 */}
            <Image
              source={require('../assets/img/puzzle/puzzle_map.png')}
              style={styles.backgroundImage}
            />
            
            {/* 拼圖片 */}
            {pieces.map((piece, index) => (
              <Animated.View
                key={piece.id}
                style={[
                  styles.piece,
                  {
                    transform: piece.pan.getTranslateTransform(),
                    left: piece.position.x,
                    top: piece.position.y,
                  },
                ]}
                {...createPanResponder(index).panHandlers}
              >
                <Image
                  source={puzzleImages[piece.id]}
                  style={[styles.pieceImage, piece.id === 10 && { width: PIECE_SIZE, height: PIECE_SIZE }]}
                  resizeMode="contain"
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* 底部导航 */}
        <View style={[styles.footer, { position: 'absolute', bottom: 10, width: '100%' }]}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => navigation.navigate('Home')}>
            <ImageBackground
              source={require('../assets/img/btn.png')}
              style={styles.buttonBackground}
              resizeMode="stretch"
            >
              <Text style={styles.footerButtonText}>回首页</Text>
            </ImageBackground>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => navigation.navigate('History')}>
            <ImageBackground
              source={require('../assets/img/btn.png')}
              style={styles.buttonBackground}
              resizeMode="stretch"
            >
              <Text style={styles.footerButtonText}>历史记录</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>

      {/* Completion Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showCompletionModal}>
        <View style={styles.modalBackground}>
          <View style={[styles.loadingContainer, styles.completionContainer]}>
            <Text style={styles.completionText}>恭喜完成拼图！</Text>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => {
                handleEndGame();
                setShowCompletionModal(false);
              }}>
              <Text style={styles.reportButtonText}>查看报告</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isLoading}>
        <View style={styles.modalBackground}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  titleText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1D417D',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
  },
  puzzleGameZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  puzzleContainer: {
    width: screenWidth,
    height: screenHeight - 200,
    position: 'relative',
  },
  progressContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
    zIndex: 2,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  autoCompleteButton: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    overflow: 'hidden',
    textAlign: 'center',
  },
  backgroundImage: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    position: 'absolute',
    left: GRID_OFFSET_X,
    top: GRID_OFFSET_Y,
    resizeMode: 'stretch',
  },
  piece: {
    position: 'absolute',
    width: PIECE_SIZE,
    height: PIECE_SIZE,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceImage: {
    width: PIECE_SIZE * 0.85,
    height: PIECE_SIZE * 0.85,
    resizeMode: 'contain',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  footerButton: {
    width: 120,
    height: 50,
  },
  buttonBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#1D417D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333333',
  },
  completionContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  reportButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PuzzleGame;
