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
const PIECE_SIZE = 80; // 拼圖片的大小
const GRID_OFFSET_X = 50; // 拼圖網格的X軸偏移
const GRID_OFFSET_Y = 150; // 拼圖網格的Y軸偏移

const PuzzleTest = () => {
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(new Array(TOTAL_PIECES).fill(false));
  const [completedCount, setCompletedCount] = useState(0);

  // 計算拼圖的正確位置
  const getCorrectPosition = (index) => {
    const row = Math.floor(index / PUZZLE_SIZE);
    const col = index % PUZZLE_SIZE;
    return {
      x: GRID_OFFSET_X + col * PIECE_SIZE,
      y: GRID_OFFSET_Y + row * PIECE_SIZE,
    };
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

    // 隨機分配初始位置（在邊緣）
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    initialPieces.forEach(piece => {
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let x, y;
      
      switch(side) {
        case 0: // top
          x = Math.random() * screenWidth;
          y = 50;
          break;
        case 1: // right
          x = screenWidth - 100;
          y = Math.random() * (screenHeight - 200) + 100;
          break;
        case 2: // bottom
          x = Math.random() * screenWidth;
          y = screenHeight - 150;
          break;
        case 3: // left
          x = 50;
          y = Math.random() * (screenHeight - 200) + 100;
          break;
      }
      
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
        
        // 檢查是否放在正確位置
        const correctPos = pieces[index].correctPosition;
        const dropX = pieces[index].position.x._value + pieces[index].pan.x._value;
        const dropY = pieces[index].position.y._value + pieces[index].pan.y._value;
        
        const tolerance = 30; // 允許的誤差範圍
        
        console.log(`Piece ${index + 1} position:`, { dropX, dropY });
        console.log(`Correct position:`, correctPos);
        
        if (
          Math.abs(dropX - correctPos.x) < tolerance &&
          Math.abs(dropY - correctPos.y) < tolerance
        ) {
          // 拼圖放置正確
          Animated.spring(pieces[index].pan, {
            toValue: { 
              x: correctPos.x - pieces[index].position.x._value,
              y: correctPos.y - pieces[index].position.y._value
            },
            useNativeDriver: false,
          }).start();
          
          const newCompleted = [...completed];
          if (!newCompleted[index]) { // 只有在之前未完成時才增加計數
            newCompleted[index] = true;
            setCompleted(newCompleted);
            setCompletedCount(prev => prev + 1);
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
      </View>

      {/* 背景圖 */}
      <Image
        source={require('../assets/img/puzzle/puzzle_map.png')}
        style={styles.backgroundImage}
        resizeMode="contain"
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
          {...(completed[index] ? {} : createPanResponder(index).panHandlers)}
        >
          <Image
            source={puzzleImages[piece.id]}
            style={styles.pieceImage}
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
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  piece: {
    position: 'absolute',
    width: 80,
    height: 80,
    zIndex: 1,
  },
  pieceImage: {
    width: '100%',
    height: '100%',
  },
});

export default PuzzleTest;
