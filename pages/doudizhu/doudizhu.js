// pages/doudizhu/doudizhu.js - 滑动选牌版
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
    lastHandCards: [],
    myHandType: null,
    landlordHandType: null,
    passCount: 0,
    selectedCount: 0,
    scrollToView: '',
    hint: null // 智能提示
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
      selectedCount: 0,
      scrollToView: '',
      hint: null
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
        index: i,
        id: 'card-' + i
      }))
      
      const landlordCardsDisplay = landlordCards.map(c => ({
        ...c,
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦'
      }))
      
      const isLandlord = Math.random() > 0.5
      
      this.setData({
        myCards: myCards,
        myCardsDisplay: myCardsDisplay,
        landlordCards: landlordCards,
        landlordCardsDisplay: landlordCardsDisplay,
        isLandlord: isLandlord,
        gamePhase: 'playing',
        message: isLandlord ? '✨ 你是地主！你先出牌！' : '✨ 你是农民！准备出牌！',
        isMyTurn: isLandlord,
        hint: this.generateHint(myCardsDisplay, null)
      })
    }, 800)
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

  // 点击选牌
  toggleCard(e) {
    const index = e.currentTarget.dataset.index
    
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    const myCardsDisplay = this.data.myCardsDisplay
    const cardIndex = myCardsDisplay.findIndex(c => c.index === index)
    
    if (cardIndex !== -1) {
      myCardsDisplay[cardIndex].selected = !myCardsDisplay[cardIndex].selected
      
      const selectedCount = myCardsDisplay.filter(c => c.selected).length
      
      this.setData({
        myCardsDisplay: myCardsDisplay,
        selectedCount: selectedCount
      })
    }
  },

  // 智能提示
  showHint() {
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    const hint = this.generateHint(this.data.myCardsDisplay, this.data.lastHand)
    
    if (hint) {
      wx.showModal({
        title: '💡 智能提示',
        content: hint.text,
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#2ecc71'
      })
    }
  },

  // 生成智能提示
  generateHint(cards, lastHand) {
    const availableCards = cards.filter(c => !c.selected)
    
    if (availableCards.length === 0) {
      return { text: '没有可出的牌了', type: 'info' }
    }
    
    // 如果需要管牌
    if (lastHand) {
      const beatCard = this.findBeatingCard(availableCards, lastHand)
      if (beatCard) {
        return {
          text: `建议出：${beatCard.card.text}（比${lastHand.type}大）`,
          type: 'beat'
        }
      } else {
        return {
          text: '要不起，建议"不要"',
          type: 'pass'
        }
      }
    }
    
    // 先手出牌策略
    // 1. 先出最小的单张
    const minCard = availableCards.reduce((min, c) => {
      const val = CardUtils.getCardValue(c)
      const minVal = CardUtils.getCardValue(min)
      return val < minVal ? c : min
    })
    
    // 2. 检查有没有对子
    const valueCount = {}
    availableCards.forEach(c => {
      const text = c.text
      valueCount[text] = (valueCount[text] || 0) + 1
    })
    
    for (const [text, count] of Object.entries(valueCount)) {
      if (count >= 2) {
        return {
          text: `建议出对子：${text} ${text}`,
          type: 'pair'
        }
      }
    }
    
    // 3. 出最小单张
    return {
      text: `建议出最小单张：${minCard.text}`,
      type: 'single'
    }
  },

  playCards() {
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    const selectedCards = this.data.myCardsDisplay.filter(c => c.selected)
    
    if (selectedCards.length === 0) {
      wx.showToast({
        title: '请点击选择要出的牌',
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
    
    // 重新编号
    myCardsDisplay.forEach((c, i) => {
      c.index = i
      c.id = 'card-' + i
    })
    
    this.setData({
      myCards: myCards,
      myCardsDisplay: myCardsDisplay,
      lastHand: handType,
      lastHandPlayer: 'me',
      lastHandCards: selectedCards,
      passCount: 0,
      isMyTurn: false,
      message: '你出了牌，等待牌牌...',
      selectedCount: 0
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
