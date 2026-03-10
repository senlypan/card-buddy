// pages/zhajinhua/zhajinhua.js - 儿童简化版炸金花
const CardUtils = require('../../utils/cards.js')

Page({
  data: {
    round: 1,
    myPoints: 100,
    buddyPoints: 100,
    myCards: [],
    buddyCards: [],
    myHandType: null,
    buddyHandType: null,
    showBuddyCards: false,
    gamePhase: 'dealing', // 'dealing', 'ready', 'result'
    message: '发牌中...',
    showResult: false,
    resultEmoji: '',
    resultTitle: '',
    resultPoints: '',
    showConfetti: false,
    countdown: 3,
    countdownTimer: null
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
      buddyHandType: null
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
      
      this.setData({
        myCards: myCards.map(c => CardUtils.cardToString(c)),
        buddyCards: buddyCards.map(c => CardUtils.cardToString(c)),
        myHandType: myType,
        buddyHandType: buddyType,
        showBuddyCards: false,
        gamePhase: 'ready',
        message: '✨ 看看你的牌吧！'
      })
    }, 800)
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
  endRound() {
    const { myHandType, buddyHandType, myPoints } = this.data
    
    // 比较牌型
    const compare = CardUtils.compareHands(myHandType, buddyHandType)
    
    let win = false
    let pointsChange = 0
    let resultEmoji = ''
    let resultTitle = ''
    let message = ''
    
    if (compare > 0) {
      // 赢了
      win = true
      pointsChange = 20
      resultEmoji = '🎉'
      resultTitle = '太棒啦！'
      message = '🎉 你赢了这局！'
    } else if (compare < 0) {
      // 输了
      win = false
      pointsChange = -10
      resultEmoji = '💪'
      resultTitle = '加油哦！'
      message = '牌牌赢了，下次一定行！'
    } else {
      // 平局 - 算小朋友赢（鼓励）
      win = true
      pointsChange = 10
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
