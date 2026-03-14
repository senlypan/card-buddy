// pages/shooting-loot/shooting-loot.js - 摸金模式
const shootingItems = require('../../utils/shooting-items.js');
const shootingMap = require('../../utils/shooting-map.js');
const shootingAI = require('../../utils/shooting-ai.js');

Page({
  data: {
    // 游戏状态
    gameState: 'prepare', // prepare, playing, success, failed
    floor: 1, // 当前楼层
    maxFloors: 3,
    
    // 玩家信息
    player: {
      hp: 100,
      maxHp: 100,
      armor: 0,
      maxArmor: 0,
      weapon: null,
      ammo: 0,
      grenades: [],
      meds: [],
      gold: 0,
      loot: [],
      position: { x: 0, y: 0 }
    },
    
    // 地图
    map: [],
    mapSize: 8,
    
    // 敌人
    enemies: [],
    boss: null,
    
    // 可交互对象
    items: [],
    lootBoxes: [],
    exitPoint: null,
    
    // 战斗日志
    battleLog: [],
    
    // 倒计时
    timer: 300, // 5 分钟撤离
    
    // 装备品质颜色
    qualityColors: {
      green: '#52c41a',
      blue: '#1890ff',
      purple: '#722ed1',
      orange: '#fa8c16',
      gold: '#ffd700'
    }
  },

  onLoad: function() {
    this.initGame();
  },

  onUnload: function() {
    // 清理定时器
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
  },

  // 初始化游戏
  initGame: function() {
    // 加载玩家装备
    const inventory = wx.getStorageSync('shooting_inventory') || [];
    const equippedArmor = inventory.find(item => item.equipped && item.type === 'armor');
    const equippedWeapon = inventory.find(item => item.equipped && item.type === 'weapon');
    
    let player = {
      hp: 100,
      maxHp: 100,
      armor: equippedArmor ? equippedArmor.armorValue : 0,
      maxArmor: equippedArmor ? equippedArmor.maxArmor : 0,
      weapon: equippedWeapon,
      ammo: equippedWeapon ? 30 : 0,
      grenades: [],
      meds: [],
      gold: 0,
      loot: [],
      position: { x: 0, y: 0 }
    };

    // 生成地图
    const map = shootingMap.generateMap(8, this.data.floor);
    const enemies = shootingAI.generateEnemies(this.data.floor, map);
    const items = shootingItems.generateLoot(map);
    const exitPoint = this.findExitPoint(map);

    this.setData({
      player,
      map,
      enemies,
      items,
      exitPoint,
      gameState: 'playing'
    });

    // 启动倒计时
    this.startTimer();
  },

  // 找到撤离点
  findExitPoint: function(map) {
    // 在地图边缘找空位
    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[i].length; j++) {
        if (map[i][j].type === 'empty' && (i === 0 || i === map.length - 1 || j === 0 || j === map[i].length - 1)) {
          return { x: i, y: j };
        }
      }
    }
    return { x: map.length - 1, y: map[0].length - 1 };
  },

  // 启动倒计时
  startTimer: function() {
    const timerInterval = setInterval(() => {
      const newTimer = this.data.timer - 1;
      this.setData({ timer: newTimer });
      
      if (newTimer <= 0) {
        this.endGame('failed', '时间到！未能成功撤离');
      }
    }, 1000);
    
    this.setData({ timerInterval });
  },

  // 玩家移动
  onMove: function(e) {
    if (this.data.gameState !== 'playing') return;
    
    const { direction } = e.currentTarget.dataset;
    const { player, map, enemies } = this.data;
    
    let newX = player.position.x;
    let newY = player.position.y;
    
    if (direction === 'up') newX--;
    if (direction === 'down') newX++;
    if (direction === 'left') newY--;
    if (direction === 'right') newY++;
    
    // 检查边界和障碍
    if (newX < 0 || newX >= map.length || newY < 0 || newY >= map[0].length) {
      return;
    }
    
    const targetCell = map[newX][newY];
    if (targetCell.type === 'wall') {
      this.addLog('前方是墙壁，无法通过');
      return;
    }
    
    // 检查是否有敌人
    const enemy = enemies.find(e => e.position.x === newX && e.position.y === newY);
    if (enemy) {
      this.addLog('前方有敌人！');
      return;
    }
    
    // 移动玩家
    player.position = { x: newX, y: newY };
    
    // 检查是否捡到物品
    this.checkPickup(newX, newY);
    
    // 检查是否到达撤离点
    if (newX === this.data.exitPoint.x && newY === this.data.exitPoint.y) {
      this.showExitConfirm();
    }
    
    // 敌人回合
    this.enemyTurn();
    
    this.setData({ player, map });
  },

  // 检查拾取
  checkPickup: function(x, y) {
    const { items, player } = this.data;
    const itemIndex = items.findIndex(item => item.position.x === x && item.position.y === y);
    
    if (itemIndex !== -1) {
      const item = items[itemIndex];
      player.loot.push(item);
      items.splice(itemIndex, 1);
      
      this.addLog(`捡到：${item.name} (${item.quality})`);
      this.setData({ items, player });
    }
  },

  // 显示撤离确认
  showExitConfirm: function() {
    wx.showModal({
      title: '成功撤离',
      content: `本次获得金币：${this.data.player.gold}\n携带物资：${this.data.player.loot.length}件`,
      confirmText: '撤离',
      cancelText: '继续',
      success: (res) => {
        if (res.confirm) {
          this.endGame('success', '成功撤离');
        }
      }
    });
  },

  // 敌人回合
  enemyTurn: function() {
    const { player, enemies } = this.data;
    
    enemies.forEach(enemy => {
      // 简单的 AI：向玩家移动
      const dx = player.position.x - enemy.position.x;
      const dy = player.position.y - enemy.position.y;
      
      let newX = enemy.position.x;
      let newY = enemy.position.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        newX += dx > 0 ? 1 : -1;
      } else {
        newY += dy > 0 ? 1 : -1;
      }
      
      enemy.position = { x: newX, y: newY };
      
      // 检查是否攻击玩家
      if (newX === player.position.x && newY === player.position.y) {
        this.playerHit(enemy.damage);
      }
    });
    
    this.setData({ enemies });
  },

  // 玩家被击中
  playerHit: function(damage) {
    const { player } = this.data;
    
    // 先扣护甲
    if (player.armor > 0) {
      const armorDamage = Math.min(player.armor, damage);
      player.armor -= armorDamage;
      damage -= armorDamage;
    }
    
    // 再扣血
    player.hp -= damage;
    
    this.addLog(`被敌人击中！损失${damage}点生命值`);
    
    if (player.hp <= 0) {
      this.endGame('failed', '你被击败了');
    }
    
    this.setData({ player });
  },

  // 添加战斗日志
  addLog: function(message) {
    const battleLog = this.data.battleLog;
    battleLog.unshift({
      message,
      time: new Date().toLocaleTimeString()
    });
    
    // 只保留最近 10 条
    if (battleLog.length > 10) {
      battleLog.pop();
    }
    
    this.setData({ battleLog });
  },

  // 结束游戏
  endGame: function(result, reason) {
    clearInterval(this.data.timerInterval);
    
    this.setData({ 
      gameState: result === 'success' ? 'success' : 'failed',
      endReason: reason
    });
    
    if (result === 'success') {
      // 保存战利品
      this.saveLoot();
      
      wx.showModal({
        title: '🎉 成功撤离',
        content: reason,
        showCancel: false,
        success: () => {
          wx.navigateBack({ delta: 1 });
        }
      });
    } else {
      wx.showModal({
        title: '💀 任务失败',
        content: reason,
        showCancel: false,
        success: () => {
          wx.navigateBack({ delta: 1 });
        }
      });
    }
  },

  // 保存战利品
  saveLoot: function() {
    const inventory = wx.getStorageSync('shooting_inventory') || [];
    const loot = this.data.player.loot;
    
    // 添加到仓库
    inventory.push(...loot);
    wx.setStorageSync('shooting_inventory', inventory);
    
    // 更新金币
    const userInfo = wx.getStorageSync('shooting_userInfo') || {};
    userInfo.gold = (userInfo.gold || 0) + this.data.player.gold;
    userInfo.lootPassed = (userInfo.lootPassed || 0) + 1;
    wx.setStorageSync('shooting_userInfo', userInfo);
  },

  // 使用药品
  useMed: function(e) {
    const { index } = e.currentTarget.dataset;
    const { player, meds } = this.data;
    
    const med = meds[index];
    if (!med) return;
    
    player.hp = Math.min(player.hp + med.heal, player.maxHp);
    meds.splice(index, 1);
    
    this.addLog(`使用${med.name}，恢复${med.heal}点生命`);
    this.setData({ player, meds });
  },

  // 投掷手雷
  throwGrenade: function(e) {
    const { x, y } = e.currentTarget.dataset;
    const { player, enemies } = this.data;
    
    if (player.grenades.length === 0) {
      this.addLog('没有手雷了');
      return;
    }
    
    // 简单实现：对指定位置造成范围伤害
    const grenade = player.grenades.pop();
    
    enemies.forEach(enemy => {
      const distance = Math.abs(enemy.position.x - x) + Math.abs(enemy.position.y - y);
      if (distance <= 1) {
        enemy.hp -= grenade.damage;
      }
    });
    
    // 移除死亡的敌人
    const newEnemies = enemies.filter(e => e.hp > 0);
    
    this.addLog(`投掷${grenade.name}，消灭${enemies.length - newEnemies.length}个敌人`);
    this.setData({ player, enemies: newEnemies });
    
    this.enemyTurn();
  }
});
