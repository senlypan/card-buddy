/**
 * 思维锻炼工具 - 概率计算与决策提示
 * 帮助培养数学思维和决策能力
 * @author 小主人
 * @since 2026-03-11
 */

// 引入 cards.js 的工具函数
const CardUtils = require('./cards.js')

/**
 * 获取牌的等级（A/K/Q/J 等）- 兼容不同数据格式
 */
function getCardRank(card) {
  if (!card) return '?'
  
  // 如果有 rank 属性，直接使用
  if (card.rank) {
    return card.rank
  }
  
  // 如果有 value 属性（cards.js 格式，可能是字符串或数字）
  if (card.value !== undefined && card.value !== null) {
    // 如果 value 是字符串（如 "7", "A"）
    if (typeof card.value === 'string') {
      return card.value.toUpperCase()
    }
    // 如果 value 是数字
    const valueMap = {
      14: 'A', 13: 'K', 12: 'Q', 11: 'J',
      10: '10', 9: '9', 8: '8', 7: '7', 
      6: '6', 5: '5', 4: '4', 3: '3', 2: '2'
    }
    return valueMap[card.value] || '?'
  }
  
  // 从 text 中提取
  if (card.text) {
    return card.text.replace(/[♠♥♣♦]/g, '') || '?'
  }
  
  return '?'
}

/**
 * 获取牌的数值 - 兼容不同数据格式
 */
function getCardValue(card) {
  if (!card) return 0
  
  // 优先使用 CardUtils.getCardValue（如果存在）
  if (CardUtils && typeof CardUtils.getCardValue === 'function') {
    try {
      return CardUtils.getCardValue(card)
    } catch (e) {
      // 如果失败，继续下面的逻辑
    }
  }
  
  // 如果有 value 属性（可能是字符串或数字）
  if (card.value !== undefined && card.value !== null) {
    // 如果是字符串，转为数字
    if (typeof card.value === 'string') {
      // 先查表（A/K/Q/J）
      const letterMap = {
        'A': 14, 'K': 13, 'Q': 12, 'J': 11
      }
      if (letterMap[card.value.toUpperCase()]) {
        return letterMap[card.value.toUpperCase()]
      }
      // 再尝试转数字
      const num = parseInt(card.value)
      return isNaN(num) ? 0 : num
    }
    // 如果是数字，直接返回
    return typeof card.value === 'number' ? card.value : 0
  }
  
  // 如果有 rank 属性
  if (card.rank) {
    const valueMap = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10
    }
    return valueMap[card.rank] || parseInt(card.rank) || 0
  }
  
  // 从 text 中提取
  if (card.text) {
    const text = card.text.replace(/[♠♥♣♦]/g, '')
    const valueMap = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10
    }
    return valueMap[text] || parseInt(text) || 0
  }
  
  return 0
}

/**
 * 计算手牌强度（0-100）- 儿童友好版（动态计算）
 * @param {Array} myCards - 我的手牌
 * @returns {Object} 手牌强度分析（小朋友能看懂）
 */
function calculateHandStrength(myCards) {
  const handType = evaluateHandType(myCards)
  
  console.log('🔍 牌型识别:', handType)
  
  // 根据牌型给出小朋友能听懂的解释
  const explanation = getHandExplanation(myCards, handType)
  
  console.log('📝 解释:', explanation)
  
  // 动态计算胜率（根据牌型和具体牌面值）
  const winRateEstimate = calculateWinRateDynamic(myCards, handType)
  
  console.log('📈 胜率计算:', winRateEstimate)
  
  // 根据牌型、胜率和牌面值给出建议
  const suggestion = getKidSuggestion(handType, winRateEstimate, myCards)
  
  console.log('💡 建议:', suggestion)
  
  return {
    handType: handType.type,
    handValue: handType.value,
    explanation: explanation,  // 小朋友能看懂的解释
    winRate: winRateEstimate,  // 胜率百分比
    suggestion: suggestion     // 建议
  }
}

/**
 * 获取手牌解释（小朋友能听懂的语言，根据具体牌面）
 */
function getHandExplanation(myCards, handType) {
  const cards = myCards || []
  if (cards.length < 3) return '牌还没发完呢'
  
  // 提取牌面信息
  const values = cards.map(c => getCardValue(c)).sort((a, b) => b - a)
  const suits = cards.map(c => c.suit || '')
  
  // 根据手牌类型和具体数值给出生动解释
  const type = handType.type
  
  // 豹子
  if (type === '豹子' || type === '🎉 豹子') {
    if (values[0] >= 14) {
      return `哇！三张 A 豹子！最大的豹子，几乎必胜！`
    } else if (values[0] >= 13) {
      return `哇！三张 K 豹子！超级大的牌！`
    } else if (values[0] >= 12) {
      return `哇！三张 Q 豹子！很大的牌！`
    } else if (values[0] >= 11) {
      return `哇！三张 J 豹子！不错的牌！`
    } else {
      return `哇！三张${values[0]}豹子！超级厉害的牌！`
    }
  }
  
  // 顺金
  else if (type === '顺金' || type === '✨ 顺金') {
    if (values[0] >= 14) {
      return `太棒了！A 开头的同花顺！无敌的牌！`
    } else if (values[0] >= 10) {
      return `太棒了！大顺金！三张连续的${getSuitName(suits[0])}！`
    } else {
      return `太棒了！同花顺！三张连续的${getSuitName(suits[0])}！`
    }
  }
  
  // 金花
  else if (type === '金花' || type === '🌟 金花') {
    if (values[0] >= 14) {
      return `好牌！${getSuitName(suits[0])}金花带 A！胜算很大！`
    } else if (values[0] >= 13) {
      return `好牌！${getSuitName(suits[0])}金花带 K！不错的牌！`
    } else {
      return `好牌！三张${getSuitName(suits[0])}金花！`
    }
  }
  
  // 顺子
  else if (type === '顺子') {
    if (values[0] >= 14) {
      return `不错！A 开头的顺子！挺大的！`
    } else if (values[0] >= 10) {
      return `不错！大顺子！三张连续的牌！`
    } else {
      return `不错！顺子！三张连续的牌！`
    }
  }
  
  // 对子
  else if (type === '对子') {
    // 找出对子是什么
    let pairValue = 0
    if (values[0] === values[1]) pairValue = values[0]
    else if (values[1] === values[2]) pairValue = values[1]
    
    const highCard = values.find(v => v !== pairValue) || values[2]
    
    if (pairValue >= 14) {
      return `你有一对 A 带${getCardRank({value: highCard})}！最大的对子！`
    } else if (pairValue >= 13) {
      return `你有一对 K 带${getCardRank({value: highCard})}！很大的对子！`
    } else if (pairValue >= 12) {
      return `你有一对 Q 带${getCardRank({value: highCard})}！不错的对子！`
    } else if (pairValue >= 11) {
      return `你有一对 J 带${getCardRank({value: highCard})}！还可以！`
    } else {
      return `你有一对${pairValue}带${getCardRank({value: highCard})}！`
    }
  }
  
  // 单张（散牌）
  else {
    // 计算总点数和个位数点数
    const points = myCards.map(c => {
      const rank = getCardRank(c)
      if (rank === 'A') return 1
      if (rank === 'J' || rank === 'Q' || rank === 'K') return 10
      return parseInt(rank) || 0
    })
    const totalPoints = points.reduce((sum, p) => sum + p, 0)
    const finalPoints = totalPoints % 10  // 取个位数（0-9 点）
    
    // 获取牌面
    const ranks = myCards.map(c => getCardRank(c))
    
    if (finalPoints >= 8) {
      return `你的牌是散牌${ranks.join('+')}=${totalPoints}点，个位${finalPoints}点，很大！`
    } else if (finalPoints >= 5) {
      return `你的牌是散牌${ranks.join('+')}=${totalPoints}点，个位${finalPoints}点，中等！`
    } else {
      return `你的牌是散牌${ranks.join('+')}=${totalPoints}点，个位${finalPoints}点，比较小，加油！`
    }
  }
}

/**
 * 获取花色名称
 */
function getSuitName(suit) {
  const suitNames = {
    '♠': '黑桃',
    '♥': '红心',
    '♣': '梅花',
    '♦': '方块'
  }
  return suitNames[suit] || '花色'
}

/**
 * 动态胜率计算（根据牌型和具体牌面值）
 * @param {Array} myCards - 我的手牌
 * @param {Object} handType - 牌型
 * @returns {Object} 胜率估算
 */
function calculateWinRateDynamic(myCards, handType) {
  const type = handType.type
  const baseValue = handType.value
  
  // 基础胜率（根据牌型）
  let baseRate = 0
  switch (type) {
    case '豹子': baseRate = 95; break
    case '顺金': baseRate = 90; break
    case '金花': baseRate = 75; break
    case '顺子': baseRate = 65; break
    case '对子': baseRate = 45; break
    default: baseRate = 25; // 单张
  }
  
  // 根据具体牌面值调整胜率
  const adjustment = calculateCardValueAdjustment(myCards, type)
  const finalRate = Math.min(99, Math.max(1, baseRate + adjustment))
  
  // 生成文字描述
  const text = getWinRateText(finalRate)
  
  return { rate: finalRate, text: text }
}

/**
 * 根据牌面值调整胜率
 */
function calculateCardValueAdjustment(myCards, handType) {
  if (!myCards || myCards.length < 3) return 0
  
  const values = myCards.map(c => getCardValue(c)).sort((a, b) => b - a)
  const type = handType.type
  let adjustment = 0
  
  // 豹子：根据点数调整
  if (type === '豹子' || type === '🎉 豹子') {
    if (values[0] >= 14) adjustment += 3  // A 豹子
    else if (values[0] >= 13) adjustment += 2  // K 豹子
    else if (values[0] >= 12) adjustment += 1  // Q 豹子
  }
  
  // 金花/顺金：根据最大牌和是否同花调整
  else if (type === '金花' || type === '🌟 金花' || type === '顺金' || type === '✨ 顺金') {
    if (values[0] >= 14) adjustment += 5  // 有 A
    else if (values[0] >= 13) adjustment += 3  // 有 K
    // 检查是否有大牌组合
    if (values[0] >= 14 && values[1] >= 12) adjustment += 3
  }
  
  // 对子：根据对子大小调整
  else if (type === '对子') {
    const pairValue = values[0] === values[1] ? values[0] : values[1]
    if (pairValue >= 14) adjustment += 8  // 对 A
    else if (pairValue >= 13) adjustment += 6  // 对 K
    else if (pairValue >= 12) adjustment += 4  // 对 Q
    else if (pairValue >= 11) adjustment += 2  // 对 J
    // 检查带牌
    if (values[2] >= 14) adjustment += 2  // 带 A
  }
  
  // 单张（散牌）：根据个位数点数调整（0-9 点）
  else if (type === '单张') {
    // 计算总点数和个位数
    const points = myCards.map(c => {
      const rank = getCardRank(c)
      if (rank === 'A') return 1
      if (rank === 'J' || rank === 'Q' || rank === 'K') return 10
      return parseInt(rank) || 0
    })
    const totalPoints = points.reduce((sum, p) => sum + p, 0)
    const finalPoints = totalPoints % 10  // 取个位数（0-9 点）
    
    // 根据个位数点数调整（9 点最大，0 点最小）
    if (finalPoints >= 9) adjustment += 10  // 9 点（最大）
    else if (finalPoints >= 8) adjustment += 8  // 8 点
    else if (finalPoints >= 7) adjustment += 6  // 7 点
    else if (finalPoints >= 6) adjustment += 4  // 6 点
    else if (finalPoints >= 5) adjustment += 2  // 5 点
    // 0-4 点不加分
  }
  
  return adjustment
}

/**
 * 生成胜率文字描述
 */
function getWinRateText(rate) {
  if (rate >= 90) return '几乎必胜'
  if (rate >= 80) return '胜率很高'
  if (rate >= 70) return '胜算较大'
  if (rate >= 60) return '有一定胜算'
  if (rate >= 50) return '五五开'
  if (rate >= 40) return '胜算一般'
  if (rate >= 30) return '胜算较小'
  return '需要运气'
}

/**
 * 给小朋友的建议（简单易懂，根据动态胜率）
 */
function getKidSuggestion(handType, winRate, myCards) {
  const rate = winRate.rate
  const type = handType.type
  
  // 根据胜率给出建议
  if (rate >= 85) {
    return {
      action: '加注',
      reason: `${type}！这么大的牌，赢定了！`,
      color: '#2ecc71',  // 绿色
      emoji: '💰'
    }
  } else if (rate >= 70) {
    return {
      action: '加注',
      reason: `牌很大，赢的机会很高！`,
      color: '#2ecc71',
      emoji: '💰'
    }
  } else if (rate >= 55) {
    return {
      action: '跟注',
      reason: '牌还不错，可以跟对手比比！',
      color: '#3498db',  // 蓝色
      emoji: '👍'
    }
  } else if (rate >= 40) {
    return {
      action: '小心',
      reason: '牌一般般，要小心对手哦！',
      color: '#f39c12',  // 橙色
      emoji: '🤔'
    }
  } else {
    return {
      action: '放弃',
      reason: '这局牌比较小，保存实力下次再战！',
      color: '#e74c3c',  // 红色
      emoji: '💪'
    }
  }
}

/**
 * 评估手牌类型
 * @param {Array} cards - 手牌数组
 * @returns {Object} 牌型结果
 */
function evaluateHandType(cards) {
  if (!cards || cards.length < 3) {
    return { type: 'unknown', value: 0 }
  }
  
  // 安全获取牌值和花色
  const values = cards.map(c => getCardValue(c))
  const suits = cards.map(c => c.suit || '')
  
  // 豹子（三张相同）
  if (values[0] === values[1] && values[1] === values[2]) {
    return { type: '豹子', value: 600 }
  }
  
  // 顺金（同花顺）
  const isSameSuit = suits[0] === suits[1] && suits[1] === suits[2]
  const isStraight = (values[0] - values[1] === 1 && values[1] - values[2] === 1)
  if (isSameSuit && isStraight) {
    return { type: '顺金', value: 500 }
  }
  
  // 金花（同花）
  if (isSameSuit) {
    return { type: '金花', value: 400 }
  }
  
  // 顺子
  if (isStraight) {
    return { type: '顺子', value: 300 }
  }
  
  // 对子
  if (values[0] === values[1] || values[1] === values[2]) {
    return { type: '对子', value: 200 }
  }
  
  // 单张
  return { type: '单张', value: 100 }
}

/**
 * 斗地主记牌器 - 记录已出的牌
 * @param {Array} myCards - 我的手牌
 * @param {Array} playedCards - 已出的牌
 * @returns {Object} 牌型统计
 */
function createCardCounter(myCards, playedCards) {
  // 初始化 54 张牌
  const allCards = createAllCards()
  const cardCount = {}
  
  // 统计所有牌的数量
  allCards.forEach(card => {
    const key = getCardKey(card)
    cardCount[key] = (cardCount[key] || 0) + 1
  })
  
  // 减去我手中的牌
  myCards.forEach(card => {
    const key = getCardKey(card)
    if (cardCount[key] > 0) {
      cardCount[key]--
    }
  })
  
  // 减去已出的牌
  playedCards.forEach(card => {
    const key = getCardKey(card)
    if (cardCount[key] > 0) {
      cardCount[key]--
    }
  })
  
  // 统计剩余牌
  const remaining = {}
  const gone = {}
  
  Object.entries(cardCount).forEach(([key, count]) => {
    const total = getTotalCount(key)
    const goneCount = total - count
    
    if (count > 0) {
      remaining[key] = count
    }
    if (goneCount > 0) {
      gone[key] = goneCount
    }
  })
  
  return {
    remaining,  // 剩余未出的牌
    gone,       // 已出的牌
    summary: generateSummary(remaining, gone)
  }
}

/**
 * 创建完整的 54 张牌
 */
function createAllCards() {
  const suits = ['♠', '♥', '♣', '♦']
  const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
  const cards = []
  
  suits.forEach(suit => {
    ranks.forEach(rank => {
      cards.push({ suit, rank, text: rank + suit })
    })
  })
  
  // 大小王
  cards.push({ suit: '', rank: 'Small', text: '🃏小王' })
  cards.push({ suit: '', rank: 'Big', text: '🃏大王' })
  
  return cards
}

/**
 * 获取牌的唯一标识
 */
function getCardKey(card) {
  return card.rank || card.text
}

/**
 * 获取某张牌的总数量
 */
function getTotalCount(rank) {
  if (rank === 'Small' || rank === 'Big') return 1
  if (rank === '2') return 4
  return 4
}

/**
 * 生成记牌器摘要
 */
function generateSummary(remaining, gone) {
  const summary = {
    totalRemaining: Object.values(remaining).reduce((a, b) => a + b, 0),
    kings: {
      small: remaining['Small'] || 0,
      big: remaining['Big'] || 0
    },
    twos: remaining['2'] || 0,
    aces: remaining['A'] || 0,
    hasBomb: checkPossibleBomb(remaining)
  }
  
  return summary
}

/**
 * 检查是否可能有炸弹
 */
function checkPossibleBomb(remaining) {
  return Object.values(remaining).some(count => count >= 4)
}

/**
 * 分析牌型（斗地主）
 * @param {Array} cards - 手牌
 * @returns {Object} 牌型分析
 */
function analyzeDouDiZhuHand(cards) {
  if (!cards || cards.length === 0) {
    return { type: 'empty', value: 0 }
  }
  
  const valueCount = {}
  cards.forEach(c => {
    const value = getCardValue(c)
    valueCount[value] = (valueCount[value] || 0) + 1
  })
  
  const values = Object.keys(valueCount).map(Number).sort((a, b) => b - a)
  
  // 单张
  if (cards.length === 1) {
    return { type: '单张', value: values[0], count: 1 }
  }
  
  // 对子
  if (cards.length === 2 && values.length === 1) {
    return { type: '对子', value: values[0], count: 2 }
  }
  
  // 三张
  if (cards.length === 3 && values.length === 1) {
    return { type: '三张', value: values[0], count: 3 }
  }
  
  // 三带一
  if (cards.length === 4 && values.length === 2) {
    const threeValue = values.find(v => valueCount[v] === 3)
    if (threeValue) {
      return { type: '三带一', value: threeValue, count: 4 }
    }
  }
  
  // 三带二（对子）
  if (cards.length === 5 && values.length === 2) {
    const threeValue = values.find(v => valueCount[v] === 3)
    const twoValue = values.find(v => valueCount[v] === 2)
    if (threeValue && twoValue) {
      return { type: '三带二', value: threeValue, count: 5 }
    }
  }
  
  // 炸弹
  if (cards.length === 4 && values.length === 1) {
    return { type: '炸弹', value: values[0], count: 4, isBomb: true }
  }
  
  // 王炸
  if (cards.length === 2) {
    const hasSmall = cards.some(c => c.rank === 'Small')
    const hasBig = cards.some(c => c.rank === 'Big')
    if (hasSmall && hasBig) {
      return { type: '王炸', value: 999, count: 2, isBomb: true }
    }
  }
  
  return { type: '复杂牌型', value: 0, count: cards.length }
}

/**
 * 出牌建议
 * @param {Array} myCards - 我的手牌
 * @param {Object} lastHand - 对手出的牌
 * @param {Object} cardCounter - 记牌器数据
 * @returns {Object} 出牌建议
 */
function getSuggestedPlay(myCards, lastHand, cardCounter) {
  if (!lastHand) {
    // 自由出牌，建议出最小的牌
    return suggestFreePlay(myCards)
  }
  
  // 需要管牌
  return suggestBeatHand(myCards, lastHand, cardCounter)
}

/**
 * 自由出牌建议
 */
function suggestFreePlay(myCards) {
  if (!myCards || myCards.length === 0) return null
  
  // 排序
  const sorted = [...myCards].sort((a, b) => getCardValue(a) - getCardValue(b))
  
  // 建议出最小的单张
  return {
    suggestion: '出最小单张',
    cards: [sorted[0]],
    reason: '先出小牌，保留大牌'
  }
}

/**
 * 管牌建议
 */
function suggestBeatHand(myCards, lastHand, cardCounter) {
  const lastType = lastHand.type
  const lastValue = lastHand.value
  
  // 寻找能管上的牌
  const playableCards = findBeatingCards(myCards, lastType, lastValue)
  
  if (playableCards && playableCards.length > 0) {
    return {
      suggestion: '可以管上',
      cards: playableCards,
      reason: `用${playableCards.length}张牌管上对手`,
      canBeat: true
    }
  } else {
    return {
      suggestion: '要不起',
      cards: [],
      reason: '没有能管上的牌',
      canBeat: false
    }
  }
}

/**
 * 寻找能管上的牌
 */
function findBeatingCards(myCards, lastType, lastValue) {
  const valueCount = {}
  myCards.forEach(c => {
    const value = getCardValue(c)
    valueCount[value] = (valueCount[value] || 0) + 1
  })
  
  // 单张
  if (lastType === '单张') {
    for (const [value, count] of Object.entries(valueCount)) {
      if (Number(value) > lastValue && count > 0) {
        return [myCards.find(c => getCardValue(c) === Number(value))]
      }
    }
  }
  
  // 对子
  if (lastType === '对子') {
    for (const [value, count] of Object.entries(valueCount)) {
      if (Number(value) > lastValue && count >= 2) {
        const cards = myCards.filter(c => getCardValue(c) === Number(value)).slice(0, 2)
        return cards
      }
    }
  }
  
  // 三张
  if (lastType === '三张') {
    for (const [value, count] of Object.entries(valueCount)) {
      if (Number(value) > lastValue && count >= 3) {
        const cards = myCards.filter(c => getCardValue(c) === Number(value)).slice(0, 3)
        return cards
      }
    }
  }
  
  return null
}

module.exports = {
  calculateHandStrength,  // 儿童友好版
  evaluateHandType,
  getCardValue,
  // 斗地主功能
  createCardCounter,
  analyzeDouDiZhuHand,
  getSuggestedPlay
}
