import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  Text,
} from 'react-native';

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

const PuzzleTest = () => {
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(new Array(TOTAL_PIECES).fill(false));
  const [completedCount, setCompletedCount] = useState(0);

  const handleAutoComplete = () => {
    const newPieces = [...pieces];
    newPieces.forEach(piece => {
      const correctPos = correctPositions[piece.id];
      piece.position.setValue({ x: correctPos.x, y: correctPos.y });
      piece.pan.setValue({ x: 0, y: 0 });
    });
    setPieces(newPieces);
    setCompleted(new Array(TOTAL_PIECES).fill(true));
    setCompletedCount(TOTAL_PIECES);
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

    // 將拼圖均勻分布在四周
    initialPieces.forEach((piece, index) => {
      const totalPieces = TOTAL_PIECES;
      const piecesPerSide = Math.ceil(totalPieces / 4);
      const sideIndex = Math.floor(index / piecesPerSide);
      
      let x, y;
      const spreadRange = PIECE_SIZE * 0.8; // 散布範圍
      
      switch(sideIndex) {
        case 0: // 上方
          x = puzzleLeft + (Math.random() * GRID_SIZE);
          y = Math.max(safeTop, puzzleTop - PIECE_SIZE - spreadRange);
          break;
        case 1: // 右方
          x = Math.min(safeRight, puzzleRight + spreadRange);
          y = puzzleTop + (Math.random() * GRID_SIZE);
          break;
        case 2: // 下方
          x = puzzleLeft + (Math.random() * GRID_SIZE);
          y = Math.min(safeBottom, puzzleBottom + spreadRange);
          break;
        case 3: // 左方
          x = Math.max(safeLeft, puzzleLeft - PIECE_SIZE - spreadRange);
          y = puzzleTop + (Math.random() * GRID_SIZE);
          break;
      }
      
      // 確保拼圖在安全範圍內
      x = Math.max(safeLeft, Math.min(safeRight, x));
      y = Math.max(safeTop, Math.min(safeBottom, y));
      
      // 加入小幅度的隨機偏移
      x += (Math.random() - 0.5) * PIECE_SIZE * 0.3;
      y += (Math.random() - 0.5) * PIECE_SIZE * 0.3;
      
      piece.position.setValue({ x, y });
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
      onPanResponderMove: Animated.event(
        [null, { dx: pieces[index].pan.x, dy: pieces[index].pan.y }],
        { useNativeDriver: false }
      ),
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
            setCompletedCount(prev => prev + 1);
            console.log(`Piece ${pieces[index].id} completed! Total: ${completedCount + 1}`);
          }
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* 進度提示 */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{completedCount}/{TOTAL_PIECES}</Text>
        {/* <Text onPress={handleAutoComplete} style={styles.autoCompleteButton}>
          拼上
        </Text> */}
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
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    position: 'absolute',
    top: 40,
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
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
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
});

export default PuzzleTest;
