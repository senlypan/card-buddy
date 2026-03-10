// pages/doudizhu/doudizhu.js - 优化版
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
    gamePhase: 'dealing',
    message: '发牌中...',
    showResult: false,
    resultEmoji: '',
    resultTitle: '',
    resultPoints: '',
    showConfetti: false,
    countdown: 3,
    countdownTimer: null,
    isLandlord: false,
    isMyTurn: true,
    lastHand: null,
    lastHandPlayer: null,
    lastHandCards: [], // 最后出的牌（显示用）
    myHandType: null,
    landlordHandType: null,
    passCount: 0,
    cardsRows: [] // 手牌分行显示
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
      lastHandCards: [],
      myHandType: null,
      landlordHandType: null,
      passCount: 0,
      cardsRows: []
    })

    setTimeout(() => {
      const deck = this.createDouDiZhuDeck()
      CardUtils.shuffle(deck)
      
      const myCards = CardUtils.dealCards(deck, 17)
      const landlordCards = CardUtils.dealCards(deck, 20)
      
      myCards.sort((a, b) => CardUtils.getCardValue(b) - CardUtils.getCardValue(a))
      landlordCards.sort((a, b) => CardUtils.getCardValue(b) - CardUtils.getCardValue(a))
      
      const myCardsDisplay = myCards.map((c, i) => ({
        ...c,
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦',
        selected: false,
        index: i
      }))
      
      const landlordCardsDisplay = landlordCards.map(c => ({
        ...c,
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦'
      }))
      
      const isLandlord = Math.random() > 0.5
      
      // 分行显示手牌（每行最多 9 张）
      const cardsRows = this.splitCardsToRows(myCardsDisplay, 9)
      
      this.setData({
        myCards: myCards,
        myCardsDisplay: myCardsDisplay,
        landlordCards: landlordCards,
        landlordCardsDisplay: landlordCardsDisplay,
        isLandlord: isLandlord,
        gamePhase: 'playing',
        message: isLandlord ? '✨ 你是地主！你先出牌！' : '✨ 你是农民！准备出牌！',
        isMyTurn: isLandlord,
        cardsRows: cardsRows
      })
    }, 800)
  },

  // 分行显示手牌
  splitCardsToRows(cards, perRow) {
    const rows = []
    for (let i = 0; i < cards.length; i += perRow) {
      rows.push(cards.slice(i, i + perRow))
    }
    return rows.length > 0 ? rows : [[]]
  },

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

  toggleCard(e) {
    const index = e.currentTarget.dataset.index
    
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    const myCardsDisplay = this.data.myCardsDisplay
    const cardIndex = myCardsDisplay.findIndex(c => c.index === index)
    
    if (cardIndex !== -1) {
      myCardsDisplay[cardIndex].selected = !myCardsDisplay[cardIndex].selected
      
      this.setData({
        myCardsDisplay: myCardsDisplay,
        cardsRows: this.splitCardsToRows(myCardsDisplay, 9)
      })
    }
  },

  playCards() {
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    const selectedCards = this.data.myCardsDisplay.filter(c => c.selected)
    
    if (selectedCards.length === 0) {
      wx.showToast({
        title: '请选择要出的牌',
        icon: 'none'
      })
      return
    }
    
    const handType = this.evaluateHand(selectedCards)
    
    if (handType.type === 'invalid') {
      wx.showToast({
        title: '牌型不合法',
        icon: 'none'
      })
      return
    }
    
    if (this.data.lastHand && this.data.lastHandPlayer !== 'me') {
      if (handType.value <= this.data.lastHand.value) {
        wx.showToast({
          title: '牌型不够大',
          icon: 'none'
        })
        return
      }
    }
    
    const selectedTexts = selectedCards.map(c => c.text)
    const myCards = this.data.myCards.filter(c => 
      !selectedTexts.includes(CardUtils.cardToString(c))
    )
    const myCardsDisplay = this.data.myCardsDisplay.filter(c => !c.selected)
    
    this.setData({
      myCards: myCards,
      myCardsDisplay: myCardsDisplay,
      lastHand: handType,
      lastHandPlayer: 'me',
      lastHandCards: selectedCards,
      passCount: 0,
      isMyTurn: false,
      message: '你出了牌，等待牌牌...',
      cardsRows: this.splitCardsToRows(myCardsDisplay, 9)
    })
    
    if (myCards.length === 0) {
      this.endRound('me')
      return
    }
    
    setTimeout(() => {
      this.landlordAI()
    }, 1500)
  },

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
    
    if (this.data.passCount >= 2) {
      this.setData({
        isMyTurn: true,
        lastHand: null,
        lastHandPlayer: null,
        lastHandCards: [],
        passCount: 0,
        message: '轮到你出牌！'
      })
    } else {
      setTimeout(() => {
        this.landlordAI()
      }, 1000)
    }
  },

  landlordAI() {
    const { landlordCards, lastHand, lastHandPlayer } = this.data
    
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
        lastHandCards: [card],
        passCount: 0,
        isMyTurn: true,
        message: '牌牌出了牌，轮到你！'
      })
      
      if (newCards.length === 0) {
        this.endRound('landlord')
      }
      return
    }
    
    const canBeat = this.findBeatingCard(landlordCards, lastHand)
    
    if (canBeat) {
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
        lastHandCards: [card],
        passCount: 0,
        isMyTurn: true,
        message: '牌牌管上了，轮到你！'
      })
      
      if (newCards.length === 0) {
        this.endRound('landlord')
      }
    } else {
      this.setData({
        passCount: this.data.passCount + 1,
        isMyTurn: true,
        message: '牌牌要不起，轮到你！'
      })
      
      if (this.data.passCount >= 1) {
        this.setData({
          lastHand: null,
          lastHandPlayer: null,
          lastHandCards: [],
          passCount: 0,
          message: '轮到你出牌！'
        })
      }
    }
  },

  findBeatingCard(cards, lastHand) {
    for (let i = 0; i < cards.length; i++) {
      const cardValue = CardUtils.getCardValue(cards[i])
      if (cardValue > lastHand.value) {
        return { index: i, card: cards[i] }
      }
    }
    return null
  },

  evaluateHand(cards) {
    if (cards.length === 0) return { type: 'invalid', value: 0 }
    
    if (cards.length === 1) {
      const value = CardUtils.getCardValue(cards[0])
      return { type: '单张', value: value }
    }
    
    if (cards.length === 2) {
      const v1 = CardUtils.getCardValue(cards[0])
      const v2 = CardUtils.getCardValue(cards[1])
      if (v1 === v2) {
        return { type: '对子', value: v1 }
      }
    }
    
    return { type: 'invalid', value: 0 }
  },

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
  }
})
