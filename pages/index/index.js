// pages/index/index.js - 高级游戏感版本
Page({
  data: {
    points: 0,
    nickname: '小朋友'
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
      totalPoints: 100
    }
    this.setData({
      points: userInfo.totalPoints || 100,
      nickname: userInfo.nickname || '小朋友'
    })
    getApp().globalData.userInfo = userInfo
  },

  playZhajinhua() {
    // 播放点击反馈
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({
      url: '/pages/zhajinhua/zhajinhua'
    })
  },

  playDoudizhu() {
    // 播放点击反馈
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({
      url: '/pages/doudizhu/doudizhu'
    })
  },

  comingSoon() {
    // 播放点击反馈
    wx.vibrateShort({ type: 'light' })
    wx.showModal({
      title: '敬请期待',
      content: '更多好玩的游戏正在开发中～',
      showCancel: false,
      confirmColor: '#FF6B6B'
    })
  }
})
