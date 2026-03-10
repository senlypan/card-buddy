// pages/zhajinhua/zhajinhua.js - 儿童简化版炸金花（带看牌/加注）
const CardUtils = require('../../utils/cards.js')

Page({
  data: {
    round: 1,
    myPoints: 100,
    buddyPoints: 100,
    myCards: [],
    buddyCards: [],
    myCardsDisplay: [],
    buddyCardsDisplay: [],
    myHandType: null,
    buddyHandType: null,
    showBuddyCards: false,
    showMyCards: false, // 是否已看牌
    gamePhase: 'dealing', // 'dealing', 'choose', 'betting', 'result'
    message: '发牌中...',
    showResult: false,
    resultEmoji: '',
    resultTitle: '',
    resultPoints: '',
    showConfetti: false,
    countdown: 3,
    countdownTimer: null,
    betAmount: 10, // 当前下注额
    isRaised: false, // 是否已加注
    buddyRaised: false // 牌牌是否加注
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
      buddyHandType: null,
      showMyCards: false,
      betAmount: 10,
      isRaised: false,
      buddyRaised: false
    })

    // 发牌动画
    setTimeout(() => {
      // 初始化牌堆
      const deck = CardUtils.createDeck()
      CardUtils.shuffle(deck)
      
      // 发牌
      const myCards = CardUtils.dealCards(deck, 3)
      const buddyCards = CardUtils.dealCards(deck, 3)
      
      // 排序手牌
      myCards.sort((a, b) => CardUtils.getCardValue(b) - CardUtils.getCardValue(a))
      buddyCards.sort((a, b) => CardUtils.getCardValue(b) - CardUtils.getCardValue(a))
      
      // 评估牌型
      const myType = CardUtils.evaluateHand(myCards)
      const buddyType = CardUtils.evaluateHand(buddyCards)
      
      // 准备显示数据（包含颜色信息）
      const myCardsDisplay = myCards.map(c => ({
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦'
      }))
      
      const buddyCardsDisplay = buddyCards.map(c => ({
        text: CardUtils.cardToString(c),
        isRed: c.suit === '♥' || c.suit === '♦'
      }))
      
      this.setData({
        myCards: myCards,
        buddyCards: buddyCards,
        myCardsDisplay: myCardsDisplay,
        buddyCardsDisplay: buddyCardsDisplay,
        myHandType: myType,
        buddyHandType: buddyType,
        showBuddyCards: false,
        gamePhase: 'choose',
        message: '✨ 要看牌吗？',
        showMyCards: false
      })
    }, 800)
  },

  // 看牌
  lookCards() {
    this.setData({
      showMyCards: true,
      gamePhase: 'betting',
      message: '看看你的牌怎么样～'
    })
  },

  // 不看牌（盲打）
  dontLookCards() {
    this.setData({
      showMyCards: false,
      gamePhase: 'betting',
      message: '勇敢！盲打更有挑战性！'
    })
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
    
    // 牌牌 AI 响应
    setTimeout(() => {
      this.buddyResponse()
    }, 1500)
  },

  // 不加注
  call() {
    this.setData({
      message: '好，直接开牌吧！'
    })
    
    setTimeout(() => {
      this.showdown()
    }, 800)
  },

  // 牌牌 AI 响应
  buddyResponse() {
    const { buddyHandType, betAmount } = this.data
    
    // 简单 AI：根据牌型决定是否跟注
    const buddyValue = buddyHandType.value
    const raiseThreshold = 500 // 对子以上跟注
    
    if (buddyValue >= raiseThreshold || Math.random() > 0.5) {
      // 跟注
      this.setData({
        buddyRaised: true,
        message: '牌牌跟注了！开牌吧！'
      })
      setTimeout(() => {
        this.showdown()
      }, 1000)
    } else {
      // 弃牌
      this.endRound('buddyFold')
    }
  },

  // 开牌比大小
  showdown() {
    this.setData({
      message: '🎲 开牌啦！',
      showBuddyCards: true
    })

    setTimeout(() => {
      this.endRound()
    }, 1000)
  },

  // 结束回合
  endRound(reason) {
    const { myHandType, buddyHandType, myPoints, betAmount, isRaised, showMyCards } = this.data
    
    // 比较牌型
    let compare = 0
    if (reason !== 'buddyFold') {
      compare = CardUtils.compareHands(myHandType, buddyHandType)
    }
    
    let win = false
    let pointsChange = 0
    let resultEmoji = ''
    let resultTitle = ''
    let message = ''
    
    if (reason === 'buddyFold') {
      // 牌牌弃牌，玩家赢
      win = true
      pointsChange = betAmount
      resultEmoji = '🎉'
      resultTitle = '牌牌弃牌啦！'
      message = '🎉 你赢了这局！'
    } else if (compare > 0) {
      // 赢了
      win = true
      // 盲打奖励翻倍
      const multiplier = showMyCards ? 1 : 2
      pointsChange = betAmount * multiplier
      resultEmoji = '🎉'
      resultTitle = showMyCards ? '太棒啦！' : '盲打胜利！'
      message = showMyCards ? '🎉 你赢了这局！' : '🌟 盲打太厉害了！'
    } else if (compare < 0) {
      // 输了
      win = false
      pointsChange = -betAmount
      resultEmoji = '💪'
      resultTitle = '加油哦！'
      message = '牌牌赢了，下次一定行！'
    } else {
      // 平局 - 算小朋友赢（鼓励）
      win = true
      pointsChange = betAmount
      resultEmoji = '🌟'
      resultTitle = '平局啦！'
      message = '✨ 平局！你也很厉害～'
    }
    
    // 更新积分（不会变成负数）
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
    // 清除之前的定时器
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
    // 清除定时器
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
