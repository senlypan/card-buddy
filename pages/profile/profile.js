// pages/profile/profile.js
Page({
  data: {
    userInfo: {
      nickname: '小朋友',
      totalPoints: 0,
      winCount: 0,
      playCount: 0
    },
    winRate: 0
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {
      nickname: '小朋友',
      totalPoints: 0,
      winCount: 0,
      playCount: 0
    }
    
    const winRate = userInfo.playCount > 0 
      ? Math.round((userInfo.winCount / userInfo.playCount) * 100) 
      : 0
    
    this.setData({
      userInfo,
      winRate
    })
  },

  changeNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const userInfo = this.data.userInfo
          userInfo.nickname = res.content
          wx.setStorageSync('userInfo', userInfo)
          this.setData({ userInfo })
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          })
        }
      }
    })
  },

  resetData() {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空所有游戏数据吗？积分将重置为 100 分。',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('userInfo', {
            nickname: '小朋友',
            totalPoints: 100,
            winCount: 0,
            playCount: 0
          })
          this.loadUserInfo()
          wx.showToast({
            title: '已重置',
            icon: 'success'
          })
        }
      }
    })
  },

  about() {
    wx.showModal({
      title: '关于牌友',
      content: '牌友 v1.0\n\n一个陪孩子玩牌的 AI 小伙伴\n\n祝小朋友玩得开心！🃏',
      showCancel: false,
      confirmColor: '#FF6B6B'
    })
  }
})
