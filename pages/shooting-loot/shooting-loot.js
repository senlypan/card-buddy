// pages/shooting-loot/shooting-loot.js - 摸金模式（完整版）
const shootingItems = require('../../utils/shooting-items.js');
const shootingMap = require('../../utils/shooting-map.js');
const shootingAI = require('../../utils/shooting-ai.js');

Page({
  data: {
    // 游戏状态
    gameState: 'prepare', // prepare, playing, success, failed
    floor: 1,
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
    displayMap: [],
    mapSize: 8,
    
    // 敌人
    enemies: [],
    boss: null,
    
    // 可交互对象
    items: [],
    lootBoxes: [], // 可搜索的物资箱
    
    // 撤离点
    exitPoint: null,
    
    // 战斗日志
    battleLog: [],
    
    // 倒计时
    timer: 300, // 5 分钟
    
    // 品质颜色
    qualityColors: {
      green: '#52c41a',
      blue: '#1890ff',
      purple: '#722ed1',
      orange: '#fa8c16',
      gold: '#ffd700'
    },

    // 游戏提示
    gameTip: '探索建筑，收集物资，成功撤离！'
  },

  onLoad: function() {
    this.initGame();
  },

  onUnload: function() {
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
    
    // 获取用户金币
    const userInfo = wx.getStorageSync('shooting_userInfo') || {};
    const userGold = userInfo.gold || 1000;
    
    let player = {
      hp: 100,
      maxHp: 100,
      armor: equippedArmor ? equippedArmor.armorValue : 0,
      maxArmor: equippedArmor ? equippedArmor.maxArmor : 0,
      weapon: equippedWeapon,
      ammo: equippedWeapon ? 30 : 0,
      grenades: [],
      meds: [],
      gold: userGold,
      loot: [],
      position: { x: 4, y: 4 }
    };

    // 生成地图
    const map = shootingMap.generateMap(8, this.data.floor);
    const enemies = shootingAI.generateEnemies(this.data.floor, map);
    const items = shootingItems.generateLoot(map);
    const exitPoint = this.findExitPoint(map);
    const lootBoxes = this.generateLootBoxes(map);

    this.setData({
      player,
      map,
      enemies,
      items,
      lootBoxes,
      exitPoint,
      gameState: 'playing'
    });

    // 初始化地图显示
    this.updateMapDisplay();
    
    // 启动倒计时
    this.startTimer();
    
    // 添加初始日志
    this.addLog('=== 摸金行动开始 ===');
    this.addLog('目标：收集物资，成功撤离');
    this.addLog(`剩余时间：${this.data.timer}秒`);
  },

  // 生成物资箱
  generateLootBoxes: function(map) {
    const boxes = [];
    const size = map.length;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < map[i].length; j++) {
        if (map[i][j].type === 'empty' && Math.random() < 0.1) {
          const isRare = Math.random() < 0.2; // 20% 概率是稀有箱子
          boxes.push({
            id: 'box_' + i + '_' + j,
            position: { x: i, y: j },
            searched: false,
            isRare: isRare,
            type: isRare ? 'rare' : 'common'
          });
        }
      }
    }
    
    return boxes;
  },

  // 找到撤离点
  findExitPoint: function(map) {
    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[i].length; j++) {
        if (map[i][j].type === 'empty' && 
            (i === 0 || i === map.length - 1 || j === 0 || j === map[i].length - 1)) {
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
    
    // 检查边界
    if (newX < 0 || newX >= map.length || newY < 0 || newY >= map[0].length) {
      return;
    }
    
    const targetCell = map[newX][newY];
    if (targetCell.type === 'wall') {
      this.addLog('前方是墙壁，无法通过');
      wx.vibrateShort({ type: 'light' });
      return;
    }
    
    // 检查是否有敌人
    const enemy = enemies.find(e => e.position.x === newX && e.position.y === newY);
    if (enemy) {
      this.addLog(`发现敌人：${enemy.type}！`);
      wx.vibrateShort({ type: 'medium' });
      return;
    }
    
    // 移动玩家
    player.position = { x: newX, y: newY };
    
    // 检查是否捡到物品
    this.checkPickup(newX, newY);
    
    // 检查是否可以搜索物资箱
    this.checkLootBox(newX, newY);
    
    // 检查是否到达撤离点
    if (newX === this.data.exitPoint.x && newY === this.data.exitPoint.y) {
      this.showExitConfirm();
      return;
    }
    
    // 敌人回合
    this.enemyTurn();
    
    // 更新地图显示
    this.updateMapDisplay();
    
    this.setData({ player });
  },

  // 检查拾取
  checkPickup: function(x, y) {
    const { items, player } = this.data;
    const itemIndex = items.findIndex(item => item.position.x === x && item.position.y === y);
    
    if (itemIndex !== -1) {
      const item = items[itemIndex];
      
      // 自动分类
      if (item.type === 'med') {
        player.meds.push(item);
        this.addLog(`拾取药品：${item.name}`);
      } else if (item.type === 'grenade') {
        player.grenades.push(item);
        this.addLog(`拾取投掷物：${item.name}`);
      } else if (item.type === 'weapon') {
        player.loot.push(item);
        this.addLog(`拾取武器：${item.name}（${item.quality}）`);
      } else if (item.type === 'armor') {
        player.loot.push(item);
        this.addLog(`拾取护甲：${item.name}（${item.quality}）`);
      } else if (item.type === 'loot') {
        player.loot.push(item);
        player.gold += item.value;
        this.addLog(`拾取宝物：${item.name}（价值${item.value}金币）`);
      }
      
      items.splice(itemIndex, 1);
      this.setData({ items, player });
      wx.vibrateShort({ type: 'light' });
    }
  },

  // 检查物资箱
  checkLootBox: function(x, y) {
    const { lootBoxes } = this.data;
    const boxIndex = lootBoxes.findIndex(box => 
      box.position.x === x && 
      box.position.y === y && 
      !box.searched
    );
    
    if (boxIndex !== -1) {
      const box = lootBoxes[boxIndex];
      this.searchLootBox(boxIndex);
    }
  },

  // 搜索物资箱
  searchLootBox: function(boxIndex) {
    const { lootBoxes, player } = this.data;
    const box = lootBoxes[boxIndex];
    
    // 生成战利品
    const qualityRoll = Math.random();
    let quality = 'GREEN';
    
    if (box.isRare) {
      if (qualityRoll < 0.3) quality = 'BLUE';
      else if (qualityRoll < 0.5) quality = 'PURPLE';
      else if (qualityRoll < 0.7) quality = 'ORANGE';
      else if (qualityRoll < 0.8) quality = 'GOLD';
    } else {
      if (qualityRoll < 0.6) quality = 'GREEN';
      else quality = 'BLUE';
    }
    
    // 随机生成物品
    const types = ['med', 'grenade', 'weapon', 'armor', 'loot'];
    const type = types[Math.floor(Math.random() * types.length)];
    const item = shootingItems.getRandomItemByType(type, this.data.floor);
    
    // 添加到玩家背包
    if (item.type === 'med') {
      player.meds.push(item);
    } else if (item.type === 'grenade') {
      player.grenades.push(item);
    } else {
      player.loot.push(item);
      if (item.value) {
        player.gold += item.value;
      }
    }
    
    box.searched = true;
    
    this.addLog(`搜索物资箱：获得${item.name}（${item.quality}）`);
    wx.vibrateShort({ type: 'medium' });
    
    this.setData({ lootBoxes, player });
  },

  // 敌人回合
  enemyTurn: function() {
    const { player, enemies } = this.data;
    
    enemies.forEach(enemy => {
      // 简单 AI：向玩家移动
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
        this.playerHit(enemy.damage, enemy.type);
      }
    });
    
    this.setData({ enemies });
  },

  // 玩家被击中
  playerHit: function(damage, enemyType) {
    const { player } = this.data;
    
    // 先扣护甲
    if (player.armor > 0) {
      const armorDamage = Math.min(player.armor, damage);
      player.armor -= armorDamage;
      damage -= armorDamage;
    }
    
    // 再扣血
    player.hp -= damage;
    
    this.addLog(`被${enemyType}击中！损失${damage}点生命`);
    wx.vibrateShort({ type: 'heavy' });
    
    if (player.hp <= 0) {
      this.endGame('failed', '你被击败了');
    }
    
    this.setData({ player });
  },

  // 使用药品
  useMed: function(e) {
    const { index } = e.currentTarget.dataset;
    const { player, meds } = this.data;
    
    const med = meds[index];
    if (!med) return;
    
    const healAmount = med.heal || 20;
    const maxHpCap = med.maxHpCap || 100;
    
    player.hp = Math.min(player.hp + healAmount, maxHpCap);
    meds.splice(index, 1);
    
    this.addLog(`使用${med.name}，恢复${healAmount}点生命`);
    wx.vibrateShort({ type: 'light' });
    
    this.setData({ player, meds });
  },

  // 更新地图显示
  updateMapDisplay: function() {
    const { map, enemies, items, lootBoxes, exitPoint, player } = this.data;
    const size = map.length;
    
    const displayMap = map.map((row, i) => {
      return row.map((cell, j) => {
        const newCell = { ...cell };
        
        const hasEnemy = enemies.some(e => e.position.x === i && e.position.y === j);
        const hasItem = items.some(item => item.position.x === i && item.position.y === j);
        const hasLootBox = lootBoxes.some(box => 
          box.position.x === i && 
          box.position.y === j && 
          !box.searched
        );
        const isPlayer = player.position.x === i && player.position.y === j;
        const isExit = exitPoint.x === i && exitPoint.y === j;
        
        newCell.hasEnemy = hasEnemy;
        newCell.hasItem = hasItem;
        newCell.hasLootBox = hasLootBox;
        newCell.isPlayer = isPlayer;
        newCell.isExit = isExit;
        
        return newCell;
      });
    });
    
    this.setData({ displayMap });
  },

  // 显示撤离确认
  showExitConfirm: function() {
    const { player } = this.data;
    
    wx.showModal({
      title: '🚁 撤离点',
      content: `本次获得金币：${player.gold}\n携带物资：${player.loot.length}件\n确定要撤离吗？`,
      confirmText: '撤离',
      cancelText: '继续',
      confirmColor: '#52c41a',
      success: (res) => {
        if (res.confirm) {
          this.endGame('success', '成功撤离');
        }
      }
    });
  },

  // 结束游戏
  endGame: function(result, reason) {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
    
    this.setData({ 
      gameState: result === 'success' ? 'success' : 'failed',
      endReason: reason
    });
    
    if (result === 'success') {
      this.saveLoot();
      
      wx.showModal({
        title: '🎉 成功撤离',
        content: `${reason}\n获得金币：${this.data.player.gold}\n物资：${this.data.player.loot.length}件`,
        showCancel: false,
        confirmColor: '#52c41a',
        success: () => {
          wx.navigateBack({ delta: 1 });
        }
      });
    } else {
      wx.showModal({
        title: '💀 任务失败',
        content: reason,
        showCancel: false,
        confirmColor: '#ff4444',
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
    
    inventory.push(...loot);
    wx.setStorageSync('shooting_inventory', inventory);
    
    const userInfo = wx.getStorageSync('shooting_userInfo') || {};
    userInfo.gold = (userInfo.gold || 0) + this.data.player.gold;
    userInfo.lootPassed = (userInfo.lootPassed || 0) + 1;
    userInfo.totalGames = (userInfo.totalGames || 0) + 1;
    userInfo.totalWins = (userInfo.totalWins || 0) + 1;
    wx.setStorageSync('shooting_userInfo', userInfo);
  },

  // 添加战斗日志
  addLog: function(message) {
    const battleLog = this.data.battleLog;
    battleLog.unshift({
      message,
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    
    if (battleLog.length > 20) {
      battleLog.pop();
    }
    
    this.setData({ battleLog });
  }
});
