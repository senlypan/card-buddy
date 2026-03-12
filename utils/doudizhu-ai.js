/**
 * 斗地主 AI 策略模块 - 三个难度等级
 * @author 小主人
 * @since 2026-03-12
 */

const DouDiZhuUtils = require('./doudizhu.js')

/**
 * AI 难度等级
 */
const AIDifficulty = {
  EASY: 'easy',      // 简单 - 随机出牌，偶尔出大牌
  NORMAL: 'normal',  // 普通 - 基本策略，会记牌
  HELL: 'hell'       // 地狱 - 完美策略，精确计算
}

/**
 * 牌型权重
 */
const HandWeights = {
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
  'bomb': 20,
  'rocket': 30
}

/**
 * AI 出牌策略类
 */
class DouDiZhuAI {
  constructor(difficulty = AIDifficulty.NORMAL) {
    this.difficulty = difficulty
    this.playedCards = [] // 已出的牌
    this.rememberedCards = [] // 记住的牌（用于普通和地狱难度）
  }

  /**
   * 选择出牌
   * @param {Array} hand - 手牌
   * @param {Object} lastHand - 上一手牌
   * @param {Boolean} isFree - 是否自由出牌（无人管）
   * @returns {Array} 要出的牌
   */
  selectCards(hand, lastHand = null, isFree = false) {
    // 记录已出的牌
    if (lastHand) {
      this.rememberCards(lastHand.cards)
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
   * 简单难度 AI - 随机出牌，偶尔出大牌
   */
  easyStrategy(hand, lastHand, isFree) {
    if (isFree) {
      // 自由出牌：随机出一张小牌
      return this.playRandomSmallCard(hand)
    } else {
      // 跟牌：50% 概率跟牌，50% 概率不要
      if (Math.random() < 0.5) {
        return this.tryToBeat(hand, lastHand, 0.3) // 30% 概率出大牌
      } else {
        return null // 不要
      }
    }
  }

  /**
   * 普通难度 AI - 基本策略，会记牌
   */
  normalStrategy(hand, lastHand, isFree) {
    if (isFree) {
      // 自由出牌：出最小的牌型
      return this.playSmallestHand(hand)
    } else {
      // 跟牌：如果能管上就管，优先用小牌管
      return this.tryToBeat(hand, lastHand, 0.7) // 70% 概率出大牌
    }
  }

  /**
   * 地狱难度 AI - 完美策略，精确计算
   */
  hellStrategy(hand, lastHand, isFree) {
    if (isFree) {
      // 自由出牌：根据牌局情况选择最优牌型
      return this.playOptimalHand(hand)
    } else {
      // 跟牌：精确计算是否值得管
      return this.tryToBeat(hand, lastHand, 0.9) // 90% 概率出大牌
    }
  }

  /**
   * 随机出小牌（简单难度）
   */
  playRandomSmallCard(hand) {
    const sortedHand = [...hand].sort((a, b) => 
      DouDiZhuUtils.getCardValue(a) - DouDiZhuUtils.getCardValue(b)
    )
    
    // 从前 5 张小牌中随机选一张
    const randomIndex = Math.floor(Math.random() * Math.min(5, sortedHand.length))
    return [sortedHand[randomIndex]]
  }

  /**
   * 出最小的牌型（普通难度）
   */
  playSmallestHand(hand) {
    // 分析手牌，找出最小的牌型
    const handAnalysis = DouDiZhuUtils.analyzeHand(hand)
    
    // 优先出单张
    if (handAnalysis.singles && handAnalysis.singles.length > 0) {
      const smallestSingle = handAnalysis.singles[0]
      return [smallestSingle]
    }
    
    // 其次出对子
    if (handAnalysis.pairs && handAnalysis.pairs.length > 0) {
      const smallestPair = handAnalysis.pairs[0]
      return smallestPair
    }
    
    // 其他牌型...
    return [hand[0]]
  }

  /**
   * 出最优牌型（地狱难度）- 优先出组合牌型
   */
  playOptimalHand(hand) {
    // 完整分析手牌
    const handAnalysis = DouDiZhuUtils.analyzeHand(hand)
    
    // 计算剩余牌数
    const remainingCards = 54 - hand.length - this.playedCards.length
    
    // 根据牌局情况选择策略
    if (hand.length <= 5) {
      // 剩牌少，尽快出完
      return this.playAllRemaining(hand)
    }
    
    if (this.hasBomb(hand)) {
      // 有炸弹，保留到最后
      return this.playWithoutBomb(hand)
    }
    
    // 地狱难度：优先出组合牌型（不拆牌）
    // 1. 优先出顺子（5 个或以上连续单牌）
    if (handAnalysis.sequences && handAnalysis.sequences.length > 0) {
      const smallestSequence = handAnalysis.sequences[0]
      return smallestSequence
    }
    
    // 2. 优先出连对（3 个或以上连续对子）
    if (handAnalysis.pairSequences && handAnalysis.pairSequences.length > 0) {
      const smallestPairSeq = handAnalysis.pairSequences[0]
      return smallestPairSeq
    }
    
    // 3. 优先出飞机（2 个或以上连续三张）
    if (handAnalysis.airplanes && handAnalysis.airplanes.length > 0) {
      const smallestAirplane = handAnalysis.airplanes[0]
      return smallestAirplane
    }
    
    // 4. 优先出三带一
    if (handAnalysis.triplesWithOne && handAnalysis.triplesWithOne.length > 0) {
      const smallestTripleWithOne = handAnalysis.triplesWithOne.cards
      return smallestTripleWithOne
    }
    
    // 5. 优先出三带二
    if (handAnalysis.triplesWithPair && handAnalysis.triplesWithPair.length > 0) {
      const smallestTripleWithPair = handAnalysis.triplesWithPair.cards
      return smallestTripleWithPair
    }
    
    // 6. 优先出四带二
    if (handAnalysis.fourWithTwo && handAnalysis.fourWithTwo.length > 0) {
      const smallestFourWithTwo = handAnalysis.fourWithTwo.cards
      return smallestFourWithTwo
    }
    
    // 7. 有炸弹先保留
    if (handAnalysis.bombs && handAnalysis.bombs.length > 0) {
      // 炸弹留到最后，先出其他牌
      return this.playWithoutBomb(hand)
    }
    
    // 8. 最后才出单张或对子
    if (handAnalysis.triples && handAnalysis.triples.length > 0) {
      return handAnalysis.triples[0]
    }
    
    if (handAnalysis.pairs && handAnalysis.pairs.length > 0) {
      return handAnalysis.pairs[0]
    }
    
    if (handAnalysis.singles && handAnalysis.singles.length > 0) {
      return [handAnalysis.singles[0]]
    }
    
    // 默认出最小牌
    return [hand[0]]
  }

  /**
   * 尝试管牌 - 根据难度使用不同策略
   */
  tryToBeat(hand, lastHand, aggressiveRate = 0.5) {
    if (!lastHand) return null
    
    // 地狱难度：智能管牌，会计算是否值得管
    if (this.difficulty === AIDifficulty.HELL) {
      return this.hellBeatStrategy(hand, lastHand)
    }
    
    // 普通难度：基本管牌
    if (this.difficulty === AIDifficulty.NORMAL) {
      return this.normalBeatStrategy(hand, lastHand, aggressiveRate)
    }
    
    // 简单难度：随机管牌
    return this.easyBeatStrategy(hand, lastHand, aggressiveRate)
  }
  
  /**
   * 简单难度管牌策略 - 50% 概率管，随机出牌
   */
  easyBeatStrategy(hand, lastHand, aggressiveRate) {
    // 50% 概率直接不要
    if (Math.random() < 0.5) {
      return null
    }
    
    const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
    if (!beatingCards || beatingCards.length === 0) {
      return null
    }
    
    // 随机选一组能管上的牌
    const randomIndex = Math.floor(Math.random() * beatingCards.length)
    return beatingCards[randomIndex]
  }
  
  /**
   * 普通难度管牌策略 - 会管牌，优先用小牌管
   */
  normalBeatStrategy(hand, lastHand, aggressiveRate) {
    const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
    if (!beatingCards || beatingCards.length === 0) {
      return null
    }
    
    // 70% 概率管牌
    if (Math.random() > aggressiveRate) {
      return null
    }
    
    // 选择最小的能管上的牌
    return this.selectSmallestBeatingCards(beatingCards, hand)
  }
  
  /**
   * 地狱难度管牌策略 - 智能管牌，精确计算
   */
  hellBeatStrategy(hand, lastHand) {
    const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
    if (!beatingCards || beatingCards.length === 0) {
      return null // 真的要不起
    }
    
    // 分析手牌和对手牌型
    const myHandAnalysis = DouDiZhuUtils.analyzeHand(hand)
    const opponentHand = lastHand
    
    // 策略 1: 如果对手出的是小牌型，且我有更小的牌能管，优先管
    if (this.isSmallHand(lastHand) && this.hasSmallerBeatingCards(beatingCards)) {
      return this.selectSmallestBeatingCards(beatingCards, hand)
    }
    
    // 策略 2: 如果对手出的是大牌型，评估是否值得管
    if (this.isBigHand(lastHand)) {
      // 如果是关键牌型（如三带、飞机等），优先管
      if (this.isKeyHandType(lastHand.type)) {
        return this.selectOptimalBeatingCards(beatingCards, hand)
      }
      // 否则保留实力
      if (Math.random() < 0.3) {
        return this.selectOptimalBeatingCards(beatingCards, hand)
      }
      return null
    }
    
    // 策略 3: 正常情况，选择最优牌管
    return this.selectOptimalBeatingCards(beatingCards, hand)
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
    return bigTypes.includes(lastHand.type) || lastHand.value >= 12
  }
  
  /**
   * 判断是否是关键牌型
   */
  isKeyHandType(type) {
    const keyTypes = ['tripleWithOne', 'tripleWithPair', 'airplane', 'airplaneWithOne', 'airplaneWithPair']
    return keyTypes.includes(type)
  }
  
  /**
   * 是否有更小的牌能管
   */
  hasSmallerBeatingCards(beatingCards) {
    // 选择最小的管牌
    const smallest = this.selectSmallestBeatingCards(beatingCards, [])
    return smallest && smallest.length > 0
  }
  
  /**
   * 选择最小的能管上的牌
   */
  selectSmallestBeatingCards(beatingCards, hand) {
    if (!beatingCards || beatingCards.length === 0) return null
    
    // 选择牌数最少的
    let smallestCards = beatingCards[0]
    let smallestValue = this.calculateHandValue(beatingCards[0])
    
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
   * 选择最优的能管上的牌（地狱难度）
   */
  selectOptimalBeatingCards(beatingCards, hand) {
    if (!beatingCards || beatingCards.length === 0) return null
    
    // 优先保留炸弹和好牌
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
    
    // 牌数越少得分越高
    score += (10 - cards.length) * 10
    
    // 不拆散好牌得分高
    const handAnalysis = DouDiZhuUtils.analyzeHand(hand)
    const cardsAnalysis = DouDiZhuUtils.analyzeHand(cards)
    
    // 如果管牌后仍保持好牌型，得分高
    if (cardsAnalysis.type !== 'single') {
      score += 50
    }
    
    // 不拆炸弹得分高
    if (this.willBreakBomb(cards, hand)) {
      score -= 100
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
      value += DouDiZhuUtils.getCardValue(card)
    }
    return value / cards.length
  }
  
  /**
   * 是否会拆散炸弹
   */
  willBreakBomb(cardsToPlay, hand) {
    // 简单判断：如果手中有 4 张相同的牌，出牌会拆散，则返回 true
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
   * 选择最小的能管上的牌
   */
  selectSmallestBeatingCards(beatingCards, hand) {
    // 选择权重最小的牌型
    let bestCards = beatingCards[0]
    let bestWeight = Infinity
    
    for (const cards of beatingCards) {
      const weight = this.calculateHandWeight(cards)
      if (weight < bestWeight) {
        bestWeight = weight
        bestCards = cards
      }
    }
    
    return bestCards
  }

  /**
   * 计算牌型权重
   */
  calculateHandWeight(cards) {
    const handType = DouDiZhuUtils.analyzeHand(cards)
    return HandWeights[handType.type] || 0
  }

  /**
   * 记牌
   */
  rememberCards(cards) {
    cards.forEach(card => {
      if (!this.playedCards.find(c => c.value === card.value && c.suit === card.suit)) {
        this.playedCards.push(card)
      }
    })
  }

  /**
   * 是否有炸弹
   */
  hasBomb(hand) {
    const analysis = DouDiZhuUtils.analyzeHand(hand)
    return analysis.bombs && analysis.bombs.length > 0
  }

  /**
   * 出完所有剩余牌
   */
  playAllRemaining(hand) {
    return hand
  }

  /**
   * 不出炸弹
   */
  playWithoutBomb(hand) {
    const analysis = DouDiZhuUtils.analyzeHand(hand)
    
    // 找出非炸弹的牌
    const nonBombCards = []
    if (analysis.singles) nonBombCards.push(...analysis.singles)
    if (analysis.pairs) nonBombCards.push(...analysis.pairs[0])
    
    if (nonBombCards.length > 0) {
      return [nonBombCards[0]]
    }
    
    return [hand[0]]
  }

  /**
   * 重置 AI 状态
   */
  reset() {
    this.playedCards = []
    this.rememberedCards = []
  }
}

module.exports = {
  DouDiZhuAI,
  AIDifficulty
}
