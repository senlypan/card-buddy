// pages/doudizhu/doudizhu.js - 三人完整版（1 地主 vs 2 农民）
const DouDiZhuUtils = require('../../utils/doudizhu.js')
const audioUtils = require('../../utils/audio.js')

Page({
  data: {
    round: 1,
    myPoints: 100,
    
    // 游戏状态
    gamePhase: 'calling', // 'calling' 叫地主，'playing' 出牌，'result' 结算
    landlordSeat: -1, // 地主座位（0-2）
    mySeat: 0, // 我的座位（固定 0）
    
    // 手牌
    myCards: [],
    myCardsDisplay: [],
    
    // 其他玩家
    player1Cards: [], // 上家
    player2Cards: [], // 下家
    player1CardCount: 17,
    player2CardCount: 17,
    
    // 底牌
    bottomCards: [],
    showBottomCards: false,
    
    // 出牌
    lastHand: null, // 最后出的牌
    lastHandPlayer: -1, // 最后出牌的人
    lastHandCards: [], // 最后出的牌（显示用）
    
    // 出牌权
    currentPlayer: -1, // 当前出牌的人
    passCount: 0, // 连续不要次数
    
    // 结算
    showResult: false,
    resultTitle: '',
    resultPoints: '',
    showConfetti: false,
    countdown: 3,
    countdownTimer: null,
    
    // 记牌器
    showCardCounter: false,
    playedCards: [],
    cardCounter: null,
    
    // 出牌建议
    playSuggestion: null
  },

  onLoad() {
    this.loadUserInfo()
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
      myPoints: userInfo.totalPoints || 100,
      nickname: userInfo.nickname || '小朋友'
    })
  },

  // 开始新游戏（发牌）
  startNewRound() {
    this.setData({
      gamePhase: 'calling',
      landlordSeat: -1,
      myCards: [],
      myCardsDisplay: [],
      player1Cards: [],
      player2Cards: [],
      player1CardCount: 17,
      player2CardCount: 17,
      bottomCards: [],
      showBottomCards: false,
      lastHand: null,
      lastHandPlayer: -1,
      lastHandCards: [],
      currentPlayer: -1,
      passCount: 0,
      showResult: false,
      showConfetti: false,
      playedCards: [],
      cardCounter: null,
      playSuggestion: null
    })
    
    // 发牌
    const dealResult = DouDiZhuUtils.dealCards()
    
    const myCards = dealResult.players[0]
    const player1Cards = dealResult.players[1]
    const player2Cards = dealResult.players[2]
    const bottomCards = dealResult.bottomCards
    
    // 排序手牌
    myCards.sort((a, b) => DouDiZhuUtils.getCardValue(b) - DouDiZhuUtils.getCardValue(a))
    
    // 准备显示数据
    const myCardsDisplay = myCards.map((c, i) => ({
      ...c,
      text: c.value + c.suit,
      isRed: c.suit === '♥' || c.suit === '♦',
      selected: false,
      index: i
    }))
    
    this.setData({
      myCards,
      myCardsDisplay,
      player1Cards,
      player2Cards,
      bottomCards,
      message: '叫地主阶段'
    })
    
    // 随机开始叫地主
    const randomStart = Math.floor(Math.random() * 3)
    this.setData({
      currentPlayer: randomStart
    })
    
    if (randomStart === 0) {
      this.setData({
        message: '轮到你叫地主！'
      })
    } else {
      this.setData({
        message: '等待其他玩家叫地主...'
      })
      setTimeout(() => this.aiCallLandlord(randomStart), 1500)
    }
  },

  // AI 叫地主
  aiCallLandlord(seat) {
    if (this.data.gamePhase !== 'calling') return
    
    // 简单 AI：随机叫或不叫
    const willCall = Math.random() > 0.5
    
    if (willCall) {
      this.setLandlord(seat)
    } else {
      // 下一个玩家
      const nextSeat = (seat + 1) % 3
      this.setData({
        currentPlayer: nextSeat,
        message: '等待其他玩家叫地主...'
      })
      
      if (nextSeat === 0) {
        this.setData({
          message: '轮到你叫地主！'
        })
      } else {
        setTimeout(() => this.aiCallLandlord(nextSeat), 1500)
      }
    }
  },

  // 我叫地主
  callLandlord() {
    if (this.data.gamePhase !== 'calling') return
    this.setLandlord(0)
  },

  // 不叫
  passCall() {
    if (this.data.gamePhase !== 'calling') return
    
    const nextSeat = (this.data.currentPlayer + 1) % 3
    this.setData({
      currentPlayer: nextSeat,
      message: '等待其他玩家叫地主...'
    })
    
    if (nextSeat === 0) {
      this.setData({
        message: '轮到你叫地主！'
      })
    } else {
      setTimeout(() => this.aiCallLandlord(nextSeat), 1500)
    }
  },

  // 确定地主
  setLandlord(seat) {
    const { bottomCards, myCards, player1Cards, player2Cards } = this.data
    
    // 地主拿到底牌
    if (seat === 0) {
      const newMyCards = [...myCards, ...bottomCards]
      newMyCards.sort((a, b) => DouDiZhuUtils.getCardValue(b) - DouDiZhuUtils.getCardValue(a))
      
      const myCardsDisplay = newMyCards.map((c, i) => ({
        ...c,
        text: c.value + c.suit,
        isRed: c.suit === '♥' || c.suit === '♦',
        selected: false,
        index: i
      }))
      
      this.setData({
        landlordSeat: seat,
        myCards: newMyCards,
        myCardsDisplay,
        showBottomCards: true,
        gamePhase: 'playing',
        currentPlayer: seat,
        message: '你是地主！你先出牌'
      })
    } else {
      this.setData({
        landlordSeat: seat,
        showBottomCards: true,
        gamePhase: 'playing',
        currentPlayer: seat,
        message: seat === 1 ? '上家是地主！上家先出牌' : '下家是地主！下家先出牌'
      })
      
      // AI 地主先出牌
      setTimeout(() => this.aiPlay(), 1500)
    }
  },

  // 切换卡牌选择
  toggleCard(e) {
    const index = e.currentTarget.dataset.index
    const myCardsDisplay = this.data.myCardsDisplay
    
    myCardsDisplay[index].selected = !myCardsDisplay[index].selected
    
    // 更新选中的数量
    const selectedCount = myCardsDisplay.filter(c => c.selected).length
    
    this.setData({
      myCardsDisplay,
      selectedCount
    })
  },

  // 出牌
  playCards() {
    if (this.data.gamePhase !== 'playing') return
    if (this.data.currentPlayer !== 0) return
    
    const selectedCards = this.data.myCardsDisplay.filter(c => c.selected)
    
    if (selectedCards.length === 0) {
      wx.showToast({
        title: '请选择要出的牌',
        icon: 'none'
      })
      return
    }
    
    // 分析牌型
    const cardsData = selectedCards.map(c => ({
      suit: c.suit,
      value: c.value
    }))
    
    const handAnalysis = DouDiZhuUtils.analyzeHand(cardsData)
    
    if (handAnalysis.type === 'invalid') {
      wx.showToast({
        title: '牌型不合法',
        icon: 'none'
      })
      return
    }
    
    // 检查是否能管上
    if (this.data.lastHand && this.data.lastHandPlayer !== 0) {
      const canBeat = DouDiZhuUtils.compareHands(handAnalysis, this.data.lastHand)
      if (canBeat <= 0) {
        wx.showToast({
          title: '牌型不够大',
          icon: 'none'
        })
        return
      }
    }
    
    // 出牌
    const selectedTexts = selectedCards.map(c => c.text)
    const newMyCards = this.data.myCards.filter(c => 
      !selectedTexts.includes(c.value + c.suit)
    )
    const newMyCardsDisplay = this.data.myCardsDisplay.filter(c => !c.selected)
    
    newMyCardsDisplay.forEach((c, i) => {
      c.index = i
    })
    
    // 更新已出的牌
    const playedCards = [...this.data.playedCards, ...cardsData]
    const cardCounter = this.createCardCounter(newMyCards, playedCards)
    
    this.setData({
      myCards: newMyCards,
      myCardsDisplay: newMyCardsDisplay,
      lastHand: handAnalysis,
      lastHandPlayer: 0,
      lastHandCards: selectedCards,
      passCount: 0,
      currentPlayer: 1, // 下一个玩家
      playedCards,
      cardCounter,
      selectedCount: 0,
      message: '你出了牌，等待上家...'
    })
    
    // 检查是否赢了
    if (newMyCards.length === 0) {
      this.endRound(0)
      return
    }
    
    // AI 出牌
    setTimeout(() => this.aiPlay(), 1500)
  },

  // 不要
  pass() {
    if (this.data.gamePhase !== 'playing') return
    if (this.data.currentPlayer !== 0) return
    if (!this.data.lastHand || this.data.lastHandPlayer === 0) {
      wx.showToast({
        title: '你是先手，不能不要',
        icon: 'none'
      })
      return
    }
    
    const newPassCount = this.data.passCount + 1
    
    this.setData({
      passCount: newPassCount,
      currentPlayer: (this.data.currentPlayer + 1) % 3,
      message: '你不要，等待其他玩家...'
    })
    
    // 如果连续两人都不要，获得出牌权
    if (newPassCount >= 2) {
      this.setData({
        lastHand: null,
        lastHandPlayer: -1,
        lastHandCards: [],
        passCount: 0,
        currentPlayer: 0,
        message: '轮到你出牌！'
      })
    } else {
      setTimeout(() => this.aiPlay(), 1500)
    }
  },

  // AI 出牌
  aiPlay() {
    if (this.data.gamePhase !== 'playing') return
    if (this.data.currentPlayer === 0) return
    
    const aiSeat = this.data.currentPlayer
    const aiCards = aiSeat === 1 ? this.data.player1Cards : this.data.player2Cards
    
    if (!aiCards || aiCards.length === 0) return
    
    // AI 出牌逻辑
    const lastHand = this.data.lastHand
    const isLandlord = aiSeat === this.data.landlordSeat
    
    let cardsToPlay = []
    
    if (!lastHand || this.data.lastHandPlayer === aiSeat) {
      // 自由出牌
      cardsToPlay = DouDiZhuUtils.suggestFreePlay(aiCards, isLandlord)
    } else {
      // 管牌
      cardsToPlay = DouDiZhuUtils.findBeatingCards(aiCards, lastHand)
      
      if (!cardsToPlay || cardsToPlay.length === 0) {
        // 要不起
        const newPassCount = this.data.passCount + 1
        const nextPlayer = (aiSeat + 1) % 3
        
        this.setData({
          passCount: newPassCount,
          currentPlayer: nextPlayer,
          message: newPassCount >= 2 ? '轮到你出牌！' : '等待其他玩家...'
        })
        
        if (newPassCount >= 2) {
          // 重置出牌权
          this.setData({
            lastHand: null,
            lastHandPlayer: -1,
            lastHandCards: [],
            passCount: 0
          })
        }
        
        if (nextPlayer === 0) {
          this.setData({
            message: '轮到你出牌！'
          })
        } else {
          setTimeout(() => this.aiPlay(), 1500)
        }
        return
      }
    }
    
    // AI 出牌
    const cardTexts = cardsToPlay.map(c => c.value + c.suit)
    
    if (aiSeat === 1) {
      const newCards = aiCards.filter(c => !cardTexts.includes(c.value + c.suit))
      this.setData({
        player1Cards: newCards,
        player1CardCount: newCards.length
      })
    } else {
      const newCards = aiCards.filter(c => !cardTexts.includes(c.value + c.suit))
      this.setData({
        player2Cards: newCards,
        player2CardCount: newCards.length
      })
    }
    
    // 分析牌型
    const handAnalysis = DouDiZhuUtils.analyzeHand(cardsToPlay)
    
    // 更新已出的牌
    const playedCards = [...this.data.playedCards, ...cardsToPlay]
    const myCards = this.data.myCards
    const cardCounter = this.createCardCounter(myCards, playedCards)
    
    const nextPlayer = (aiSeat + 1) % 3
    
    this.setData({
      lastHand: handAnalysis,
      lastHandPlayer: aiSeat,
      lastHandCards: cardsToPlay.map(c => ({
        ...c,
        text: c.value + c.suit,
        isRed: c.suit === '♥' || c.suit === '♦'
      })),
      passCount: 0,
      currentPlayer: nextPlayer,
      playedCards,
      cardCounter,
      message: nextPlayer === 0 ? '轮到你出牌！' : '等待其他玩家...'
    })
    
    // 检查 AI 是否赢了
    const aiRemainingCards = aiSeat === 1 ? 
      this.data.player1Cards.length - cardsToPlay.length :
      this.data.player2Cards.length - cardsToPlay.length
    
    if (aiRemainingCards === 0) {
      this.endRound(aiSeat)
      return
    }
    
    // 轮到下一个玩家
    if (nextPlayer === 0) {
      this.setData({
        message: '轮到你出牌！'
      })
    } else {
      setTimeout(() => this.aiPlay(), 1500)
    }
  },

  // 创建记牌器
  createCardCounter(myCards, playedCards) {
    return DouDiZhuUtils.createCardCounter ? 
      DouDiZhuUtils.createCardCounter(myCards, playedCards) : null
  },

  // 切换记牌器
  toggleCardCounter() {
    this.setData({
      showCardCounter: !this.data.showCardCounter
    })
  },

  // 获取出牌建议
  getPlaySuggestion() {
    if (this.data.currentPlayer !== 0) {
      wx.showToast({
        title: '还没轮到你出牌',
        icon: 'none'
      })
      return
    }
    
    const suggestion = DouDiZhuUtils.suggestPlay(
      this.data.myCards,
      this.data.lastHand,
      this.data.landlordSeat === 0
    )
    
    if (suggestion && suggestion.length > 0) {
      const handAnalysis = DouDiZhuUtils.analyzeHand(suggestion)
      
      wx.showModal({
        title: '💡 出牌建议',
        content: `建议出：${handAnalysis.type}（${suggestion.length}张牌）`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 结束游戏
  endRound(winnerSeat) {
    const { myPoints, landlordSeat, mySeat } = this.data
    
    // 判断胜负
    const isLandlordWin = winnerSeat === landlordSeat
    const isMeWin = winnerSeat === mySeat
    
    let win = false
    let pointsChange = 0
    let resultEmoji = ''
    let resultTitle = ''
    
    if (isMeWin) {
      win = true
      pointsChange = isLandlordWin ? 30 : 30 // 地主赢或农民赢都 +30
      resultEmoji = '🎉'
      resultTitle = isLandlordWin ? '地主胜利！' : '农民胜利！'
    } else {
      win = false
      pointsChange = -15
      resultEmoji = '💪'
      resultTitle = isLandlordWin ? '地主输了！' : '农民输了！'
    }
    
    const newPoints = Math.max(0, myPoints + pointsChange)
    
    this.setData({
      myPoints: newPoints,
      gamePhase: 'result',
      showResult: true,
      resultEmoji,
      resultTitle,
      resultPoints: pointsChange > 0 ? `+${pointsChange} 分` : `${pointsChange} 分`,
      showConfetti: win,
      countdown: 3
    })
    
    this.saveUserInfo(newPoints, win)
    this.startCountdown()
  },

  // 再来一局
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
    // 阻止事件冒泡
  },

  onSliderChange(e) {
    this.setData({
      customRaiseAmount: e.detail.value
    })
  }
})
