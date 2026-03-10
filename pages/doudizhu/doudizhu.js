// pages/doudizhu/doudizhu.js - 儿童简化版斗地主
const CardUtils = require('../../utils/cards.js')

Page({
  data: {
    round: 1,
    myPoints: 100,
    myCards: [],
    myCardsDisplay: [],
    landlordCards: [],
    landlordCardsDisplay: [],
    myHandType: null,
    landlordHandType: null,
    showLandlordCards: false,
    gamePhase: 'dealing', // 'dealing', 'ready', 'result'
    message: '发牌中...',
    showResult: false,
    resultEmoji: '',
    resultTitle: '',
    resultPoints: '',
    showConfetti: false,
    countdown: 3,
    countdownTimer: null,
    isLandlord: false, // 是否当地主
    landlordScore: 0 // 叫地主分数
  },

  onLoad() {
    this.loadUserInfo()
    this.startNewRound()
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {
      nickname: '小朋友',
      totalPoints: 100,
      winCount: 0,
      playCount: 0
    }
    this.setData({
      myPoints: userInfo.totalPoints || 100
    })
  },

  startNewRound() {
    this.setData({
      gamePhase: 'dealing',
      message: '🃏 发牌中...',
      showResult: false,
      showConfetti: false,
      myHandType: null,
      landlordHandType: null,
      showLandlordCards: false,
      isLandlord: false,
      landlordScore: 0
    })

    // 发牌动画
    setTimeout(() => {
      // 初始化牌堆（去掉大小王，简化版）
      const deck = this.createDouDiZhuDeck()
      CardUtils.shuffle(deck)
      
      // 发牌：玩家 17 张，地主 20 张（多 3 张底牌）
      const myCards = CardUtils.dealCards(deck, 17)
      const landlordCards = CardUtils.dealCards(deck, 20)
      
      // 排序手牌
      myCards.sort((a, b) => CardUtils.getCardValue(b) - CardUtils.getCardValue(a))
      landlordCards.sort((a, b) => CardUtils.getCardValue(b) - CardUtils.getCardValue(a))
      
      // 评估牌型
      const myType = this.evaluateDouDiZhuHand(myCards)
      const landlordType = this.evaluateDouDiZhuHand(landlordCards)
      
      // 准备显示数据
      const myCardsDisplay = myCards.map(c => ({
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦'
      }))
      
      const landlordCardsDisplay = landlordCards.map(c => ({
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦'
      }))
      
      // 随机决定谁当地主（简化版）
      const isLandlord = Math.random() > 0.5
      
      this.setData({
        myCards: myCards,
        landlordCards: landlordCards,
        myCardsDisplay: myCardsDisplay,
        landlordCardsDisplay: landlordCardsDisplay,
        myHandType: myType,
        landlordHandType: landlordType,
        showLandlordCards: false,
        gamePhase: 'ready',
        message: isLandlord ? '✨ 你是地主！加油！' : '✨ 准备挑战地主！',
        isLandlord: isLandlord
      })
    }, 800)
  },

  // 创建斗地主牌堆（去掉大小王）
  createDouDiZhuDeck() {
    const suits = ['♠', '♥', '♣', '♦']
    const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
    const deck = []
    
    for (let suit of suits) {
      for (let value of values) {
        deck.push({ suit, value })
      }
    }
    
    return deck
  },

  // 评估斗地主牌型（简化版）
  evaluateDouDiZhuHand(cards) {
    if (cards.length === 0) return { type: 'invalid', value: 0 }
    
    const values = cards.map(c => CardUtils.getCardValue(c))
    const valueCount = {}
    
    // 统计每个点数的数量
    values.forEach(v => {
      valueCount[v] = (valueCount[v] || 0) + 1
    })
    
    // 找出炸弹、三条、对子等
    let bombCount = 0
    let tripleCount = 0
    let pairCount = 0
    
    Object.values(valueCount).forEach(count => {
      if (count === 4) bombCount++
      else if (count === 3) tripleCount++
      else if (count === 2) pairCount++
    })
    
    // 有 2 的数量
    const twoCount = valueCount[14] || 0
    
    // 计算牌力值
    let value = 0
    value += bombCount * 1000
    value += tripleCount * 100
    value += pairCount * 10
    value += twoCount * 50
    
    // 牌型描述
    let type = '普通牌'
    if (bombCount > 0) {
      type = `💣 炸弹×${bombCount}`
    } else if (tripleCount >= 2) {
      type = `✈️ 飞机×${tripleCount}`
    } else if (tripleCount > 0) {
      type = `🎯 三条×${tripleCount}`
    } else if (pairCount >= 3) {
      type = `👫 对子×${pairCount}`
    }
    
    if (twoCount > 0) {
      type += ` + 2×${twoCount}`
    }
    
    return { type, value }
  },

  // 开始游戏
  startGame() {
    this.setData({
      message: '🎲 开始比牌！',
      showLandlordCards: true
    })
    
    setTimeout(() => {
      this.endRound()
    }, 1000)
  },

  // 结束回合
  endRound() {
    const { myHandType, landlordHandType, myPoints, isLandlord } = this.data
    
    // 比较牌力
    const compare = CardUtils.compareHands(myHandType, landlordHandType)
    
    let win = false
    let pointsChange = 0
    let resultEmoji = ''
    let resultTitle = ''
    let message = ''
    
    if (compare > 0) {
      // 赢了
      win = true
      pointsChange = 30
      resultEmoji = '🎉'
      resultTitle = isLandlord ? '地主胜利！' : '农民胜利！'
      message = '🎉 你赢了这局！'
    } else if (compare < 0) {
      // 输了
      win = false
      pointsChange = -15
      resultEmoji = '💪'
      resultTitle = '加油哦！'
      message = isLandlord ? '地主输了！' : '农民输了！'
    } else {
      // 平局
      win = true
      pointsChange = 15
      resultEmoji = '🌟'
      resultTitle = '平局啦！'
      message = '✨ 平局！你也很厉害～'
    }
    
    // 更新积分
    const newPoints = Math.max(0, myPoints + pointsChange)
    
    this.setData({
      myPoints: newPoints,
      message: message,
      gamePhase: 'result',
      showResult: true,
      resultEmoji: resultEmoji,
      resultTitle: resultTitle,
      resultPoints: pointsChange > 0 ? `+${pointsChange} 分` : `${pointsChange} 分`,
      showConfetti: win,
      countdown: 3
    })
    
    // 保存用户信息
    this.saveUserInfo(newPoints, win)
    
    // 启动自动关闭倒计时
    this.startCountdown()
  },

  nextRound() {
    this.setData({
      round: this.data.round + 1
    })
    this.startNewRound()
  },

  saveUserInfo(points, win) {
    const userInfo = wx.getStorageSync('userInfo') || {
      nickname: '小朋友',
      totalPoints: 100,
      winCount: 0,
      playCount: 0
    }
    userInfo.totalPoints = points
    userInfo.playCount = (userInfo.playCount || 0) + 1
    if (win) {
      userInfo.winCount = (userInfo.winCount || 0) + 1
    }
    wx.setStorageSync('userInfo', userInfo)
    getApp().globalData.userInfo = userInfo
  },

  // 返回首页
  goHome() {
    wx.navigateBack()
  },

  // 启动倒计时
  startCountdown() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }
    
    const timer = setInterval(() => {
      const newCountdown = this.data.countdown - 1
      
      if (newCountdown <= 0) {
        clearInterval(timer)
        this.closeResult()
      } else {
        this.setData({
          countdown: newCountdown
        })
      }
    }, 1000)
    
    this.setData({
      countdownTimer: timer
    })
  },

  // 关闭结果弹窗
  closeResult() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
      this.setData({
        countdownTimer: null
      })
    }
    
    this.setData({
      showResult: false,
      showConfetti: false,
      countdown: 0
    })
  },

  // 阻止点击内容区域关闭
  stopClose() {
    // 空函数，阻止事件冒泡
  }
})
