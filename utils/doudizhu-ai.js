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
   * 尝试管牌
   */
  tryToBeat(hand, lastHand, aggressiveRate = 0.5) {
    const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
    
    if (!beatingCards || beatingCards.length === 0) {
      return null // 要不起
    }
    
    // 根据难度决定是否出牌
    if (Math.random() > aggressiveRate) {
      return null // 即使能管也选择不要
    }
    
    // 选择最小的能管上的牌
    return this.selectSmallestBeatingCards(beatingCards, hand)
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
