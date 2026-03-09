App({
  onLaunch() {
    // 初始化用户积分
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.setStorageSync('userInfo', {
        nickname: '小朋友',
        totalPoints: 0,
        winCount: 0,
        playCount: 0
      })
    }
  },
  
  globalData: {
    userInfo: null,
    cardBuddy: {
      name: '牌牌',
      emoji: '🃏',
      personality: '活泼友好'
    }
  }
})
