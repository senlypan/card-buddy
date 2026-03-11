const audioUtils = require('./utils/audio.js')

App({
  onLaunch() {
    // 初始化用户积分
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.setStorageSync('userInfo', {
        nickname: '小朋友',
        totalPoints: 100,  // 初始 100 分，小朋友不会从零开始
        winCount: 0,
        playCount: 0
      })
    }
    this.globalData.userInfo = wx.getStorageSync('userInfo')
    
    // 静默初始化音效系统（不显示日志）
    audioUtils.initAudio()
  },
  
  globalData: {
    userInfo: null,
    cardBuddy: {
      name: '牌牌',
      emoji: '🃏',
      personality: '活泼友好'
    },
    audioEnabled: true  // 音效开关
  }
})
