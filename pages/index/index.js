// pages/index/index.js
Page({
  data: {
    points: 0
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        points: userInfo.totalPoints
      })
      getApp().globalData.userInfo = userInfo
    }
  },

  playZhajinhua() {
    wx.navigateTo({
      url: '/pages/zhajinhua/zhajinhua'
    })
  },

  playDoudizhu() {
    wx.showModal({
      title: '即将开放',
      content: '斗地主游戏正在开发中，先玩炸金花吧！',
      showCancel: false,
      confirmColor: '#FF6B6B'
    })
  },

  comingSoon() {
    wx.showModal({
      title: '敬请期待',
      content: '更多好玩的游戏正在开发中～',
      showCancel: false,
      confirmColor: '#FF6B6B'
    })
  }
})
