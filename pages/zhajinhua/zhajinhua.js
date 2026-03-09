// pages/zhajinhua/zhajinhua.js
const CardUtils = require('../../utils/cards.js')

Page({
  data: {
    round: 1,
    myPoints: 100,
    buddyPoints: 100,
    myCards: [],
    buddyCards: [],
    showBuddyCards: false,
    gamePhase: 'betting', // 'betting', 'end'
    message: '发牌中...',
    showResult: false,
    resultEmoji: '',
    resultTitle: '',
    resultPoints: ''
  },

  onLoad() {
    this.startNewRound()
  },

  startNewRound() {
    // 初始化牌堆
    const deck = CardUtils.createDeck()
    CardUtils.shuffle(deck)
    
    // 发牌
    const myCards = CardUtils.dealCards(deck, 3)
    const buddyCards = CardUtils.dealCards(deck, 3)
    
    // 排序手牌
    myCards.sort()
    buddyCards.sort()
    
    this.setData({
      myCards: myCards.map(c => CardUtils.cardToString(c)),
      buddyCards: buddyCards.map(c => CardUtils.cardToString(c)),
      showBuddyCards: false,
      gamePhase: 'betting',
      message: '轮到你操作～',
      showResult: false
    })
  },

  // 跟注
  call() {
    this.setData({
      message: '你跟注了，牌牌思考中...'
    })
    
    setTimeout(() => {
      this.buddyAction()
    }, 1000)
  },

  // 加注
  raise() {
    this.setData({
      message: '你加注了！'
    })
    
    setTimeout(() => {
      this.buddyAction()
    }, 1000)
  },

  // 弃牌
  fold() {
    this.endRound('fold')
  },

  // 开牌
  showdown() {
    this.endRound('showdown')
  },

  // 牌友 AI 行动
  buddyAction() {
    // 简单 AI：随机决定
    const actions = ['call', 'raise', 'showdown']
    const action = actions[Math.floor(Math.random() * actions.length)]
    
    if (action === 'showdown') {
      this.endRound('showdown')
    } else {
      this.setData({
        message: '牌牌跟注了，继续吧～'
      })
    }
  },

  // 结束回合
  endRound(reason) {
    const { myCards, buddyCards } = this.data
    
    // 显示牌友的牌
    this.setData({
      showBuddyCards: true,
      gamePhase: 'end'
    })
    
    // 比较牌型
    const myType = CardUtils.evaluateHand(myCards)
    const buddyType = CardUtils.evaluateHand(buddyCards)
    
    let win = false
    let pointsChange = 0
    
    if (reason === 'fold') {
      win = false
      pointsChange = -10
    } else {
      const compare = CardUtils.compareHands(myType, buddyType)
      if (compare > 0) {
        win = true
        pointsChange = 20
      } else if (compare < 0) {
        win = false
        pointsChange = -10
      } else {
        win = true // 平局算玩家赢（鼓励孩子）
        pointsChange = 10
      }
    }
    
    // 更新积分
    const newPoints = this.data.myPoints + pointsChange
    this.setData({
      myPoints: newPoints,
      message: win ? '🎉 你赢了！' : '加油，再来一局！',
      showResult: true,
      resultEmoji: win ? '🎉' : '💪',
      resultTitle: win ? '太棒了！' : '别灰心',
      resultPoints: win ? `+${pointsChange} 分` : `${pointsChange} 分`
    })
    
    // 保存积分
    this.saveUserInfo(newPoints)
    
    // 3 秒后隐藏结果
    setTimeout(() => {
      this.setData({
        showResult: false
      })
    }, 3000)
  },

  nextRound() {
    this.setData({
      round: this.data.round + 1
    })
    this.startNewRound()
  },

  saveUserInfo(points) {
    const userInfo = wx.getStorageSync('userInfo') || {
      nickname: '小朋友',
      totalPoints: 0,
      winCount: 0,
      playCount: 0
    }
    userInfo.totalPoints = points
    userInfo.playCount = (userInfo.playCount || 0) + 1
    wx.setStorageSync('userInfo', userInfo)
  }
})
