// utils/shooting-ai.js - AI 对手系统

// 敌人类型
const ENEMY_TYPES = {
  PATROL: { name: '巡逻兵', hp: 50, damage: 15, accuracy: 0.5, speed: 1, reward: 10 },
  ELITE: { name: '精英守卫', hp: 100, damage: 25, accuracy: 0.7, speed: 1, reward: 25 },
  SNIPER: { name: '狙击手', hp: 60, damage: 50, accuracy: 0.9, speed: 0.5, reward: 40 },
  BOSS: { name: '守卫 BOSS', hp: 300, damage: 40, accuracy: 0.8, speed: 0.8, reward: 200 }
};

// 生成敌人
function generateEnemies(floor, map) {
  const enemies = [];
  const size = map.length;
  
  // 根据楼层决定敌人数量
  const enemyCount = 2 + floor * 2;
  
  for (let i = 0; i < enemyCount; i++) {
    // 根据楼层决定敌人类型
    let type;
    const rand = Math.random();
    
    if (floor === 1) {
      type = rand < 0.7 ? ENEMY_TYPES.PATROL : ENEMY_TYPES.ELITE;
    } else if (floor === 2) {
      if (rand < 0.4) type = ENEMY_TYPES.PATROL;
      else if (rand < 0.8) type = ENEMY_TYPES.ELITE;
      else type = ENEMY_TYPES.SNIPER;
    } else {
      if (rand < 0.3) type = ENEMY_TYPES.PATROL;
      else if (rand < 0.6) type = ENEMY_TYPES.ELITE;
      else if (rand < 0.9) type = ENEMY_TYPES.SNIPER;
      else type = ENEMY_TYPES.BOSS;
    }
    
    // 找空位放置敌人
    const pos = findEmptyPosition(map, enemies);
    if (pos) {
      enemies.push({
        id: 'enemy_' + i,
        type: type.name,
        hp: type.hp,
        maxHp: type.hp,
        damage: type.damage,
        accuracy: type.accuracy,
        speed: type.speed,
        position: pos,
        state: 'patrol', // patrol, chase, attack
        lastAttack: 0,
        reward: type.reward
      });
    }
  }
  
  return enemies;
}

// 找空位放置敌人
function findEmptyPosition(map, enemies) {
  const size = map.length;
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  
  for (let attempt = 0; attempt < 50; attempt++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    
    // 不在中心出生点
    if (Math.abs(x - centerX) < 2 && Math.abs(y - centerY) < 2) continue;
    
    // 不在墙壁上
    if (map[x][y].type === 'wall') continue;
    
    // 不与其他敌人重叠
    const occupied = enemies.some(e => e.position.x === x && e.position.y === y);
    if (occupied) continue;
    
    return { x, y };
  }
  
  return null;
}

// AI 决策
function aiDecision(enemy, player, map) {
  const dx = player.position.x - enemy.position.x;
  const dy = player.position.y - enemy.position.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  
  // 计算与玩家的距离
  if (distance <= 1) {
    // 近战：攻击
    return { action: 'attack', target: player.position };
  } else if (distance <= 5) {
    // 中距离：移动并准备攻击
    if (Math.random() < enemy.accuracy) {
      return { action: 'attack', target: player.position };
    } else {
      // 向玩家移动
      return { action: 'move', direction: getMoveDirection(dx, dy) };
    }
  } else {
    // 远距离：巡逻或向玩家移动
    if (enemy.state === 'chase' || Math.random() < 0.3) {
      return { action: 'move', direction: getMoveDirection(dx, dy) };
    } else {
      // 随机巡逻
      const directions = ['up', 'down', 'left', 'right'];
      return { action: 'move', direction: directions[Math.floor(Math.random() * 4)] };
    }
  }
}

// 获取移动方向
function getMoveDirection(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'down' : 'up';
  } else {
    return dy > 0 ? 'right' : 'left';
  }
}

// 执行 AI 行动
function executeAction(enemy, action, map, playerPos) {
  if (action.action === 'attack') {
    // 攻击
    const hitChance = enemy.accuracy;
    const hit = Math.random() < hitChance;
    
    return {
      type: 'attack',
      hit: hit,
      damage: hit ? enemy.damage : 0,
      enemy: enemy
    };
  } else if (action.action === 'move') {
    // 移动
    let newX = enemy.position.x;
    let newY = enemy.position.y;
    
    switch (action.direction) {
      case 'up': newX--; break;
      case 'down': newX++; break;
      case 'left': newY--; break;
      case 'right': newY++; break;
    }
    
    // 检查边界和障碍
    const size = map.length;
    if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
      if (map[newX][newY].type !== 'wall') {
        enemy.position = { x: newX, y: newY };
      }
    }
    
    return {
      type: 'move',
      enemy: enemy
    };
  }
  
  return { type: 'none' };
}

// 生成 BOSS
function generateBoss(floor, map) {
  const boss = {
    id: 'boss_' + floor,
    type: 'BOSS',
    name: `楼层守卫者·${floor}`,
    hp: 300 * floor,
    maxHp: 300 * floor,
    damage: 40 + (floor * 10),
    accuracy: 0.8,
    speed: 0.8,
    position: { x: 0, y: 0 }, // 会在地图边缘生成
    state: 'idle',
    phase: 1, // BOSS 阶段
    skills: ['smash', 'charge', 'summon'],
    reward: 200 * floor
  };
  
  // 在地图边缘找位置
  const size = map.length;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (map[i][j].type !== 'wall' && (i === 1 || i === size - 2 || j === 1 || j === size - 2)) {
        boss.position = { x: i, y: j };
        break;
      }
    }
    if (boss.position.x !== 0) break;
  }
  
  return boss;
}

// BOSS 技能
function bossSkill(boss, player, map) {
  const skillRoll = Math.random();
  
  if (skillRoll < 0.4) {
    // 重击：高伤害
    return {
      type: 'skill',
      name: '重击',
      damage: boss.damage * 2,
      hit: Math.random() < 0.6
    };
  } else if (skillRoll < 0.7) {
    // 冲锋：快速接近
    const dx = player.position.x - boss.position.x;
    const dy = player.position.y - boss.position.y;
    
    let newX = boss.position.x + (dx > 0 ? 2 : -2);
    let newY = boss.position.y + (dy > 0 ? 2 : -2);
    
    // 检查边界
    const size = map.length;
    newX = Math.max(0, Math.min(size - 1, newX));
    newY = Math.max(0, Math.min(size - 1, newY));
    
    if (map[newX][newY].type !== 'wall') {
      boss.position = { x: newX, y: newY };
    }
    
    return {
      type: 'skill',
      name: '冲锋',
      damage: 0,
      moved: true
    };
  } else {
    // 召唤：召唤小怪
    return {
      type: 'skill',
      name: '召唤',
      spawns: 2
    };
  }
}

// 计算伤害（考虑护甲）
function calculateDamage(damage, armor = 0) {
  const armorReduction = Math.min(armor / 300, 0.7); // 最多减免 70%
  return Math.floor(damage * (1 - armorReduction));
}

module.exports = {
  ENEMY_TYPES,
  generateEnemies,
  generateBoss,
  aiDecision,
  executeAction,
  bossSkill,
  calculateDamage
};
