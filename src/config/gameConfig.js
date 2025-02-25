// 遊戲相關配置
export const GAME_CONFIG = {
  MAX_THROWS: 5,  // 最大投擲次數
  MIN_THROW_INTERVAL: 1000,  // 最小投擲間隔（毫秒）
  
  // 命中分佈
  HIT_DISTRIBUTION: {
    0: 15,    // 命中 0 支: 15%
    1: 55,    // 命中 1 支: 55%
    2: 25,    // 命中 2 支: 25%
    3: 4,     // 命中 3 支: 4%
    4: 0.8,   // 命中 4 支: 0.8%
    5: 0.2    // 命中 5 支: 0.2%
  },

  // 分數計算
  SCORE_PER_HIT: 100,  // 每支箭 100 分
  SCORE_PER_BIG_HIT: 500,  // 每支大投擲 500 分
};

export default GAME_CONFIG;
