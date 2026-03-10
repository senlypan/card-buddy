// pages/doudizhu/doudizhu.js - 简化版斗地主出牌对战
const CardUtils = require('../../utils/cards.js')

Page({
  data: {
    round: 1,
    myPoints: 100,
    myCards: [],
    myCardsDisplay: [],
    landlordCards: [],
    landlordCardsDisplay: [],
    showLandlordCards: false,
    gamePhase: 'dealing', // 'dealing', 'playing', 'result'
    message: '发牌中...',
    showResult: false,
    resultEmoji: '',
    resultTitle: '',
    resultPoints: '',
    showConfetti: false,
    countdown: 3,
    countdownTimer: null,
    isLandlord: false, // 是否当地主
    isMyTurn: true, // 是否轮到我出牌
    lastHand: null, // 最后出的牌
    lastHandPlayer: null, // 最后出牌的人 'me' or 'landlord'
    myHandType: null,
    landlordHandType: null,
    passCount: 0 // 连续不要次数
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
      showLandlordCards: false,
      isLandlord: false,
      isMyTurn: true,
      lastHand: null,
      lastHandPlayer: null,
      myHandType: null,
      landlordHandType: null,
      passCount: 0
    })

    setTimeout(() => {
      // 初始化牌堆（去掉大小王）
      const deck = this.createDouDiZhuDeck()
      CardUtils.shuffle(deck)
      
      // 发牌：玩家 17 张，地主 20 张
      const myCards = CardUtils.dealCards(deck, 17)
      const landlordCards = CardUtils.dealCards(deck, 20)
      
      // 排序手牌
      myCards.sort((a, b) => CardUtils.getCardValue(b) - CardUtils.getCardValue(a))
      landlordCards.sort((a, b) => CardUtils.getCardValue(b) - CardUtils.getCardValue(a))
      
      // 准备显示数据
      const myCardsDisplay = myCards.map(c => ({
        ...c,
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦',
        selected: false
      }))
      
      const landlordCardsDisplay = landlordCards.map(c => ({
        ...c,
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦'
      }))
      
      // 随机决定谁当地主
      const isLandlord = Math.random() > 0.5
      
      this.setData({
        myCards: myCards,
        myCardsDisplay: myCardsDisplay,
        landlordCards: landlordCards,
        landlordCardsDisplay: landlordCardsDisplay,
        isLandlord: isLandlord,
        gamePhase: 'playing',
        message: isLandlord ? '✨ 你是地主！你先出牌！' : '✨ 你是农民！准备出牌！',
        isMyTurn: isLandlord // 地主先出
      })
    }, 800)
  },

  // 创建斗地主牌堆
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

  // 选择/取消选择牌
  toggleCard(e) {
    const index = e.currentTarget.dataset.index
    
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    const myCardsDisplay = this.data.myCardsDisplay
    myCardsDisplay[index].selected = !myCardsDisplay[index].selected
    
    this.setData({
      myCardsDisplay: myCardsDisplay
    })
  },

  // 出牌
  playCards() {
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    // 获取选中的牌
    const selectedCards = this.data.myCardsDisplay.filter(c => c.selected)
    
    if (selectedCards.length === 0) {
      wx.showToast({
        title: '请选择要出的牌',
        icon: 'none'
      })
      return
    }
    
    // 检查牌型是否合法
    const handType = this.evaluateHand(selectedCards)
    
    if (handType.type === 'invalid') {
      wx.showToast({
        title: '牌型不合法',
        icon: 'none'
      })
      return
    }
    
    // 检查是否能管上
    if (this.data.lastHand && this.data.lastHandPlayer !== 'me') {
      if (handType.value <= this.data.lastHand.value) {
        wx.showToast({
          title: '牌型不够大',
          icon: 'none'
        })
        return
      }
    }
    
    // 移除选中的牌
    const myCards = this.data.myCards.filter(c => 
      !selectedCards.find(s => s.text === CardUtils.cardToString(c))
    )
    const myCardsDisplay = this.data.myCardsDisplay.filter(c => !c.selected)
    
    // 更新状态
    this.setData({
      myCards: myCards,
      myCardsDisplay: myCardsDisplay,
      lastHand: handType,
      lastHandPlayer: 'me',
      passCount: 0,
      isMyTurn: false,
      message: '你出了牌，等待牌牌...'
    })
    
    // 检查是否获胜
    if (myCards.length === 0) {
      this.endRound('me')
      return
    }
    
    // 牌牌 AI 出牌
    setTimeout(() => {
      this.landlordAI()
    }, 1500)
  },

  // 不要
  pass() {
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    if (!this.data.lastHand || this.data.lastHandPlayer === 'me') {
      wx.showToast({
        title: '你是先手，不能不要',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      passCount: this.data.passCount + 1,
      isMyTurn: false,
      message: '你不要，等待牌牌...'
    })
    
    // 如果连续两次不要，重新出牌
    if (this.data.passCount >= 2) {
      this.setData({
        isMyTurn: true,
        lastHand: null,
        lastHandPlayer: null,
        passCount: 0,
        message: '轮到你出牌！'
      })
    } else {
      setTimeout(() => {
        this.landlordAI()
      }, 1000)
    }
  },

  // 牌牌 AI 出牌
  landlordAI() {
    const { landlordCards, lastHand, lastHandPlayer } = this.data
    
    // 如果是先手，随机出一张牌
    if (!lastHand || lastHandPlayer === 'landlord') {
      const randomIndex = Math.floor(Math.random() * landlordCards.length)
      const card = landlordCards[randomIndex]
      
      const newCards = landlordCards.filter((_, i) => i !== randomIndex)
      const newCardsDisplay = this.data.landlordCardsDisplay.filter((_, i) => i !== randomIndex)
      
      const handType = this.evaluateHand([card])
      
      this.setData({
        landlordCards: newCards,
        landlordCardsDisplay: newCardsDisplay,
        lastHand: handType,
        lastHandPlayer: 'landlord',
        passCount: 0,
        isMyTurn: true,
        message: '牌牌出了牌，轮到你！'
      })
      
      // 检查是否获胜
      if (newCards.length === 0) {
        this.endRound('landlord')
      }
      return
    }
    
    // 尝试管牌
    const canBeat = this.findBeatingCard(landlordCards, lastHand)
    
    if (canBeat) {
      // 能管上
      const cardIndex = canBeat.index
      const card = landlordCards[cardIndex]
      
      const newCards = landlordCards.filter((_, i) => i !== cardIndex)
      const newCardsDisplay = this.data.landlordCardsDisplay.filter((_, i) => i !== cardIndex)
      
      const handType = this.evaluateHand([card])
      
      this.setData({
        landlordCards: newCards,
        landlordCardsDisplay: newCardsDisplay,
        lastHand: handType,
        lastHandPlayer: 'landlord',
        passCount: 0,
        isMyTurn: true,
        message: '牌牌管上了，轮到你！'
      })
      
      // 检查是否获胜
      if (newCards.length === 0) {
        this.endRound('landlord')
      }
    } else {
      // 要不起
      this.setData({
        passCount: this.data.passCount + 1,
        isMyTurn: true,
        message: '牌牌要不起，轮到你！'
      })
      
      // 如果对方要不起，重新出牌
      if (this.data.passCount >= 1) {
        this.setData({
          lastHand: null,
          lastHandPlayer: null,
          passCount: 0,
          message: '轮到你出牌！'
        })
      }
    }
  },

  // 找能管上的牌
  findBeatingCard(cards, lastHand) {
    // 简化版：找一张比对方大的单牌
    for (let i = 0; i < cards.length; i++) {
      const cardValue = CardUtils.getCardValue(cards[i])
      if (cardValue > lastHand.value) {
        return { index: i, card: cards[i] }
      }
    }
    return null
  },

  // 评估牌型（简化版）
  evaluateHand(cards) {
    if (cards.length === 0) return { type: 'invalid', value: 0 }
    
    if (cards.length === 1) {
      const value = CardUtils.getCardValue(cards[0])
      return { type: '单张', value: value }
    }
    
    // 检查对子
    if (cards.length === 2) {
      const v1 = CardUtils.getCardValue(cards[0])
      const v2 = CardUtils.getCardValue(cards[1])
      if (v1 === v2) {
        return { type: '对子', value: v1 }
      }
    }
    
    // 其他牌型暂时不支持
    return { type: 'invalid', value: 0 }
  },

  // 结束回合
  endRound(winner) {
    const { myPoints, isLandlord } = this.data
    
    const isMeWin = winner === 'me'
    
    let win = false
    let pointsChange = 0
    let resultEmoji = ''
    let resultTitle = ''
    let message = ''
    
    if (isMeWin) {
      win = true
      pointsChange = 30
      resultEmoji = '🎉'
      resultTitle = isLandlord ? '地主胜利！' : '农民胜利！'
      message = '🎉 你赢了这局！'
    } else {
      win = false
      pointsChange = -15
      resultEmoji = '💪'
      resultTitle = '加油哦！'
      message = isLandlord ? '地主输了！' : '农民输了！'
    }
    
    const newPoints = Math.max(0, myPoints + pointsChange)
    
    this.setData({
      myPoints: newPoints,
      gamePhase: 'result',
      showResult: true,
      resultEmoji: resultEmoji,
      resultTitle: resultTitle,
      resultPoints: pointsChange > 0 ? `+${pointsChange} 分` : `${pointsChange} 分`,
      showConfetti: win,
      countdown: 3
    })
    
    this.saveUserInfo(newPoints, win)
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

  goHome() {
    wx.navigateBack()
  },

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

  stopClose() {
    // 空函数，阻止事件冒泡
  }
})
