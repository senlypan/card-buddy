// utils/shooting-map.js - 地图生成系统

// 地图元素类型
const CELL_TYPE = {
  EMPTY: 'empty',      // 空地
  WALL: 'wall',        // 墙壁
  DOOR: 'door',        // 门
  STAIRS: 'stairs',    // 楼梯
  LOOT: 'loot',        // 物资点
  EXIT: 'exit'         // 撤离点
};

// 房间模板
const ROOM_TEMPLATES = [
  { name: 'small', width: 3, height: 3 },
  { name: 'medium', width: 4, height: 4 },
  { name: 'large', width: 5, height: 5 },
  { name: 'long', width: 2, height: 6 },
  { name: 'wide', width: 6, height: 2 }
];

// 生成空地图
function createEmptyMap(size) {
  const map = [];
  for (let i = 0; i < size; i++) {
    map[i] = [];
    for (let j = 0; j < size; j++) {
      map[i][j] = {
        type: CELL_TYPE.EMPTY,
        x: i,
        y: j,
        visible: false,
        explored: false
      };
    }
  }
  return map;
}

// 生成墙壁
function generateWalls(map, size) {
  // 边界墙壁
  for (let i = 0; i < size; i++) {
    map[0][i].type = CELL_TYPE.WALL;
    map[size - 1][i].type = CELL_TYPE.WALL;
    map[i][0].type = CELL_TYPE.WALL;
    map[i][size - 1].type = CELL_TYPE.WALL;
  }
  
  // 随机内部墙壁
  const wallCount = Math.floor(size * 1.5);
  for (let i = 0; i < wallCount; i++) {
    const x = Math.floor(Math.random() * (size - 2)) + 1;
    const y = Math.floor(Math.random() * (size - 2)) + 1;
    
    // 不在中心生成墙壁（玩家出生点）
    if (x === Math.floor(size / 2) && y === Math.floor(size / 2)) continue;
    
    map[x][y].type = CELL_TYPE.WALL;
  }
  
  return map;
}

// 生成房间
function generateRooms(map, size, floor) {
  const roomCount = Math.floor(Math.random() * 3) + 2 + floor; // 楼层越高房间越多
  
  for (let r = 0; r < roomCount; r++) {
    const template = ROOM_TEMPLATES[Math.floor(Math.random() * ROOM_TEMPLATES.length)];
    const startX = Math.floor(Math.random() * (size - template.width - 2)) + 1;
    const startY = Math.floor(Math.random() * (size - template.height - 2)) + 1;
    
    // 清理区域内的墙壁
    for (let i = startX; i < startX + template.width; i++) {
      for (let j = startY; j < startY + template.height; j++) {
        if (i > 0 && i < size - 1 && j > 0 && j < size - 1) {
          map[i][j].type = CELL_TYPE.EMPTY;
          map[i][j].room = r; // 标记房间 ID
        }
      }
    }
  }
  
  return map;
}

// 生成走廊
function generateCorridors(map, size) {
  // 简单的水平 + 垂直走廊连接
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  
  // 从中心向四周挖走廊
  for (let i = 1; i < size - 1; i++) {
    if (map[i][centerY].type === CELL_TYPE.WALL) {
      map[i][centerY].type = CELL_TYPE.EMPTY;
    }
    if (map[centerX][i].type === CELL_TYPE.WALL) {
      map[centerX][i].type = CELL_TYPE.EMPTY;
    }
  }
  
  return map;
}

// 放置楼梯
function placeStairs(map, size) {
  // 在边缘找空位放置楼梯
  for (let i = 1; i < size - 1; i++) {
    for (let j = 1; j < size - 1; j++) {
      if (map[i][j].type === CELL_TYPE.EMPTY && 
          (i === 1 || i === size - 2 || j === 1 || j === size - 2)) {
        map[i][j].type = CELL_TYPE.STAIRS;
        return map;
      }
    }
  }
  return map;
}

// 生成完整地图
function generateMap(size = 8, floor = 1) {
  let map = createEmptyMap(size);
  map = generateWalls(map, size);
  map = generateRooms(map, size, floor);
  map = generateCorridors(map, size);
  
  // 玩家出生点（中心位置）
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  map[centerX][centerY].type = CELL_TYPE.EMPTY;
  map[centerX][centerY].spawn = true;
  
  // 放置楼梯（通往下一层）
  if (floor < 3) {
    map = placeStairs(map, size);
  }
  
  return map;
}

// 检查路径是否可达（简单 BFS）
function isPathReachable(map, from, to) {
  const size = map.length;
  const visited = new Set();
  const queue = [from];
  
  while (queue.length > 0) {
    const current = queue.shift();
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (current.x === to.x && current.y === to.y) {
      return true;
    }
    
    // 四个方向
    const directions = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 }
    ];
    
    for (const dir of directions) {
      const newX = current.x + dir.x;
      const newY = current.y + dir.y;
      
      if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
        const cell = map[newX][newY];
        if (cell.type !== CELL_TYPE.WALL && !visited.has(`${newX},${newY}`)) {
          queue.push({ x: newX, y: newY });
        }
      }
    }
  }
  
  return false;
}

// 获取可行走位置
function getWalkablePositions(map) {
  const positions = [];
  const size = map.length;
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < map[i].length; j++) {
      if (map[i][j].type !== CELL_TYPE.WALL) {
        positions.push({ x: i, y: j });
      }
    }
  }
  
  return positions;
}

// 生成特殊房间（BOSS 房、宝藏房等）
function generateSpecialRooms(map, floor, type) {
  const size = map.length;
  const walkable = getWalkablePositions(map);
  
  // 找最远的位置
  let farthest = null;
  let maxDist = 0;
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  
  for (const pos of walkable) {
    const dist = Math.abs(pos.x - centerX) + Math.abs(pos.y - centerY);
    if (dist > maxDist) {
      maxDist = dist;
      farthest = pos;
    }
  }
  
  if (farthest) {
    if (type === 'boss') {
      map[farthest.x][farthest.y].type = CELL_TYPE.LOOT;
      map[farthest.x][farthest.y].special = 'boss_room';
    } else if (type === 'treasure') {
      map[farthest.x][farthest.y].type = CELL_TYPE.LOOT;
      map[farthest.x][farthest.y].special = 'treasure_room';
    }
  }
  
  return map;
}

module.exports = {
  CELL_TYPE,
  ROOM_TEMPLATES,
  generateMap,
  isPathReachable,
  getWalkablePositions,
  generateSpecialRooms
};
