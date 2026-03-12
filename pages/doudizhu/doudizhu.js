// pages/doudizhu/doudizhu.js - 三人完整版（1 地主 vs 2 农民）
const DouDiZhuUtils = require('../../utils/doudizhu.js')
const audioUtils = require('../../utils/audio.js')
const { DouDiZhuAI, AIDifficulty } = require('../../utils/doudizhu-ai.js')

Page({
  data: {
    round: 1,
    myPoints: 100,
    myCards: [],
    myCardsDisplay: [],
    landlordCards: [],
    landlordCardsDisplay: [],
    showLandlordCards: false,
    gamePhase: 'select', // 'select', 'dealing', 'playing', 'result'
    message: '选择角色',
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
    hint: null,
    // 思维锻炼功能
    showCardCounter: false, // 是否显示记牌器
    cardCounter: null, // 记牌器数据
    playedCards: [], // 已出的牌
    handAnalysis: null, // 手牌分析
    playSuggestion: null, // 出牌建议
    
    // 明牌模式
    showOpponentCards: false, // 是否显示对手牌（明牌模式）
    
    // AI 难度选择
    aiDifficulty: 'normal', // 'easy', 'normal', 'hell'
    showDifficultySelect: false // 是否显示难度选择
  },
  
  // AI 实例
  ai: null,

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
      myPoints: userInfo.totalPoints || 100
    })
  },

  // 选择难度
  selectDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty
    this.setData({
      aiDifficulty: difficulty
    })
    
    // 初始化 AI
    this.initAI(difficulty)
    
    wx.showToast({
      title: `难度：${this.getDifficultyName(difficulty)}`,
      icon: 'none'
    })
  },
  
  // 获取难度名称
  getDifficultyName(difficulty) {
    const names = {
      'easy': '简单 😊',
      'normal': '普通 🎯',
      'hell': '地狱 🔥'
    }
    return names[difficulty] || '普通'
  },
  
  // 初始化 AI
  initAI(difficulty) {
    this.ai = new DouDiZhuAI(difficulty)
  },
  
  // 选择地主
  selectLandlord() {
    this.startGame(true)
  },

  // 选择农民
  selectFarmer() {
    this.startGame(false)
  },

  // 开始游戏
  startGame(isLandlord) {
    // 初始化 AI（如果还没初始化）
    if (!this.ai) {
      this.initAI(this.data.aiDifficulty)
    } else {
      this.ai.reset()
    }
    
    this.setData({
      gamePhase: 'dealing',
      message: '🃏 发牌中...',
      isLandlord: isLandlord
    })

    setTimeout(() => {
      const deck = this.createDouDiZhuDeck()
      DouDiZhuUtils.shuffle(deck)
      
      // 地主 20 张，农民 17 张
      const myCardCount = isLandlord ? 20 : 17
      const landlordCardCount = isLandlord ? 17 : 20
      
      const myCards = deck.slice(0, myCardCount)
      const landlordCards = deck.slice(myCardCount, myCardCount + landlordCardCount)
      
      myCards.sort((a, b) => DouDiZhuUtils.getCardValue(b) - DouDiZhuUtils.getCardValue(a))
      landlordCards.sort((a, b) => DouDiZhuUtils.getCardValue(b) - DouDiZhuUtils.getCardValue(a))
      
      const myCardsDisplay = myCards.map((c, i) => ({
        ...c,
        text: c.value + c.suit,
        isRed: c.suit === '♥' || c.suit === '♦',
        selected: false,
        index: i,
        id: 'card-' + i
      }))
      
      const landlordCardsDisplay = landlordCards.map(c => ({
        ...c,
        text: c.value + c.suit,
        isRed: c.suit === '♥' || c.suit === '♦'
      }))
      
      console.log('明牌调试 - landlordCards:', landlordCards)
      console.log('明牌调试 - landlordCardsDisplay:', landlordCardsDisplay)
      
      this.setData({
        myCards: myCards,
        myCardsDisplay: myCardsDisplay,
        landlordCards: landlordCards,
        landlordCardsDisplay: landlordCardsDisplay,
        gamePhase: 'playing',
        isMyTurn: isLandlord, // 地主先出
        message: isLandlord ? '✨ 你是地主！你先出牌！' : '✨ 准备挑战地主！',
        passCount: 0,
        lastHand: null,
        lastHandPlayer: null,
        lastHandCards: []
      })
      
      // 如果不是地主（选择农民），让地主（AI）先出牌
      if (!isLandlord) {
        console.log('玩家选择农民，地主 AI 先出牌')
        setTimeout(() => {
          this.landlordAI()
        }, 1500)
      }
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

  // 显示加注输入框
  showRaiseInput() {
    const maxAmount = this.data.myPoints
    this.setData({
      showRaiseInput: true,
      customRaiseAmount: Math.min(20, maxAmount)
    })
  },
  
  // 关闭加注输入框
  closeRaiseInput() {
    this.setData({
      showRaiseInput: false
    })
  },
  
  // 自定义加注金额
  customRaise() {
    const amount = this.data.customRaiseAmount
    const maxAmount = this.data.myPoints
    
    if (amount < 1) {
      wx.showToast({
        title: '最少 1 分',
        icon: 'none'
      })
      return
    }
    
    if (amount > maxAmount) {
      wx.showToast({
        title: '不能超过剩余积分',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      betAmount: this.data.betAmount + amount,
      isRaised: true,
      showRaiseInput: false,
      message: `你加注了${amount}分！牌牌要思考一下...`
    })
    
    setTimeout(() => {
      this.buddyResponse()
    }, 1500)
  },
  
  // 加注
  raise() {
    if (this.data.isRaised) {
      return
    }
    
    const newBet = this.data.betAmount + 20
    this.setData({
      betAmount: newBet,
      isRaised: true,
      message: '你加注了！牌牌要思考一下...'
    })
    
    setTimeout(() => {
      this.buddyResponse()
    }, 1500)
  },

  // 一键出牌
  autoPlay() {
    if (!this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    const hint = this.generateHint(this.data.myCardsDisplay, this.data.lastHand)
    
    if (hint) {
      const myCardsDisplay = this.data.myCardsDisplay
      myCardsDisplay.forEach(c => c.selected = false)
      
      if (hint.text.includes('建议出：')) {
        const match = hint.text.match(/建议出：(.+?)（/)
        if (match) {
          const texts = match[1].split(' ')
          texts.forEach(text => {
            const card = myCardsDisplay.find(c => c.text === text)
            if (card) {
              card.selected = true
              card.autoHighlight = true
            }
          })
        }
      } else if (hint.text.includes('对子')) {
        const match = hint.text.match(/对子：(.+)/)
        if (match) {
          const text = match[1].split(' ')[0]
          let count = 0
          myCardsDisplay.forEach(c => {
            if (c.text === text && count < 2) {
              c.selected = true
              c.autoHighlight = true
              count++
            }
          })
        }
      } else if (hint.text.includes('单张')) {
        const match = hint.text.match(/单张：(.+)/)
        if (match) {
          const text = match[1]
          const card = myCardsDisplay.find(c => c.text === text)
          if (card) {
            card.selected = true
            card.autoHighlight = true
          }
        }
      }
      
      const selectedCount = myCardsDisplay.filter(c => c.selected).length
      
      this.setData({
        myCardsDisplay: myCardsDisplay,
        selectedCount: selectedCount,
        message: `已选择 ${selectedCount} 张牌，即将出牌...`
      })
      
      setTimeout(() => {
        this.playCards()
      }, 800)
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
    
    // 安全检查：确保选中的牌有 text 属性
    const validCards = selectedCards.filter(c => c && c.text)
    if (validCards.length !== selectedCards.length) {
      console.error('选中的牌数据无效:', selectedCards)
      wx.showToast({
        title: '牌数据错误，请重新选择',
        icon: 'none'
      })
      return
    }
    
    const handType = this.evaluateHand(validCards)
    
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
    
    // 出牌动画 - 先显示飞牌效果
    this.setData({
      playingAnimation: true,
      flyingCards: selectedCards.map(c => ({...c, flying: true}))
    })
    
    // 播放出牌音效（后续添加）
    
    setTimeout(() => {
      const selectedTexts = selectedCards.map(c => c.text)
      const myCards = this.data.myCards.filter(c => 
        !selectedTexts.includes(c.value + c.suit)
      )
      const myCardsDisplay = this.data.myCardsDisplay.filter(c => !c.selected)
      
      myCardsDisplay.forEach((c, i) => {
        c.index = i
        c.id = 'card-' + i
        c.autoHighlight = false
      })
      
      // 更新已出的牌
      const playedCards = [...this.data.playedCards, ...selectedCards]
      
      // 更新记牌器
      const cardCounter = DouDiZhuUtils.createCardCounter ? DouDiZhuUtils.createCardCounter(this.data.myCards, playedCards) : null
      
      // 分析手牌
      const handAnalysis = DouDiZhuUtils.analyzeHand(myCards)
      
      // 检查是否出完了
      const isWin = myCards.length === 0
      
      this.setData({
        myCards: myCards,
        myCardsDisplay: myCardsDisplay,
        lastHand: handType,
        lastHandPlayer: 'me',
        lastHandCards: selectedCards,
        passCount: 0,
        isMyTurn: false,
        message: isWin ? '🎉 你赢了！' : '你出了牌，等待对手...',
        selectedCount: 0,
        playingAnimation: false,
        flyingCards: [],
        playedCards,
        cardCounter,
        handAnalysis
      })
      
      // 如果出完了，立即结算
      if (isWin) {
        console.log('玩家出完牌，触发结算')
        setTimeout(() => {
          this.endRound('me')
        }, 500)
        return
      }
      
      // 调用 AI
      setTimeout(() => {
        this.landlordAI()
      }, 1000)
    }, 400)
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
    
    // 更新记牌器（对手出牌后不要）
    const cardCounter = DouDiZhuUtils.createCardCounter ? DouDiZhuUtils.createCardCounter(this.data.myCards, this.data.playedCards) : null
    
    this.setData({
      passCount: this.data.passCount + 1,
      isMyTurn: false,
      message: '你不要，等待对手...',
      cardCounter
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
    
    // 确保 AI 的回合
    if (this.data.isMyTurn || this.data.gamePhase !== 'playing') {
      return
    }
    
    setTimeout(() => {
      this._executeAI()
    }, 500)
  },
  
  _executeAI() {
    const { landlordCards, lastHand, lastHandPlayer, passCount } = this.data
    
    if (!landlordCards || landlordCards.length === 0) {
      return
    }
    
    // 先手出牌
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
        lastHandCards: [{...card, text: card.value + card.suit, isRed: card.suit === '♥' || card.suit === '♦'}],
        passCount: 0,
        isMyTurn: true,
        message: '对手出了牌，轮到你！'
      })
      
      if (newCards.length === 0) {
        this.endRound('landlord')
      }
      return
    }
    
    // 跟牌
    const canBeat = this.findBeatingCard(landlordCards, lastHand)
    
    if (canBeat) {
      const cardIndex = canBeat.index
      const cardsToPlay = canBeat.cards || [landlordCards[cardIndex]]
      
      const cardTexts = cardsToPlay.map(c => c.value + c.suit)
      const newCards = landlordCards.filter(c => !cardTexts.includes(c.value + c.suit))
      const newCardsDisplay = this.data.landlordCardsDisplay.filter(c => !cardTexts.includes(c.value + c.suit))
      
      const handType = this.evaluateHand(cardsToPlay)
      
      this.setData({
        landlordCards: newCards,
        landlordCardsDisplay: newCardsDisplay,
        lastHand: handType,
        lastHandPlayer: 'landlord',
        lastHandCards: cardsToPlay.map(c => ({...c, text: c.value + c.suit, isRed: c.suit === '♥' || c.suit === '♦'})),
        passCount: 0,
        isMyTurn: true,
        message: '对手管上了，轮到你！'
      })
      
      if (newCards.length === 0) {
        this.endRound('landlord')
      }
    } else {
      const newPassCount = passCount + 1
      
      this.setData({
        passCount: newPassCount,
        isMyTurn: true,
        message: '对手要不起，轮到你！'
      })
      
      if (newPassCount >= 2) {
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
    // 使用斗地主专用工具找能管上的牌
    const cardsData = cards.map(c => ({
      suit: c.suit,
      value: c.value
    }))
    
    const beatingCards = DouDiZhuUtils.findBeatingCards(cardsData, lastHand)
    
    if (beatingCards && beatingCards.length > 0) {
      // 返回原始卡牌对象
      return {
        cards: beatingCards.map(c => ({
          suit: c.suit,
          value: c.value,
          text: c.value + c.suit
        }))
      }
    }
    
    return null
  },

  evaluateHand(cards) {
    if (cards.length === 0) return { type: 'invalid', value: 0 }
    
    // 使用斗地主专用工具分析牌型
    const cardsData = cards.map(c => ({
      suit: c.suit,
      value: c.value
    }))
    
    return DouDiZhuUtils.analyzeHand(cardsData)
  },

  endRound(winner) {
    console.log('===== 游戏结束结算 =====')
    console.log('获胜者:', winner)
    console.log('我是地主吗？:', this.data.isLandlord)
    
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
    
    console.log('设置结算数据...')
    console.log('显示弹窗:', true)
    console.log('积分变化:', pointsChange)
    
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
    
    // 播放音效
    if (win) {
      audioUtils.playAudio('win')
    } else {
      audioUtils.playAudio('lose')
    }
    
    console.log('启动倒计时...')
    this.startCountdown()
  },

  nextRound() {
    console.log('===== 点击再玩一次 =====')
    console.log('当前回合:', this.data.round)
    console.log('设置游戏状态为：select')
    
    this.setData({
      round: this.data.round + 1,
      gamePhase: 'select',
      message: '选择角色',
      showResult: false,
      showConfetti: false,
      countdown: 3,
      landlordCards: [],
      landlordCardsDisplay: [],
      myCards: [],
      myCardsDisplay: [],
      lastHand: null,
      lastHandPlayer: null,
      lastHandCards: [],
      showOpponentCards: false,
      isLandlord: false,
      isMyTurn: true,
      passCount: 0,
      selectedCount: 0
    })
    
    console.log('新回合:', this.data.round + 1)
    console.log('游戏状态:', 'select')
    console.log('可以重新选择地主或农民了！')
  },

  // 开始新游戏（重置）
  startNewRound() {
    this.setData({
      gamePhase: 'select',
      message: '选择角色'
    })
  },

  startNewRound() {
    this.setData({
      gamePhase: 'select',
      message: '选择角色'
    })
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

  // 切换记牌器显示
  toggleCardCounter() {
    this.setData({
      showCardCounter: !this.data.showCardCounter
    })
  },

  // 获取出牌建议
  getPlaySuggestion() {
    if (!this.data.isMyTurn) {
      wx.showToast({
        title: '还没轮到你出牌',
        icon: 'none'
      })
      return
    }
    
    const suggestedCards = DouDiZhuUtils.suggestPlay(
      this.data.myCards,
      this.data.lastHand,
      this.data.landlordSeat === 0
    )
    
    if (suggestedCards && suggestedCards.length > 0) {
      // 分析建议的牌型
      const handAnalysis = DouDiZhuUtils.analyzeHand(suggestedCards)
      
      // 显示建议
      wx.showModal({
        title: '💡 出牌建议',
        content: `建议出：${handAnalysis.type}（${suggestedCards.length}张牌）`,
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      wx.showModal({
        title: '💡 出牌建议',
        content: '要不起，选择"不要"吧！',
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 切换明牌模式
  toggleOpponentCards() {
    const newShow = !this.data.showOpponentCards
    this.setData({
      showOpponentCards: newShow
    })
    
    console.log('明牌切换:', newShow ? '开启' : '关闭')
    console.log('landlordCardsDisplay:', this.data.landlordCardsDisplay)
    
    wx.showToast({
      title: newShow ? '已开启明牌' : '已关闭明牌',
      icon: 'none'
    })
  },

  startCountdown() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }
    
    const timer = setInterval(() => {
      const newCountdown = this.data.countdown - 1
      
      if (newCountdown <= 0) {
        clearInterval(timer)
        this.backToSelect()
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

  // 回到角色选择界面
  backToSelect() {
    console.log('===== 回到角色选择 =====')
    console.log('回合:', this.data.round, '→', this.data.round + 1)
    
    this.setData({
      round: this.data.round + 1,
      gamePhase: 'select',
      message: '选择角色',
      showResult: false,
      showConfetti: false,
      countdown: 3,
      landlordCards: [],
      landlordCardsDisplay: [],
      myCards: [],
      myCardsDisplay: [],
      lastHand: null,
      lastHandPlayer: null,
      lastHandCards: [],
      showOpponentCards: false,
      isLandlord: false,
      isMyTurn: true,
      passCount: 0,
      selectedCount: 0
    })
    
    console.log('已回到角色选择界面，可以重新选择地主或农民')
  },

  stopClose() {
    // 阻止事件冒泡，防止误触关闭
  },

  onSliderChange(e) {
    this.setData({
      customRaiseAmount: e.detail.value
    })
  },

  onInputAmount(e) {
    const value = parseInt(e.detail.value) || 0
    this.setData({
      customRaiseAmount: value
    })
  },

  setQuickAmount(e) {
    const amount = e.currentTarget.dataset.amount
    const maxAmount = this.data.myPoints
    this.setData({
      customRaiseAmount: Math.min(amount, maxAmount)
    })
  },

  generateHint(cards, lastHand) {
    const availableCards = cards.filter(c => !c.selected)
    
    if (availableCards.length === 0) {
      return { text: '没有可出的牌了', type: 'info' }
    }
    
    if (lastHand) {
      const beatCard = this.findBeatingCard(availableCards, lastHand)
      if (beatCard) {
        if (beatCard.cards) {
          const texts = beatCard.cards.map(c => c.text).join(' ')
          return {
            text: `建议出：${texts}（比${lastHand.type}大）`,
            type: 'beat'
          }
        } else {
          return {
            text: `建议出：${beatCard.card.text}（比${lastHand.type}大）`,
            type: 'beat'
          }
        }
      } else {
        return {
          text: '要不起，建议"不要"',
          type: 'pass'
        }
      }
    }
    
    const minCard = availableCards.reduce((min, c) => {
      const val = DouDiZhuUtils.getCardValue(c)
      const minVal = DouDiZhuUtils.getCardValue(min)
      return val < minVal ? c : min
    })
    
    return {
      text: `建议出最小单张：${minCard.text}`,
      type: 'single'
    }
  }
})
