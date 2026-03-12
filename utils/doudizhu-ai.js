/**
 * 斗地主 AI 策略模块 - 优化版
 * 基于成熟的斗地主 AI 算法
 * @author 小主人
 * @since 2026-03-12
 */

const DouDiZhuUtils = require('./doudizhu.js')

/**
 * AI 难度等级
 */
const AIDifficulty = {
  EASY: 'easy',
  NORMAL: 'normal',
  HELL: 'hell'
}

/**
 * 牌型权重（用于评估牌力）
 */
const HAND_WEIGHTS = {
  'single': 1,
  'pair': 2,
  'triple': 3,
  'tripleWithOne': 4,
  'tripleWithPair': 5,
  'sequence': 6,
  'pairSequence': 7,
  'airplane': 8,
  'airplaneWithOne': 9,
  'airplaneWithPair': 10,
  'fourWithTwo': 11,
  'fourWithTwoPairs': 12,
  'bomb': 100,
  'rocket': 200
}

/**
 * 牌值权重（2 最大，3 最小）
 */
const CARD_VALUES = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12,
  'K': 13, 'A': 14, '2': 15, '小王': 16, '大王': 17
}

/**
 * AI 出牌策略类
 */
class DouDiZhuAI {
  constructor(difficulty = AIDifficulty.NORMAL) {
    this.difficulty = difficulty
    this.playedCards = []
    this.rememberedCards = new Set()
  }

  /**
   * 选择出牌（主入口）
   */
  selectCards(hand, lastHand = null, isFree = false) {
    // 记录已出的牌
    if (lastHand && lastHand.cards) {
      lastHand.cards.forEach(c => this.rememberedCards.add(c.value + c.suit))
    }

    switch (this.difficulty) {
      case AIDifficulty.EASY:
        return this.easyStrategy(hand, lastHand, isFree)
      case AIDifficulty.NORMAL:
        return this.normalStrategy(hand, lastHand, isFree)
      case AIDifficulty.HELL:
        return this.hellStrategy(hand, lastHand, isFree)
      default:
        return this.normalStrategy(hand, lastHand, isFree)
    }
  }

  /**
   * 简单难度 - 随机出牌
   */
  easyStrategy(hand, lastHand, isFree) {
    if (isFree) {
      // 随机出小牌
      const sorted = [...hand].sort((a, b) => 
        this.getCardValue(a) - this.getCardValue(b)
      )
      return [sorted[Math.floor(Math.random() * Math.min(3, sorted.length))]]
    } else {
      // 50% 概率管牌
      if (Math.random() < 0.5) {
        const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
        if (beatingCards && beatingCards.length > 0) {
          return beatingCards[Math.floor(Math.random() * beatingCards.length)]
        }
      }
      return null
    }
  }

  /**
   * 普通难度 - 基本策略
   */
  normalStrategy(hand, lastHand, isFree) {
    if (isFree) {
      return this.playNormalFree(hand)
    } else {
      return this.playNormalBeat(hand, lastHand)
    }
  }

  /**
   * 地狱难度 - 智能策略（基于规则和牌力评估）
   */
  hellStrategy(hand, lastHand, isFree) {
    if (isFree) {
      return this.playHellFree(hand)
    } else {
      return this.playHellBeat(hand, lastHand)
    }
  }

  /**
   * 普通难度自由出牌
   */
  playNormalFree(hand) {
    const analysis = DouDiZhuUtils.analyzeHand(hand)
    
    // 优先出最小的单张
    if (analysis.singles && analysis.singles.length > 0) {
      return [analysis.singles[0]]
    }
    
    // 其次出最小的对子
    if (analysis.pairs && analysis.pairs.length > 0) {
      return analysis.pairs[0]
    }
    
    // 出最小的牌
    const sorted = [...hand].sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
    return [sorted[0]]
  }

  /**
   * 普通难度管牌
   */
  playNormalBeat(hand, lastHand) {
    const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
    
    if (!beatingCards || beatingCards.length === 0) {
      return null
    }
    
    // 70% 概率管牌
    if (Math.random() > 0.7) {
      return null
    }
    
    // 选择最小的能管上的牌
    return this.selectSmallestBeatingCards(beatingCards)
  }

  /**
   * 地狱难度自由出牌 - 智能选择最优牌型
   */
  playHellFree(hand) {
    // 1. 先分析手牌结构
    const handInfo = this.analyzeHandStructure(hand)
    
    // 2. 如果剩牌少，直接出最小的
    if (hand.length <= 5) {
      return this.playAllRemaining(hand)
    }
    
    // 3. 有炸弹保留
    if (handInfo.hasBomb && handInfo.bombs.length > 0) {
      return this.playWithoutBomb(hand, handInfo)
    }
    
    // 4. 优先出组合牌型（不拆牌）
    // 4.1 顺子
    if (handInfo.sequences && handInfo.sequences.length > 0) {
      return handInfo.sequences[0]
    }
    
    // 4.2 连对
    if (handInfo.pairSequences && handInfo.pairSequences.length > 0) {
      return handInfo.pairSequences[0]
    }
    
    // 4.3 飞机
    if (handInfo.airplanes && handInfo.airplanes.length > 0) {
      return handInfo.airplanes[0]
    }
    
    // 4.4 三带一
    if (handInfo.triplesWithOne && handInfo.triplesWithOne.length > 0) {
      return handInfo.triplesWithOne[0]
    }
    
    // 4.5 三带二
    if (handInfo.triplesWithPair && handInfo.triplesWithPair.length > 0) {
      return handInfo.triplesWithPair[0]
    }
    
    // 5. 没有组合牌型，出最小单张
    if (handInfo.singles && handInfo.singles.length > 0) {
      return [handInfo.singles[0]]
    }
    
    // 6. 出最小对子
    if (handInfo.pairs && handInfo.pairs.length > 0) {
      return handInfo.pairs[0]
    }
    
    // 默认出最小牌
    const sorted = [...hand].sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
    return [sorted[0]]
  }

  /**
   * 地狱难度管牌 - 智能判断是否值得管
   */
  playHellBeat(hand, lastHand) {
    const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
    
    if (!beatingCards || beatingCards.length === 0) {
      return null // 真的要不起
    }
    
    // 1. 分析对手牌型
    const opponentType = lastHand.type
    const opponentValue = lastHand.value
    
    // 2. 判断是否是小牌
    const isSmallHand = this.isSmallHand(lastHand)
    
    // 3. 判断是否是大牌
    const isBigHand = this.isBigHand(lastHand)
    
    // 4. 判断是否是关键牌型
    const isKeyHand = this.isKeyHandType(opponentType)
    
    // 5. 智能决策
    if (isSmallHand) {
      // 小牌优先管，用小牌管
      return this.selectSmallestBeatingCards(beatingCards)
    }
    
    if (isBigHand) {
      // 大牌谨慎管
      if (isKeyHand) {
        // 关键牌型（三带、飞机等），优先管
        return this.selectOptimalBeatingCards(beatingCards, hand)
      }
      // 非关键大牌，30% 概率管
      if (Math.random() < 0.3) {
        return this.selectOptimalBeatingCards(beatingCards, hand)
      }
      return null
    }
    
    // 普通牌型，90% 概率管
    if (Math.random() < 0.9) {
      return this.selectOptimalBeatingCards(beatingCards, hand)
    }
    return null
  }

  /**
   * 分析手牌结构
   */
  analyzeHandStructure(hand) {
    const info = {
      singles: [],
      pairs: [],
      triples: [],
      bombs: [],
      sequences: [],
      pairSequences: [],
      airplanes: [],
      triplesWithOne: [],
      triplesWithPair: [],
      hasBomb: false
    }
    
    // 统计每个点数的牌数
    const valueCount = {}
    hand.forEach(c => {
      const value = c.value
      valueCount[value] = (valueCount[value] || 0) + 1
    })
    
    // 分类
    Object.keys(valueCount).forEach(value => {
      const count = valueCount[value]
      const cards = hand.filter(c => c.value === value)
      
      if (count === 1) {
        info.singles.push(cards[0])
      } else if (count === 2) {
        info.pairs.push(cards)
      } else if (count === 3) {
        info.triples.push(cards)
      } else if (count === 4) {
        info.bombs.push(cards)
        info.hasBomb = true
      }
    })
    
    // 排序
    info.singles.sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
    info.pairs.sort((a, b) => this.getCardValue(a[0]) - this.getCardValue(b[0]))
    info.triples.sort((a, b) => this.getCardValue(a[0]) - this.getCardValue(b[0]))
    
    return info
  }

  /**
   * 选择最小的能管上的牌
   */
  selectSmallestBeatingCards(beatingCards) {
    if (!beatingCards || beatingCards.length === 0) return null
    
    let smallestCards = beatingCards[0]
    let smallestValue = Infinity
    
    for (const cards of beatingCards) {
      const value = this.calculateHandValue(cards)
      if (value < smallestValue) {
        smallestValue = value
        smallestCards = cards
      }
    }
    
    return smallestCards
  }

  /**
   * 选择最优的能管上的牌
   */
  selectOptimalBeatingCards(beatingCards, hand) {
    if (!beatingCards || beatingCards.length === 0) return null
    
    let bestCards = beatingCards[0]
    let bestScore = -Infinity
    
    for (const cards of beatingCards) {
      const score = this.calculateBeatScore(cards, hand)
      if (score > bestScore) {
        bestScore = score
        bestCards = cards
      }
    }
    
    return bestCards
  }

  /**
   * 计算管牌得分
   */
  calculateBeatScore(cards, hand) {
    let score = 0
    
    // 1. 牌数越少得分越高
    score += (10 - cards.length) * 10
    
    // 2. 不拆散好牌型得分高
    const cardsAnalysis = DouDiZhuUtils.analyzeHand(cards)
    if (cardsAnalysis.type !== 'single' && cardsAnalysis.type !== 'invalid') {
      score += 50
    }
    
    // 3. 不拆炸弹得分高
    if (this.willBreakBomb(cards, hand)) {
      score -= 100
    }
    
    // 4. 保留控制牌（2、王）得分高
    const hasControlCard = cards.some(c => 
      c.value === '2' || c.value === '小王' || c.value === '大王'
    )
    if (!hasControlCard) {
      score += 20
    }
    
    return score
  }

  /**
   * 计算牌型值
   */
  calculateHandValue(cards) {
    if (!cards || cards.length === 0) return Infinity
    
    let value = 0
    for (const card of cards) {
      value += this.getCardValue(card)
    }
    return value / cards.length
  }

  /**
   * 获取牌值
   */
  getCardValue(card) {
    if (!card) return 0
    const values = {
      '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
      '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12,
      'K': 13, 'A': 14, '2': 15, '小王': 16, '大王': 17
    }
    return values[card.value] || 0
  }

  /**
   * 判断是否是小牌型
   */
  isSmallHand(lastHand) {
    const smallTypes = ['single', 'pair']
    return smallTypes.includes(lastHand.type) && lastHand.value < 10
  }

  /**
   * 判断是否是大牌型
   */
  isBigHand(lastHand) {
    const bigTypes = ['bomb', 'rocket', 'airplane', 'fourWithTwo']
    return bigTypes.includes(lastHand.type) || lastHand.value >= 14
  }

  /**
   * 判断是否是关键牌型
   */
  isKeyHandType(type) {
    const keyTypes = ['tripleWithOne', 'tripleWithPair', 'airplane', 
                      'airplaneWithOne', 'airplaneWithPair', 'sequence', 'pairSequence']
    return keyTypes.includes(type)
  }

  /**
   * 是否会拆散炸弹
   */
  willBreakBomb(cardsToPlay, hand) {
    const handValues = hand.map(c => c.value)
    const playValues = cardsToPlay.map(c => c.value)
    
    const valueCounts = {}
    handValues.forEach(v => valueCounts[v] = (valueCounts[v] || 0) + 1)
    
    for (const value of playValues) {
      if (valueCounts[value] === 4) {
        return true
      }
    }
    
    return false
  }

  /**
   * 出完所有剩余牌
   */
  playAllRemaining(hand) {
    return hand
  }

  /**
   * 不出炸弹，出其他牌
   */
  playWithoutBomb(hand, handInfo) {
    // 优先出单张
    if (handInfo.singles && handInfo.singles.length > 0) {
      return [handInfo.singles[0]]
    }
    
    // 其次出对子
    if (handInfo.pairs && handInfo.pairs.length > 0) {
      return handInfo.pairs[0]
    }
    
    // 默认出最小牌
    const sorted = [...hand].sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
    return [sorted[0]]
  }

  /**
   * 重置 AI 状态
   */
  reset() {
    this.playedCards = []
    this.rememberedCards = new Set()
  }
}

module.exports = {
  DouDiZhuAI,
  AIDifficulty
}
