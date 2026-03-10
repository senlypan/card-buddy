// utils/cards.js - 扑克牌工具函数（儿童友好版）

// 创建一副牌（去掉大小王）
function createDeck() {
  const suits = ['♠', '♥', '♣', '♦']
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const deck = []
  
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value })
    }
  }
  
  return deck
}

// 洗牌
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// 发牌
function dealCards(deck, count) {
  return deck.splice(0, count)
}

// 牌转为字符串显示
function cardToString(card) {
  return card.value + card.suit
}

// 获取牌的数值（用于比较）
function getCardValue(card) {
  const valueMap = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  }
  return valueMap[card.value]
}

// 评估牌型（炸金花）
// 返回：{ type: 牌型名称，value: 用于比较的值，values: 所有牌的数值（用于详细比较） }
function evaluateHand(cards) {
  if (cards.length !== 3) return { type: 'invalid', value: 0, values: [] }
  
  const values = cards.map(c => getCardValue(c)).sort((a, b) => b - a)
  const suits = cards.map(c => c.suit)
  
  // 检查是否同花
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2]
  
  // 检查是否顺子
  const isStraight = (values[0] - values[1] === 1) && (values[1] - values[2] === 1)
  
  // 检查对子/三条
  const isTriple = values[0] === values[1] && values[1] === values[2]
  const isPair = values[0] === values[1] || values[1] === values[2] || values[0] === values[2]
  
  // 豹子（三条）- 最大
  if (isTriple) {
    return { type: '🎉 豹子', value: 1000 + values[0], values: values }
  }
  
  // 顺金（同花顺）
  if (isFlush && isStraight) {
    return { type: '✨ 顺金', value: 900 + values[0], values: values }
  }
  
  // 金花（同花）
  if (isFlush) {
    return { type: '🌟 金花', value: 700 + values[0], values: values }
  }
  
  // 顺子
  if (isStraight) {
    return { type: '📶 顺子', value: 600 + values[0], values: values }
  }
  
  // 对子
  if (isPair) {
    let pairValue
    if (values[0] === values[1]) pairValue = values[0]
    else if (values[1] === values[2]) pairValue = values[1]
    else pairValue = values[0]
    return { type: '👫 对子', value: 500 + pairValue, values: values }
  }
  
  // 单张（比最大牌）
  return { type: '🂡 单张', value: values[0], values: values }
}

// 比较两手牌（完整比较逻辑）
function compareHands(hand1, hand2) {
  // 首先比较牌型
  if (hand1.value > hand2.value) return 1
  if (hand1.value < hand2.value) return -1
  
  // 牌型相同，逐张比较牌面
  const values1 = hand1.values || []
  const values2 = hand2.values || []
  
  for (let i = 0; i < Math.min(values1.length, values2.length); i++) {
    if (values1[i] > values2[i]) return 1
    if (values1[i] < values2[i]) return -1
  }
  
  // 所有牌都一样，才是真正的平局
  return 0
}

// 获取牌型说明（给小朋友看）
function getHandTypeDescription(type) {
  const descriptions = {
    '🎉 豹子': '三张一样的牌！超级厉害！',
    '✨ 顺金': '同花顺！太棒啦！',
    '🌟 金花': '三张同花色！很好哦！',
    '📶 顺子': '三张连续的牌！不错呢！',
    '👫 对子': '有一对牌！继续加油！',
    '🂡 单张': '比单张大小～别灰心！'
  }
  return descriptions[type] || '加油！'
}

module.exports = {
  createDeck,
  shuffle,
  dealCards,
  cardToString,
  getCardValue,
  evaluateHand,
  compareHands,
  getHandTypeDescription
}
