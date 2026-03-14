// pages/shooting-loot/shooting-loot.js - 摸金模式（小学生友好版）
const shootingItems = require('../../utils/shooting-items.js');
const shootingMap = require('../../utils/shooting-map.js');
const shootingAI = require('../../utils/shooting-ai.js');

Page({
  data: {
    // 游戏状态
    gameState: 'prepare',
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
      position: { x: 4, y: 4 }
    },
    
    // 地图
    map: [],
    displayMap: [],
    mapSize: 8,
    
    // 敌人（改为守卫机器人，避免暴力）
    enemies: [],
    boss: null,
    
    // 可交互对象
    items: [],
    lootBoxes: [],
    
    // 撤离点
    exitPoint: null,
    
    // 战斗日志
    battleLog: [],
    
    // 倒计时
    timer: 300,
    
    // 品质颜色（鲜艳明亮）
    qualityColors: {
      green: '#52c41a',
      blue: '#1890ff',
      purple: '#722ed1',
      orange: '#fa8c16',
      gold: '#ffd700'
    },

    // 小学生友好提示
    gameTip: '✨ 收集宝物，躲避守卫，成功撤离！',
    
    // 鼓励语
    encouragements: [
      '太棒了！🎉',
      '干得漂亮！⭐',
      '继续加油！💪',
      '真厉害！👍',
      '你是最棒的！🏆'
    ]
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
    const inventory = wx.getStorageSync('shooting_inventory') || [];
    const equippedArmor = inventory.find(item => item.equipped && item.type === 'armor');
    const equippedWeapon = inventory.find(item => item.equipped && item.type === 'weapon');
    
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

    this.updateMapDisplay();
    this.startTimer();
    
    // 小学生友好的欢迎提示
    this.addLog('🌟 摸金大冒险开始啦！');
    this.addLog('🎯 目标：收集宝物，成功撤离');
    this.addLog('💡 提示：走到📦箱子上自动搜索');
    this.addLog(`⏰ 剩余时间：${this.data.timer}秒`);
    
    // 播放轻快提示音（如果支持）
    this.playSound('start');
  },

  // 生成物资箱
  generateLootBoxes: function(map) {
    const boxes = [];
    const size = map.length;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < map[i].length; j++) {
        if (map[i][j].type === 'empty' && Math.random() < 0.15) {
          const isRare = Math.random() < 0.25;
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
      
      // 时间提醒（小学生友好）
      if (newTimer === 120) {
        this.addLog('⏰ 还剩 2 分钟，加油！');
      } else if (newTimer === 60) {
        this.addLog('⚠️ 只剩 1 分钟了，快点撤离！');
      } else if (newTimer === 30) {
        this.addLog('🚨 最后 30 秒！快跑！');
      }
      
      if (newTimer <= 0) {
        this.endGame('failed', '时间到啦！下次要更快一点哦～');
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
      this.addLog('🧱 前面是墙，过不去呢～');
      wx.vibrateShort({ type: 'light' });
      return;
    }
    
    // 检查是否有敌人（改为"守卫机器人"）
    const enemy = enemies.find(e => e.position.x === newX && e.position.y === newY);
    if (enemy) {
      this.addLog(`🤖 守卫机器人挡住了去路！`);
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

  // 检查拾取（小学生友好提示）
  checkPickup: function(x, y) {
    const { items, player } = this.data;
    const itemIndex = items.findIndex(item => item.position.x === x && item.position.y === y);
    
    if (itemIndex !== -1) {
      const item = items[itemIndex];
      
      if (item.type === 'med') {
        player.meds.push(item);
        this.addLog(`💊 捡到${item.name}，可以回血哦！`);
      } else if (item.type === 'grenade') {
        player.grenades.push(item);
        this.addLog(`💣 捡到${item.name}！`);
      } else if (item.type === 'weapon') {
        player.loot.push(item);
        this.addLog(`🔫 发现${item.name}（${this.getQualityEmoji(item.quality)}）`);
      } else if (item.type === 'armor') {
        player.loot.push(item);
        this.addLog(`🦺 找到${item.name}（${this.getQualityEmoji(item.quality)}）`);
      } else if (item.type === 'loot') {
        player.loot.push(item);
        player.gold += item.value;
        this.addLog(`💎 哇！${item.name}！价值${item.value}金币！`);
        this.showEncouragement();
      }
      
      items.splice(itemIndex, 1);
      this.setData({ items, player });
      wx.vibrateShort({ type: 'light' });
      this.playSound('pickup');
    }
  },

  // 搜索物资箱
  searchLootBox: function(boxIndex) {
    const { lootBoxes, player } = this.data;
    const box = lootBoxes[boxIndex];
    
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
    
    const types = ['med', 'grenade', 'weapon', 'armor', 'loot'];
    const type = types[Math.floor(Math.random() * types.length)];
    const item = shootingItems.getRandomItemByType(type, this.data.floor);
    
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
    
    this.addLog(`🎁 打开宝箱：${item.name}（${this.getQualityEmoji(item.quality)}）`);
    wx.vibrateShort({ type: 'medium' });
    this.playSound('box');
    
    // 开出好东西时给予鼓励
    if (quality === 'PURPLE' || quality === 'ORANGE' || quality === 'GOLD') {
      this.showEncouragement();
      this.addLog('🌟 哇！超级厉害的宝物！');
    }
    
    this.setData({ lootBoxes, player });
  },

  // 敌人回合（改为"守卫机器人巡逻"）
  enemyTurn: function() {
    const { player, enemies } = this.data;
    
    enemies.forEach(enemy => {
      // 简化 AI：慢慢向玩家移动
      const dx = player.position.x - enemy.position.x;
      const dy = player.position.y - enemy.position.y;
      
      // 50% 概率移动（降低难度）
      if (Math.random() < 0.5) {
        let newX = enemy.position.x;
        let newY = enemy.position.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          newX += dx > 0 ? 1 : -1;
        } else {
          newY += dy > 0 ? 1 : -1;
        }
        
        enemy.position = { x: newX, y: newY };
        
        // 检查是否碰到玩家
        if (newX === player.position.x && newY === player.position.y) {
          this.playerHit(Math.floor(enemy.damage * 0.6), enemy.type); // 降低伤害
        }
      }
    });
    
    this.setData({ enemies });
  },

  // 玩家被击中（温和提示）
  playerHit: function(damage, enemyType) {
    const { player } = this.data;
    
    if (player.armor > 0) {
      const armorDamage = Math.min(player.armor, damage);
      player.armor -= armorDamage;
      damage -= armorDamage;
    }
    
    player.hp -= damage;
    
    this.addLog(`⚠️ 被守卫机器人碰到！掉了${damage}点血`);
    wx.vibrateShort({ type: 'medium' });
    
    if (player.hp <= 0) {
      this.endGame('failed', '哎呀！被抓住了～下次要更小心哦！');
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
    
    this.addLog(`💊 使用${med.name}，恢复了${healAmount}点生命！`);
    wx.vibrateShort({ type: 'light' });
    this.playSound('heal');
    
    // 鼓励
    if (player.hp > 80) {
      this.addLog('✨ 状态恢复啦！继续加油！');
    }
    
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
      title: '🚁 撤离直升机',
      content: `太棒啦！收集了这么多宝物！\n\n💰 金币：${player.gold}\n🎒 物资：${player.loot.length}件\n\n要撤离吗？`,
      confirmText: '撤离✈️',
      cancelText: '再逛逛',
      confirmColor: '#52c41a',
      success: (res) => {
        if (res.confirm) {
          this.endGame('success', '成功撤离！你真厉害！');
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
        title: '🎉 大成功！',
        content: `${reason}\n\n🏆 获得金币：${this.data.player.gold}\n📦 物资：${this.data.player.loot.length}件\n\n你真是个寻宝小能手！`,
        showCancel: false,
        confirmColor: '#52c41a',
        success: () => {
          wx.navigateBack({ delta: 1 });
        }
      });
    } else {
      wx.showModal({
        title: '💪 继续加油！',
        content: `${reason}\n\n别灰心，多练习几次就会更厉害！\n要不要再来一次？`,
        showCancel: false,
        confirmColor: '#1890ff',
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

  // 添加战斗日志（小学生友好）
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
  },

  // 显示鼓励
  showEncouragement: function() {
    const encouragements = this.data.encouragements;
    const randomMsg = encouragements[Math.floor(Math.random() * encouragements.length)];
    this.addLog(`${randomMsg}`);
  },

  // 获取品质 Emoji
  getQualityEmoji: function(quality) {
    const emojis = {
      'GREEN': '🟢',
      'BLUE': '🔵',
      'PURPLE': '🟣',
      'ORANGE': '🟠',
      'GOLD': '🟡'
    };
    return emojis[quality] || '⚪';
  },

  // 播放音效（预留接口）
  playSound: function(type) {
    // 后续可以添加音效
    // const sounds = {
    //   'start': 'sounds/start.mp3',
    //   'pickup': 'sounds/pickup.mp3',
    //   'box': 'sounds/box.mp3',
    //   'heal': 'sounds/heal.mp3'
    // };
  }
});
