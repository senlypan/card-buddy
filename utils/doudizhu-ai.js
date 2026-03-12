/**
 * 斗地主 AI 策略模块 - 专业版
 * 基于成熟斗地主 AI 算法和高手策略
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
 * 牌型价值排序（高手策略）
 * 长牌 > 短牌，组合 > 单张
 */
const HAND_VALUE_ORDER = {
  'rocket': 100,        // 王炸
  'bomb': 90,           // 炸弹
  'airplaneWithPair': 80, // 飞机带对
  'airplaneWithOne': 75,  // 飞机带单
  'airplane': 70,         // 飞机
  'fourWithTwoPairs': 65, // 四带两对
  'fourWithTwo': 60,      // 四带二
  'pairSequence': 55,     // 连对
  'sequence': 50,         // 顺子
  'tripleWithPair': 45,   // 三带二
  'tripleWithOne': 40,    // 三带一
  'triple': 35,           // 三张
  'pair': 20,             // 对子
  'single': 10            // 单张
}

/**
 * 控制牌（关键牌）
 */
const CONTROL_CARDS = ['大王', '小王', '2', 'A']

/**
 * AI 出牌策略类
 */
class DouDiZhuAI {
  constructor(difficulty = AIDifficulty.NORMAL, isLandlord = false) {
    this.difficulty = difficulty
    this.isLandlord = isLandlord
    this.playedCards = []
    this.rememberedCards = new Set()
    this.handStructure = null
    this.controlCount = 0
  }

  /**
   * 选择出牌（主入口）
   */
  selectCards(hand, lastHand = null, isFree = false) {
    // 记录已出的牌（记牌技巧）
    if (lastHand && lastHand.cards) {
      lastHand.cards.forEach(c => {
        this.rememberedCards.add(c.value + c.suit)
        this.playedCards.push(c)
      })
    }

    // 分析手牌结构
    this.handStructure = this.analyzeHandStructure(hand)
    
    // 计算控制牌数量
    this.controlCount = this.countControlCards(hand)

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
      const sorted = [...hand].sort((a, b) => 
        this.getCardValue(a) - this.getCardValue(b)
      )
      return [sorted[Math.floor(Math.random() * Math.min(3, sorted.length))]]
    } else {
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
   * 地狱难度 - 专业高手策略
   * 基于：规划优先、牌型价值、控制权、手数原则
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
    if (this.handStructure.singles && this.handStructure.singles.length > 0) {
      return [this.handStructure.singles[0]]
    }
    if (this.handStructure.pairs && this.handStructure.pairs.length > 0) {
      return this.handStructure.pairs[0]
    }
    const sorted = [...hand].sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
    return [sorted[0]]
  }

  /**
   * 普通难度管牌
   */
  playNormalBeat(hand, lastHand) {
    const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
    if (!beatingCards || beatingCards.length === 0) return null
    if (Math.random() > 0.7) return null
    return this.selectSmallestBeatingCards(beatingCards)
  }

  /**
   * 地狱难度自由出牌 - 专业策略
   * 核心：长牌优先、减少手数、保留控制牌、不拆组合
   */
  playHellFree(hand) {
    // 1. 剩牌少（≤5 张），直接出最小牌
    if (hand.length <= 5) {
      return this.playAllRemaining(hand)
    }

    // 2. 有炸弹，先出其他牌（炸弹关键时刻用）
    if (this.handStructure.hasBomb) {
      return this.playWithoutBomb(hand)
    }

    // 3. 按牌型价值排序，优先出价值高的牌型（长牌优先）
    const bestHand = this.findBestHandToPlay()
    if (bestHand) {
      return bestHand
    }

    // 4. 没有组合牌型，出最小单张（确保不拆对子和三张）
    if (this.handStructure.singles && this.handStructure.singles.length > 0) {
      // 出最小的真单张
      return [this.handStructure.singles[0]]
    }

    // 5. 出最小对子（确保不拆三张）
    if (this.handStructure.pairs && this.handStructure.pairs.length > 0) {
      return this.handStructure.pairs[0]
    }

    // 6. 万不得已，出最小牌
    const sorted = [...hand].sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
    return [sorted[0]]
  }

  /**
   * 地狱难度管牌 - 专业策略
   * 核心：能不管就不管、不拆牌、不用大牌管小牌、保留关键牌
   */
  playHellBeat(hand, lastHand) {
    const beatingCards = DouDiZhuUtils.findBeatingCards(hand, lastHand)
    
    if (!beatingCards || beatingCards.length === 0) {
      return null // 真的要不起
    }

    // 【管牌三原则】
    // 原则 1: 不轻易拆牌
    if (this.willBreakGoodHand(beatingCards, hand)) {
      return null // 会拆散好牌，不管
    }

    // 原则 2: 不用大牌管小牌
    if (this.isBigCardBeatingSmall(lastHand, beatingCards)) {
      // 判断是否必须管
      if (!this.mustBeat(lastHand)) {
        return null // 不用大牌管小牌
      }
    }

    // 原则 3: 关键牌保留（王、2、炸弹）
    if (this.isControlCardBeating(beatingCards)) {
      if (!this.mustBeat(lastHand)) {
        return null // 保留关键牌
      }
    }

    // 【必须管的情况】
    // 1. 对手快出完（剩 2 张牌）
    if (this.opponentIsNearWin(lastHand)) {
      return this.selectOptimalBeatingCards(beatingCards, hand)
    }

    // 2. 对手出长牌（顺子、飞机等）
    if (this.isLongHand(lastHand)) {
      return this.selectOptimalBeatingCards(beatingCards, hand)
    }

    // 3. 对手在配合（农民喂牌）
    if (this.isOpponentCooperating(lastHand)) {
      return this.selectOptimalBeatingCards(beatingCards, hand)
    }

    // 【普通情况】
    // 小牌优先管
    if (this.isSmallHand(lastHand)) {
      return this.selectSmallestBeatingCards(beatingCards)
    }

    // 大牌谨慎管
    if (this.isBigHand(lastHand)) {
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
   * 分析手牌结构 - 优先保留组合牌型
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
      fourWithTwo: [],
      hasBomb: false,
      handValue: 0,
      handCount: 0
    }

    // 第一步：统计每个点数的牌数
    const valueCount = {}
    const cardsByValue = {}
    
    hand.forEach(c => {
      const value = c.value
      valueCount[value] = (valueCount[value] || 0) + 1
      if (!cardsByValue[value]) cardsByValue[value] = []
      cardsByValue[value].push(c)
    })

    // 第二步：优先识别组合牌型（三张、炸弹）
    Object.keys(valueCount).forEach(value => {
      const count = valueCount[value]
      const cards = cardsByValue[value]
      
      if (count === 4) {
        info.bombs.push(cards)
        info.hasBomb = true
      } else if (count === 3) {
        info.triples.push(cards)
      }
    })

    // 第三步：识别三带一、三带二（优先组合）
    const usedValues = new Set()
    
    // 尝试用三张带单张
    info.triples.forEach(triple => {
      const tripleValue = triple[0].value
      usedValues.add(tripleValue)
      
      // 找一个最小的单张来带
      const availableSingles = hand.filter(c => 
        c.value !== tripleValue && !usedValues.has(c.value)
      )
      
      if (availableSingles.length > 0) {
        // 找最小的单张
        availableSingles.sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
        const single = availableSingles[0]
        usedValues.add(single.value)
        
        info.triplesWithOne.push([...triple, single])
      }
    })
    
    // 第四步：识别对子和剩余单张（不拆三张和炸弹）
    Object.keys(valueCount).forEach(value => {
      const count = valueCount[value]
      const cards = cardsByValue[value]
      
      // 三张、炸弹、已使用的牌跳过
      if (count === 3 || count === 4 || usedValues.has(value)) return
      
      if (count === 2) {
        info.pairs.push(cards)
      } else if (count === 1) {
        info.singles.push(cards[0])
      }
    })

    // 排序（从小到大）
    info.singles.sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
    info.pairs.sort((a, b) => this.getCardValue(a[0]) - this.getCardValue(b[0]))
    info.triples.sort((a, b) => this.getCardValue(a[0]) - this.getCardValue(b[0]))

    // 计算手数和牌型价值
    info.handCount = this.calculateHandCount(info)
    info.handValue = this.calculateHandValue(info)

    return info
  }

  /**
   * 找出最优出牌（按牌型价值排序）
   * 核心：长牌优先，不拆组合
   */
  findBestHandToPlay() {
    // 按价值排序：飞机 > 顺子 > 连对 > 三带 > 四带 > 对子 > 单张
    
    // 1. 飞机（优先级最高）
    if (this.handStructure.airplanes && this.handStructure.airplanes.length > 0) {
      return this.handStructure.airplanes[0]
    }
    
    // 2. 顺子
    if (this.handStructure.sequences && this.handStructure.sequences.length > 0) {
      return this.handStructure.sequences[0]
    }
    
    // 3. 连对
    if (this.handStructure.pairSequences && this.handStructure.pairSequences.length > 0) {
      return this.handStructure.pairSequences[0]
    }
    
    // 4. 三带二
    if (this.handStructure.triplesWithPair && this.handStructure.triplesWithPair.length > 0) {
      return this.handStructure.triplesWithPair[0]
    }
    
    // 5. 三带一
    if (this.handStructure.triplesWithOne && this.handStructure.triplesWithOne.length > 0) {
      return this.handStructure.triplesWithOne[0]
    }
    
    // 6. 四带二
    if (this.handStructure.fourWithTwo && this.handStructure.fourWithTwo.length > 0) {
      return this.handStructure.fourWithTwo[0]
    }
    
    // 7. 三张（不带的）
    if (this.handStructure.triples && this.handStructure.triples.length > 0) {
      return this.handStructure.triples[0]
    }
    
    // 8. 四带两对
    if (this.handStructure.fourWithTwoPairs && this.handStructure.fourWithTwoPairs.length > 0) {
      return this.handStructure.fourWithTwoPairs[0]
    }
    
    // 没有组合牌型，返回 null（让后续逻辑出最小单张或对子）
    return null
  }

  /**
   * 选择最小的能管上的牌
   */
  selectSmallestBeatingCards(beatingCards) {
    if (!beatingCards || beatingCards.length === 0) return null
    
    let smallestCards = beatingCards[0]
    let smallestValue = Infinity
    
    for (const cards of beatingCards) {
      const value = this.calculateCardsValue(cards)
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
    
    // 4. 保留控制牌得分高
    const hasControlCard = cards.some(c => 
      CONTROL_CARDS.includes(c.value)
    )
    if (!hasControlCard) {
      score += 20
    }
    
    // 5. 牌型价值高得分高
    const handType = cardsAnalysis.type
    if (HAND_VALUE_ORDER[handType]) {
      score += HAND_VALUE_ORDER[handType]
    }
    
    return score
  }

  /**
   * 计算牌值
   */
  calculateCardsValue(cards) {
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
   * 计算手牌手数
   */
  calculateHandCount(structure) {
    let count = 0
    if (structure.sequences) count += structure.sequences.length
    if (structure.pairSequences) count += structure.pairSequences.length
    if (structure.airplanes) count += structure.airplanes.length
    if (structure.triplesWithPair) count += structure.triplesWithPair.length
    if (structure.triplesWithOne) count += structure.triplesWithOne.length
    if (structure.fourWithTwo) count += structure.fourWithTwo.length
    if (structure.triples) count += structure.triples.length
    if (structure.pairs) count += structure.pairs.length
    if (structure.singles) count += structure.singles.length
    if (structure.bombs) count += structure.bombs.length
    return count
  }

  /**
   * 计算牌型价值
   */
  calculateHandValue(structure) {
    let value = 0
    if (structure.sequences) {
      structure.sequences.forEach(seq => {
        value += HAND_VALUE_ORDER['sequence'] || 0
      })
    }
    if (structure.pairSequences) {
      structure.pairSequences.forEach(seq => {
        value += HAND_VALUE_ORDER['pairSequence'] || 0
      })
    }
    if (structure.airplanes) {
      structure.airplanes.forEach(plane => {
        value += HAND_VALUE_ORDER['airplane'] || 0
      })
    }
    return value
  }

  /**
   * 计算控制牌数量
   */
  countControlCards(hand) {
    return hand.filter(c => CONTROL_CARDS.includes(c.value)).length
  }

  /**
   * 是否会拆散好牌
   */
  willBreakGoodHand(cardsToPlay, hand) {
    // 检查是否会拆散顺子、连对、飞机等
    const playValues = cardsToPlay.map(c => c.value)
    
    // 检查是否会拆散顺子
    if (this.handStructure.sequences && this.handStructure.sequences.length > 0) {
      for (const seq of this.handStructure.sequences) {
        const seqValues = seq.map(c => c.value)
        if (playValues.some(v => seqValues.includes(v))) {
          return true
        }
      }
    }
    
    // 检查是否会拆散连对
    if (this.handStructure.pairSequences && this.handStructure.pairSequences.length > 0) {
      for (const pairSeq of this.handStructure.pairSequences) {
        const pairValues = pairSeq.map(c => c.value)
        if (playValues.some(v => pairValues.includes(v))) {
          return true
        }
      }
    }
    
    return false
  }

  /**
   * 是否用大牌管小牌
   */
  isBigCardBeatingSmall(lastHand, beatingCards) {
    const lastHandValue = lastHand.value || 0
    const beatingValue = this.calculateCardsValue(beatingCards)
    
    // 如果对手出的是小牌（<10），我们用大牌（>13）管
    return lastHandValue < 10 && beatingValue > 13
  }

  /**
   * 是否用控制牌管
   */
  isControlCardBeating(beatingCards) {
    return beatingCards.some(c => CONTROL_CARDS.includes(c.value))
  }

  /**
   * 是否必须管牌
   */
  mustBeat(lastHand) {
    // 对手快出完（剩 2 张）
    if (this.opponentIsNearWin(lastHand)) {
      return true
    }
    
    // 对手出长牌
    if (this.isLongHand(lastHand)) {
      return true
    }
    
    return false
  }

  /**
   * 对手是否快出完
   */
  opponentIsNearWin(lastHand) {
    // 简化判断：如果对手出的是大牌，可能快出完了
    return lastHand.value >= 15
  }

  /**
   * 是否是长牌型
   */
  isLongHand(lastHand) {
    const longTypes = ['sequence', 'pairSequence', 'airplane', 'airplaneWithOne', 'airplaneWithPair']
    return longTypes.includes(lastHand.type)
  }

  /**
   * 是否是对手在配合
   */
  isOpponentCooperating(lastHand) {
    // 简化判断：如果对手出的是小牌且牌型整齐，可能在配合
    return lastHand.value < 8 && this.isLongHand(lastHand)
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
    const bigTypes = ['bomb', 'rocket']
    return bigTypes.includes(lastHand.type) || lastHand.value >= 14
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
  playWithoutBomb(hand) {
    if (this.handStructure.singles && this.handStructure.singles.length > 0) {
      return [this.handStructure.singles[0]]
    }
    if (this.handStructure.pairs && this.handStructure.pairs.length > 0) {
      return this.handStructure.pairs[0]
    }
    const sorted = [...hand].sort((a, b) => this.getCardValue(a) - this.getCardValue(b))
    return [sorted[0]]
  }

  /**
   * 重置 AI 状态
   */
  reset() {
    this.playedCards = []
    this.rememberedCards = new Set()
    this.handStructure = null
    this.controlCount = 0
  }
}

module.exports = {
  DouDiZhuAI,
  AIDifficulty
}
