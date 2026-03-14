// pages/shooting/shooting.js - 射击游戏首页（模式选择）
Page({
  data: {
    userInfo: null,
    modes: [
      {
        id: 'classic',
        name: '经典对战',
        icon: '🔫',
        desc: '1v1 回合制射击',
        reward: '积分 +10~30',
        locked: false,
        unlockCondition: null
      },
      {
        id: 'loot',
        name: '摸金模式',
        icon: '💰',
        desc: '探索建筑，收集宝物',
        reward: '金币 + 随机道具',
        locked: false,
        unlockCondition: null
      },
      {
        id: 'boss',
        name: 'BOSS 战',
        icon: '👹',
        desc: '挑战强力 BOSS',
        reward: '稀有装备 + 积分',
        locked: true,
        unlockCondition: '摸金模式通关 3 次'
      },
      {
        id: 'mecha',
        name: '机甲大战',
        icon: '🤖',
        desc: '驾驶机甲对战',
        reward: '机甲碎片 + 积分',
        locked: true,
        unlockCondition: '击败 BOSS 获得机甲钥匙'
      },
      {
        id: 'battleroyal',
        name: '吃鸡模式',
        icon: '🏃',
        desc: '多人混战生存',
        reward: '积分 +50~100',
        locked: true,
        unlockCondition: '经典模式胜 5 场'
      }
    ],
    stats: {
      totalGames: 0,
      totalWins: 0,
      lootPassed: 0,
      points: 0,
      gold: 0
    }
  },

  onLoad: function() {
    this.loadUserInfo();
    this.checkUnlocks();
  },

  onShow: function() {
    this.loadUserInfo();
    this.checkUnlocks();
  },

  // 加载用户信息
  loadUserInfo: function() {
    const userInfo = wx.getStorageSync('shooting_userInfo') || {
      totalGames: 0,
      totalWins: 0,
      lootPassed: 0,
      points: 0,
      gold: 1000, // 初始金币
      mechaFragments: 0,
      inventory: []
    };
    this.setData({ userInfo, stats: userInfo });
  },

  // 检查模式解锁状态
  checkUnlocks: function() {
    const modes = this.data.modes.map(mode => {
      if (mode.id === 'boss') {
        mode.locked = this.data.stats.lootPassed < 3;
      } else if (mode.id === 'mecha') {
        mode.locked = !wx.getStorageSync('mecha_key');
      } else if (mode.id === 'battleroyal') {
        mode.locked = this.data.stats.totalWins < 5;
      }
      return mode;
    });
    this.setData({ modes });
  },

  // 选择模式
  onSelectMode: function(e) {
    const modeId = e.currentTarget.dataset.modeId;
    const mode = this.data.modes.find(m => m.id === modeId);
    
    if (!mode) {
      return;
    }
    
    if (mode.locked) {
      wx.showToast({
        title: `需完成：${mode.unlockCondition}`,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 跳转到对应模式
    const pages = {
      'classic': '/pages/shooting-classic/shooting-classic',
      'loot': '/pages/shooting-loot/shooting-loot',
      'boss': '/pages/shooting-boss/shooting-boss',
      'mecha': '/pages/shooting-mecha/shooting-mecha',
      'battleroyal': '/pages/shooting-battleroyal/shooting-battleroyal'
    };

    if (pages[modeId]) {
      wx.navigateTo({ url: pages[modeId] });
    }
  },

  // 进入仓库
  goToInventory: function() {
    wx.navigateTo({ url: '/pages/shooting-inventory/shooting-inventory' });
  },

  // 进入商城
  goToShop: function() {
    wx.navigateTo({ url: '/pages/shooting-shop/shooting-shop' });
  },

  // 返回首页
  goBack: function() {
    wx.navigateBack({ delta: 1 });
  }
});
