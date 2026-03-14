// utils/shooting-items.js - 射击游戏道具系统

// 品质定义
const QUALITY = {
  GREEN: { name: '普通', color: '#52c41a', multiplier: 1.0 },
  BLUE: { name: '稀有', color: '#1890ff', multiplier: 1.3 },
  PURPLE: { name: '史诗', color: '#722ed1', multiplier: 1.6 },
  ORANGE: { name: '传说', color: '#fa8c16', multiplier: 2.0 },
  GOLD: { name: '神话', color: '#ffd700', multiplier: 3.0 }
};

// 护甲数据
const ARMOR_DATA = [
  { id: 'armor_1', name: '简易防弹衣', quality: 'GREEN', armorValue: 50, maxArmor: 50 },
  { id: 'armor_2', name: '警用防弹衣', quality: 'GREEN', armorValue: 80, maxArmor: 80 },
  { id: 'armor_3', name: '战术防弹衣', quality: 'BLUE', armorValue: 120, maxArmor: 100, speedBonus: 0.05 },
  { id: 'armor_4', name: '特种防弹衣', quality: 'PURPLE', armorValue: 180, maxArmor: 120, damageReduction: 0.1 },
  { id: 'armor_5', name: '精英防弹衣', quality: 'ORANGE', armorValue: 250, maxArmor: 150, damageReduction: 0.2, speedBonus: 0.1 },
  { id: 'armor_6', name: '光子机甲', quality: 'GOLD', armorValue: 400, maxArmor: 200, damageReduction: 0.3, regen: 5 }
];

// 枪械数据
const WEAPON_DATA = [
  // 绿色品质
  { id: 'w_p1911', name: 'P1911 手枪', quality: 'GREEN', damage: 35, magazine: 7, fireRate: 'slow', ammoType: '9mm' },
  { id: 'w_s12k', name: 'S12K 霰弹枪', quality: 'GREEN', damage: 80, magazine: 5, fireRate: 'slow', ammoType: '12 口径' },
  { id: 'w_ump', name: 'UMP 冲锋枪', quality: 'GREEN', damage: 40, magazine: 25, fireRate: 'medium', ammoType: '9mm' },
  
  // 蓝色品质
  { id: 'w_m416', name: 'M416 步枪', quality: 'BLUE', damage: 55, magazine: 30, fireRate: 'fast', ammoType: '5.56mm' },
  { id: 'w_akm', name: 'AKM 步枪', quality: 'BLUE', damage: 65, magazine: 30, fireRate: 'medium', ammoType: '7.62mm' },
  { id: 'w_mini14', name: 'Mini14 狙击枪', quality: 'BLUE', damage: 70, magazine: 20, fireRate: 'fast', ammoType: '5.56mm' },
  
  // 紫色品质
  { id: 'w_scar', name: 'SCAR-L 步枪', quality: 'PURPLE', damage: 60, magazine: 35, fireRate: 'fast', ammoType: '5.56mm' },
  { id: 'w_98k', name: 'Kar98K', quality: 'PURPLE', damage: 90, magazine: 5, fireRate: 'slow', ammoType: '7.62mm' },
  { id: 'w_dp28', name: 'DP28 机枪', quality: 'PURPLE', damage: 50, magazine: 47, fireRate: 'medium', ammoType: '7.62mm' },
  
  // 橙色品质
  { id: 'w_m249', name: 'M249 轻机枪', quality: 'ORANGE', damage: 65, magazine: 100, fireRate: 'fast', ammoType: '5.56mm' },
  { id: 'w_awm', name: 'AWM 狙击枪', quality: 'ORANGE', damage: 120, magazine: 5, fireRate: 'slow', ammoType: '.300', ignoreArmor: true },
  { id: 'w_vector', name: 'Vector 冲锋枪', quality: 'ORANGE', damage: 45, magazine: 40, fireRate: 'very_fast', ammoType: '9mm' },
  
  // 金色品质
  { id: 'w_photon', name: '光子步枪', quality: 'GOLD', damage: 80, magazine: 50, fireRate: 'very_fast', ammoType: '光子', autoAim: true, penetrate: true },
  { id: 'w_laser', name: '激光狙击枪', quality: 'GOLD', damage: 150, magazine: 3, fireRate: 'medium', ammoType: '激光', ignoreCover: true },
  { id: 'w_plasma', name: '等离子机枪', quality: 'GOLD', damage: 70, magazine: 150, fireRate: 'fast', ammoType: '等离子', areaDamage: true }
];

// 药品数据
const MED_DATA = [
  { id: 'med_bandage', name: '绷带', quality: 'GREEN', heal: 20, maxHpCap: 75, useTime: 3 },
  { id: 'med_firstaid', name: '急救包', quality: 'BLUE', heal: 50, maxHpCap: 90, useTime: 5 },
  { id: 'med_medkit', name: '医疗箱', quality: 'PURPLE', heal: 100, maxHpCap: 100, useTime: 8 },
  { id: 'med_adrenaline', name: '肾上腺素', quality: 'ORANGE', heal: 50, speedBonus: 0.2, duration: 30, useTime: 4 },
  { id: 'med_energy', name: '能量饮料', quality: 'GREEN', speedBonus: 0.1, duration: 15, useTime: 2 },
  { id: 'med_painkiller', name: '止痛药', quality: 'BLUE', damageReduction: 0.15, duration: 20, useTime: 3 },
  { id: 'med_mecha_repair', name: '机甲修复液', quality: 'GOLD', heal: 100, shield: 50, useTime: 6 }
];

// 投掷物数据
const GRENADE_DATA = [
  { id: 'grenade_flash', name: '闪光弹', quality: 'BLUE', damage: 0, effect: 'blind', effectDuration: 3, maxCarry: 3 },
  { id: 'grenade_frag', name: '手雷', quality: 'GREEN', damage: 100, effect: 'explosion', radius: 2, maxCarry: 3 },
  { id: 'grenade_smoke', name: '烟雾弹', quality: 'BLUE', damage: 0, effect: 'smoke', effectDuration: 10, maxCarry: 3 },
  { id: 'grenade_molotov', name: '燃烧瓶', quality: 'PURPLE', damage: 20, effect: 'burn', effectDuration: 5, maxCarry: 2 },
  { id: 'grenade_stun', name: '震爆弹', quality: 'ORANGE', damage: 30, effect: 'stun', effectDuration: 2, maxCarry: 2 },
  { id: 'grenade_drone', name: '侦查无人机', quality: 'GOLD', damage: 0, effect: 'reveal', effectDuration: 15, maxCarry: 1 }
];

// 子弹数据
const AMMO_DATA = {
  '9mm': { name: '9mm 子弹', damageBonus: 0, armorPenetration: 1.0 },
  '5.56mm': { name: '5.56mm 子弹', damageBonus: 0, armorPenetration: 1.0 },
  '7.62mm': { name: '7.62mm 子弹', damageBonus: 0.1, armorPenetration: 1.2 },
  '.300': { name: '.300 马格南', damageBonus: 0.2, armorPenetration: 1.5 },
  '12 口径': { name: '12 口径霰弹', damageBonus: 0, armorPenetration: 0.8 },
  '光子': { name: '光子弹', damageBonus: 0.5, armorPenetration: 3.0 },
  '激光': { name: '激光弹', damageBonus: 0.5, armorPenetration: 3.0 },
  '等离子': { name: '等离子弹', damageBonus: 0.3, armorPenetration: 2.0 }
};

// 宝物数据（摸金模式）
const LOOT_DATA = [
  { id: 'loot_watch', name: '旧手表', quality: 'GREEN', value: 10 },
  { id: 'loot_book', name: '破损书籍', quality: 'GREEN', value: 10 },
  { id: 'loot_vase', name: '古董花瓶', quality: 'BLUE', value: 50 },
  { id: 'loot_ring', name: '金戒指', quality: 'BLUE', value: 50 },
  { id: 'loot_jade', name: '玉佩', quality: 'PURPLE', value: 200 },
  { id: 'loot_seal', name: '传国玉玺', quality: 'ORANGE', value: 500 },
  { id: 'loot_pearl', name: '夜明珠', quality: 'ORANGE', value: 500 },
  { id: 'loot_mecha_core', name: '机甲核心', quality: 'GOLD', value: 1000 },
  { id: 'loot_boss_key', name: 'BOSS 钥匙', quality: 'GOLD', value: 0, special: 'unlock_boss' }
];

// 根据品质随机获取物品
function getRandomItemByType(type, floor = 1) {
  const rand = Math.random();
  let quality;
  
  // 根据楼层调整品质概率
  const qualityChance = {
    GREEN: 0.5 - (floor * 0.05),
    BLUE: 0.3 - (floor * 0.03),
    PURPLE: 0.15 - (floor * 0.02),
    ORANGE: 0.05 - (floor * 0.01),
    GOLD: 0.01 + (floor * 0.005)
  };
  
  if (rand < qualityChance.GREEN) quality = 'GREEN';
  else if (rand < qualityChance.GREEN + qualityChance.BLUE) quality = 'BLUE';
  else if (rand < qualityChance.GREEN + qualityChance.BLUE + qualityChance.PURPLE) quality = 'PURPLE';
  else if (rand < qualityChance.GREEN + qualityChance.BLUE + qualityChance.PURPLE + qualityChance.ORANGE) quality = 'ORANGE';
  else quality = 'GOLD';
  
  let pool;
  switch(type) {
    case 'armor': pool = ARMOR_DATA.filter(i => i.quality === quality); break;
    case 'weapon': pool = WEAPON_DATA.filter(i => i.quality === quality); break;
    case 'med': pool = MED_DATA.filter(i => i.quality === quality); break;
    case 'grenade': pool = GRENADE_DATA.filter(i => i.quality === quality); break;
    case 'loot': pool = LOOT_DATA.filter(i => i.quality === quality); break;
    default: pool = [];
  }
  
  if (pool.length === 0) {
    pool = ARMOR_DATA.filter(i => i.quality === 'GREEN');
  }
  
  const item = pool[Math.floor(Math.random() * pool.length)];
  return { ...item, id: item.id + '_' + Date.now() };
}

// 生成随机物资
function generateLoot(map) {
  const items = [];
  const size = map.length;
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < map[i].length; j++) {
      if (map[i][j].type === 'empty' && Math.random() < 0.15) {
        const typeRoll = Math.random();
        let type;
        
        if (typeRoll < 0.4) type = 'med';
        else if (typeRoll < 0.6) type = 'grenade';
        else if (typeRoll < 0.8) type = 'weapon';
        else if (typeRoll < 0.9) type = 'armor';
        else type = 'loot';
        
        const item = getRandomItemByType(type, 1);
        item.position = { x: i, y: j };
        items.push(item);
      }
    }
  }
  
  return items;
}

// 计算伤害
function calculateDamage(weapon, ammo, targetArmor = 0) {
  const ammoData = AMMO_DATA[weapon.ammoType];
  if (!ammoData) return weapon.damage;
  
  let damage = weapon.damage * ammoData.damageBonus;
  
  // 护甲计算
  const penetration = ammoData.armorPenetration;
  const effectiveArmor = targetArmor / penetration;
  
  if (weapon.ignoreArmor) {
    damage = damage; // 无视护甲
  } else {
    damage = damage * (1 - Math.min(effectiveArmor / 500, 0.7));
  }
  
  return Math.floor(damage);
}

module.exports = {
  QUALITY,
  ARMOR_DATA,
  WEAPON_DATA,
  MED_DATA,
  GRENADE_DATA,
  AMMO_DATA,
  LOOT_DATA,
  getRandomItemByType,
  generateLoot,
  calculateDamage
};
