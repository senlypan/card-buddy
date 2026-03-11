// utils/doudizhu.js - 斗地主完整规则工具
// 支持三人玩法：1 地主 vs 2 农民

/**
 * 创建一副牌（54 张含大小王）
 */
function createDeck() {
  const suits = ['♠', '♥', '♣', '♦']
  const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
  const deck = []
  
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value, type: 'normal' })
    }
  }
  
  // 大小王
  deck.push({ suit: '', value: 'Small', type: 'small_joker' })
  deck.push({ suit: '', value: 'Big', type: 'big_joker' })
  
  return deck
}

/**
 * 洗牌
 */
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

/**
 * 发牌（三人玩法）
 * @returns {Object} { players: [手牌 1, 手牌 2, 手牌 3], bottomCards: [底牌 1, 底牌 2, 底牌 3] }
 */
function dealCards() {
  const deck = shuffle(createDeck())
  
  const player1 = []
  const player2 = []
  const player3 = []
  const bottomCards = []
  
  // 每人 17 张
  for (let i = 0; i < 17; i++) {
    player1.push(deck[i * 3])
    player2.push(deck[i * 3 + 1])
    player3.push(deck[i * 3 + 2])
  }
  
  // 剩余 3 张底牌
  bottomCards.push(...deck.slice(51))
  
  return {
    players: [player1, player2, player3],
    bottomCards
  }
}

/**
 * 获取牌的数值（用于比较）
 */
function getCardValue(card) {
  if (!card) return 0
  
  const valueMap = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
    'Small': 16, 'Big': 17
  }
  
  return valueMap[card.value] || 0
}

/**
 * 获取牌的等级（用于显示）
 */
function getCardRank(card) {
  if (!card) return '?'
  return card.value || '?'
}

/**
 * 分析手牌牌型
 * @param {Array} cards - 手牌数组
 * @returns {Object} 牌型信息
 */
function analyzeHand(cards) {
  if (!cards || cards.length === 0) {
    return { type: 'invalid', value: 0, count: 0 }
  }
  
  const length = cards.length
  
  // 转换为数值并排序
  const values = cards.map(c => getCardValue(c)).sort((a, b) => b - a)
  
  // 统计每个值的数量
  const valueCount = {}
  values.forEach(v => {
    valueCount[v] = (valueCount[v] || 0) + 1
  })
  
  const counts = Object.values(valueCount).sort((a, b) => b - a)
  const uniqueValues = Object.keys(valueCount).map(Number).sort((a, b) => b - a)
  
  // 王炸（大王 + 小王）
  if (length === 2 && values.includes(17) && values.includes(16)) {
    return { type: '王炸', value: 999, count: 2, isBomb: true }
  }
  
  // 炸弹（四张相同）
  if (counts[0] === 4) {
    const bombValue = uniqueValues[0]
    return { type: '炸弹', value: bombValue + 100, count: 4, isBomb: true }
  }
  
  // 单张
  if (length === 1) {
    return { type: '单张', value: values[0], count: 1 }
  }
  
  // 对子
  if (length === 2 && counts[0] === 2) {
    return { type: '对子', value: uniqueValues[0], count: 2 }
  }
  
  // 三张
  if (length === 3 && counts[0] === 3) {
    return { type: '三张', value: uniqueValues[0], count: 3 }
  }
  
  // 三带一
  if (length === 4 && counts[0] === 3 && counts[1] === 1) {
    const threeValue = uniqueValues.find(v => valueCount[v] === 3)
    return { type: '三带一', value: threeValue, count: 4 }
  }
  
  // 三带二（对子）
  if (length === 5 && counts[0] === 3 && counts[1] === 2) {
    const threeValue = uniqueValues.find(v => valueCount[v] === 3)
    return { type: '三带二', value: threeValue, count: 5 }
  }
  
  // 顺子（5 张及以上连续单牌）
  if (length >= 5 && counts.every(c => c === 1)) {
    if (isContinuous(values) && values[0] < 15) { // 2 和大小王不能参与
      return { type: '顺子', value: values[0], count: length }
    }
  }
  
  // 连对（3 对及以上连续对子）
  if (length >= 6 && counts.every(c => c === 2) && counts.length >= 3) {
    const pairValues = uniqueValues.sort((a, b) => b - a)
    if (isContinuous(pairValues) && pairValues[0] < 15) {
      return { type: '连对', value: pairValues[0], count: length }
    }
  }
  
  // 飞机（两组及以上连续三张）
  if (counts[0] === 3 && counts.filter(c => c === 3).length >= 2) {
    const threeValues = uniqueValues.filter(v => valueCount[v] === 3).sort((a, b) => b - a)
    if (isContinuousThree(threeValues)) {
      const remaining = length - threeValues.length * 3
      if (remaining === 0) {
        return { type: '飞机', value: threeValues[0], count: length }
      } else if (remaining === threeValues.length) {
        return { type: '飞机带单', value: threeValues[0], count: length }
      } else if (remaining === threeValues.length * 2) {
        return { type: '飞机带对', value: threeValues[0], count: length }
      }
    }
  }
  
  // 四带二（四张 + 两张单牌/两对）
  if (counts[0] === 4) {
    const fourValue = uniqueValues.find(v => valueCount[v] === 4)
    if (length === 6) {
      return { type: '四带二单', value: fourValue, count: 6 }
    } else if (length === 8 && counts[1] === 2 && counts[2] === 2) {
      return { type: '四带二对', value: fourValue, count: 8 }
    }
  }
  
  return { type: 'invalid', value: 0, count: length }
}

/**
 * 检查是否连续
 */
function isContinuous(values) {
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      return false
    }
  }
  return true
}

/**
 * 检查三张是否连续
 */
function isContinuousThree(values) {
  if (values.length < 2) return false
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      return false
    }
  }
  return true
}

/**
 * 比较两个牌型
 * @param {Object} hand1 - 手牌 1 分析结果
 * @param {Object} hand2 - 手牌 2 分析结果
 * @returns {Number} 1: hand1 大，-1: hand2 大，0: 无法比较
 */
function compareHands(hand1, hand2) {
  if (!hand1 || !hand2) return 0
  
  // 王炸最大
  if (hand1.type === '王炸') return 1
  if (hand2.type === '王炸') return -1
  
  // 炸弹比较
  if (hand1.isBomb && !hand2.isBomb) return 1
  if (!hand1.isBomb && hand2.isBomb) return -1
  if (hand1.isBomb && hand2.isBomb) {
    return hand1.value > hand2.value ? 1 : -1
  }
  
  // 相同牌型比较
  if (hand1.type === hand2.type && hand1.count === hand2.count) {
    return hand1.value > hand2.value ? 1 : -1
  }
  
  // 不同牌型无法比较
  return 0
}

/**
 * 检查是否能管上
 * @param {Array} myCards - 我的手牌
 * @param {Object} lastHand - 对手出的牌（分析结果）
 * @returns {Array|null} 能管上的牌，null 表示要不起
 */
function findBeatingCards(myCards, lastHand) {
  if (!myCards || myCards.length === 0 || !lastHand) return null
  
  // 生成所有可能的出牌组合
  const combinations = generateCombinations(myCards)
  
  // 找出能管上的牌
  for (const combo of combinations) {
    const handAnalysis = analyzeHand(combo)
    if (compareHands(handAnalysis, lastHand) > 0) {
      return combo
    }
  }
  
  return null
}

/**
 * 生成所有可能的出牌组合（优化版，避免栈溢出）
 */
function generateCombinations(cards) {
  const combinations = []
  const n = cards.length
  
  // 限制最大组合数，避免栈溢出
  // 只生成 1-6 张牌的组合（足够覆盖所有常见牌型）
  const maxSize = Math.min(n, 6)
  
  for (let size = 1; size <= maxSize; size++) {
    const combos = getCombinationsIterative(cards, size)
    combinations.push(...combos)
    
    // 限制总组合数，避免过多
    if (combinations.length > 500) {
      break
    }
  }
  
  return combinations
}

/**
 * 获取指定大小的组合（迭代版，避免递归）
 */
function getCombinationsIterative(arr, size) {
  const result = []
  const n = arr.length
  
  if (size > n) return result
  if (size === 1) return arr.map(c => [c])
  
  // 使用栈模拟递归
  const stack = []
  for (let i = 0; i <= n - size; i++) {
    stack.push({ index: i, combo: [arr[i]], remaining: size - 1 })
  }
  
  while (stack.length > 0) {
    const { index, combo, remaining } = stack.pop()
    
    if (remaining === 0) {
      result.push(combo)
      continue
    }
    
    for (let i = index + 1; i <= n - remaining; i++) {
      stack.push({
        index: i,
        combo: [...combo, arr[i]],
        remaining: remaining - 1
      })
    }
  }
  
  return result
}

/**
 * 获取建议出牌（AI 使用）
 * @param {Array} myCards - 手牌
 * @param {Object} lastHand - 对手出的牌
 * @param {Boolean} isLandlord - 是否是地主
 * @returns {Array} 建议出的牌
 */
function suggestPlay(myCards, lastHand, isLandlord) {
  if (!myCards || myCards.length === 0) return []
  
  // 自由出牌（先手）
  if (!lastHand) {
    return suggestFreePlay(myCards, isLandlord)
  }
  
  // 管牌
  return findBeatingCards(myCards, lastHand) || []
}

/**
 * 自由出牌建议
 */
function suggestFreePlay(myCards, isLandlord) {
  // 分析手牌
  const handAnalysis = analyzeHand(myCards)
  
  // 如果是单张，出最小的
  if (handAnalysis.type === '单张') {
    const sorted = [...myCards].sort((a, b) => getCardValue(a) - getCardValue(b))
    return [sorted[0]]
  }
  
  // 优先出小的牌型
  const combinations = generateCombinations(myCards)
  for (const combo of combinations) {
    const analysis = analyzeHand(combo)
    if (analysis.type !== 'invalid' && analysis.value < 10) {
      return combo
    }
  }
  
  // 默认出最小的单张
  const sorted = [...myCards].sort((a, b) => getCardValue(a) - getCardValue(b))
  return [sorted[0]]
}

module.exports = {
  createDeck,
  shuffle,
  dealCards,
  getCardValue,
  getCardRank,
  analyzeHand,
  compareHands,
  findBeatingCards,
  suggestPlay
}
