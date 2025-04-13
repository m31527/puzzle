/**
 * 報告工具函數 - 提供腦電波評估相關功能
 */

// 根據分數範圍獲取級別
export const getLevel = (score) => {
  if (score >= 0 && score <= 30) return 1;
  if (score >= 31 && score <= 45) return 2;
  if (score >= 46 && score <= 60) return 3;
  if (score >= 61 && score <= 100) return 4;
  return 1; // 默認為1級
};

// 獲取協調力評估詳情
export const getCoordinationAssessment = (level) => {
  switch(level) {
    case 1:
      return {
        title: '脑波协调性弱',
        description: '您的脑电波频段间协调性较弱，表明不同脑区间同步性不足。在多任务处理、感官整合和复杂环境中可能遇到挑战。',
        features: [
          '多任务处理能力较弱',
          '在动态环境中容易感到混乱',
          '手眼协调或感官整合效率较低',
          '注意力在多重信息中容易分散'
        ],
        suggestions: [
          '进行简单的协调性训练，如太极、瑜伽等平衡性活动',
          '尝试双手协调训练，如弹奏乐器、打字练习',
          '每天安排10-15分钟的冥想，帮助整合脑区功能',
          '简化日常环境，减少同时处理的信息量'
        ]
      };
    case 2:
      return {
        title: '基础协调性',
        description: '您的脑电波频段间展现出基本协调性，具备一定的多任务和感官整合能力，但在复杂情境中可能效率下降。',
        features: [
          '能够处理简单的多任务，但效率不一',
          '在熟悉环境中表现稳定，新环境中适应较慢',
          '基本的感官整合能力，但复杂刺激下效率降低',
          '任务切换需要明显的过渡期'
        ],
        suggestions: [
          '尝试渐进式增加协调训练难度',
          '定期进行感官交叉训练（如闭眼平衡）',
          '练习简单的"双任务"活动（如边走路边背诵）',
          '通过规律作息增强神经系统整体稳定性'
        ]
      };
    case 3:
      return {
        title: '良好协调性',
        description: '您的脑电波频段间协调性良好，表明不同脑区能有效协同工作，在多数日常和专业任务中能保持良好表现。',
        features: [
          '高效的多任务处理能力',
          '对环境变化的适应性强',
          '良好的感官运动整合能力',
          '任务间切换流畅自然'
        ],
        suggestions: [
          '挑战更高难度的协调性活动',
          '尝试高要求的体育或艺术活动（如舞蹈、球类运动）',
          '探索跨领域技能整合（如边唱歌边演奏）',
          '利用协调优势发展专业技能'
        ]
      };
    case 4:
      return {
        title: '卓越协调性',
        description: '您的脑电波频段间展现出卓越的协调性，表明不同脑区高度同步，能在最复杂的协调任务中保持出色表现。',
        features: [
          '出众的多任务处理和资源分配能力',
          '在高压与变化环境中表现稳定',
          '精细的感官运动整合能力',
          '在多维度任务中保持高效率和准确性'
        ],
        suggestions: [
          '挑战专业级别的协调任务',
          '探索创新性的跨领域协调活动',
          '将协调能力用于创造性工作或表演',
          '考虑在团队中担任协调和整合角色'
        ]
      };
    default:
      return {
        title: '脑波协调性弱',
        description: '暂无评估数据',
        features: [],
        suggestions: []
      };
  }
};

// 獲取腦活力評估詳情
export const getBrainActivityAssessment = (level) => {
  // 腦活力評估詳情可後續添加
  return {
    title: `脑活力 ${level} 级`,
    description: `您的脑活力处于 ${level} 级水平`,
    features: [],
    suggestions: []
  };
};

// 獲取專注力評估詳情
export const getFocusAbilityAssessment = (level) => {
  // 專注力評估詳情可後續添加
  return {
    title: `专注力 ${level} 级`,
    description: `您的专注力处于 ${level} 级水平`,
    features: [],
    suggestions: []
  };
};

// 獲取感知力評估詳情
export const getPerceptionAbilityAssessment = (level) => {
  // 感知力評估詳情可後續添加
  return {
    title: `感知力 ${level} 级`,
    description: `您的感知力处于 ${level} 级水平`,
    features: [],
    suggestions: []
  };
};
