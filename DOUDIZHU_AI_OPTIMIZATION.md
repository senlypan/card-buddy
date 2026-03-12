# 斗地主 AI 优化方案

> 🃏 智能斗地主 AI - 三个难度等级  
> **优化时间:** 2026-03-12  
> **版本:** v1.1.0

---

## 🎯 优化目标

**当前问题:**
- ❌ AI 只会出单张
- ❌ 一出牌就很大
- ❌ 没有策略性
- ❌ 难度单一

**优化目标:**
- ✅ 实现三个难度等级（简单/普通/地狱）
- ✅ 智能出牌策略
- ✅ 记牌功能
- ✅ 牌型分析
- ✅ 玩家可选择难度

---

## 📊 难度设计

### 😊 简单难度 (Easy)

**特点:**
- 随机出牌
- 50% 概率跟牌
- 不记牌
- 适合新手练习

**AI 行为:**
```javascript
// 自由出牌：随机出小牌
playRandomSmallCard(hand)

// 跟牌：50% 概率跟牌
if (Math.random() < 0.5) {
  tryToBeat(hand, lastHand, 0.3) // 30% 概率出大牌
} else {
  pass() // 不要
}
```

**胜率:** 约 30%

---

### 🎯 普通难度 (Normal)

**特点:**
- 基本出牌策略
- 会记牌
- 70% 概率跟牌
- 优先用小牌管

**AI 行为:**
```javascript
// 自由出牌：出最小的牌型
playSmallestHand(hand)

// 跟牌：如果能管上就管，优先用小牌
tryToBeat(hand, lastHand, 0.7)
```

**记牌功能:**
- 记住已出的大牌（2、王）
- 记住炸弹
- 估算剩余牌力

**胜率:** 约 50%

---

### 🔥 地狱难度 (Hell)

**特点:**
- 完美出牌策略
- 精确记牌
- 90% 概率跟牌
- 会算牌和推理

**AI 行为:**
```javascript
// 自由出牌：根据牌局选择最优牌型
playOptimalHand(hand)

// 跟牌：精确计算是否值得管
tryToBeat(hand, lastHand, 0.9)
```

**高级功能:**
- 完整记牌（所有牌）
- 牌型分析
- 剩余牌数计算
- 炸弹保留策略
- 控牌技巧

**胜率:** 约 75%

---

## 🧠 AI 策略详解

### 1. 牌型识别

```javascript
const HandTypes = {
  'single': '单张',
  'pair': '对子',
  'triple': '三张',
  'tripleWithOne': '三带一',
  'tripleWithPair': '三带二',
  'sequence': '顺子',
  'pairSequence': '连对',
  'airplane': '飞机',
  'airplaneWithOne': '飞机带单',
  'airplaneWithPair': '飞机带对',
  'fourWithTwo': '四带二',
  'fourWithTwoPairs': '四带两对',
  'bomb': '炸弹',
  'rocket': '王炸'
}
```

### 2. 牌力评估

```javascript
// 牌型权重
const HandWeights = {
  'single': 1,
  'pair': 2,
  'triple': 3,
  'tripleWithOne': 4,
  'tripleWithPair': 5,
  'sequence': 6,
  'pairSequence': 7,
  'airplane': 8,
  'airplaneWithOne': 9,
  'airplaneWithPair': 10,
  'fourWithTwo': 11,
  'fourWithTwoPairs': 12,
  'bomb': 20,
  'rocket': 30
}
```

### 3. 出牌策略

#### 自由出牌（无人管）

**简单难度:**
```javascript
// 从前 5 张小牌中随机选一张
const randomIndex = Math.floor(Math.random() * Math.min(5, hand.length))
return [hand[randomIndex]]
```

**普通难度:**
```javascript
// 分析手牌，找出最小的牌型
const analysis = analyzeHand(hand)

// 优先出单张
if (analysis.singles.length > 0) {
  return [analysis.singles[0]]
}

// 其次出对子
if (analysis.pairs.length > 0) {
  return analysis.pairs[0]
}
```

**地狱难度:**
```javascript
// 完整分析手牌
const analysis = analyzeHand(hand)

// 根据剩余牌数选择策略
if (hand.length <= 5) {
  // 剩牌少，尽快出完
  return playAllRemaining(hand)
}

if (hasBomb(hand)) {
  // 有炸弹，保留到最后
  return playWithoutBomb(hand)
}

// 正常出最小牌型
return playSmallestHand(hand)
```

#### 跟牌（有人管）

**简单难度:**
```javascript
// 50% 概率跟牌
if (Math.random() < 0.5) {
  return findBeatingCard(hand, lastHand)
} else {
  return null // 不要
}
```

**普通难度:**
```javascript
// 如果能管上就管，优先用小牌
const beatingCards = findBeatingCards(hand, lastHand)
if (beatingCards.length > 0) {
  return selectSmallestBeatingCards(beatingCards)
}
return null
```

**地狱难度:**
```javascript
// 精确计算是否值得管
const beatingCards = findBeatingCards(hand, lastHand)

if (beatingCards.length === 0) {
  return null // 要不起
}

// 计算管牌的成本
const cost = calculateCost(beatingCards)
const benefit = calculateBenefit(beatingCards, lastHand)

// 如果成本太高，选择保留
if (cost > benefit * 1.5) {
  return null // 保留实力
}

return selectOptimalBeatingCards(beatingCards)
```

---

## 📋 实现文件

### 1. AI 核心模块
**文件:** `utils/doudizhu-ai.js`

```javascript
const { DouDiZhuAI, AIDifficulty } = require('./doudizhu-ai.js')

// 初始化 AI
const ai = new DouDiZhuAI(AIDifficulty.NORMAL)

// 选择出牌
const cardsToPlay = ai.selectCards(hand, lastHand, isFree)
```

### 2. 游戏主逻辑
**文件:** `pages/doudizhu/doudizhu.js`

**新增功能:**
```javascript
Page({
  data: {
    aiDifficulty: 'normal', // 'easy', 'normal', 'hell'
    showDifficultySelect: false
  },
  
  // 显示难度选择
  showDifficultySelect() {
    this.setData({ showDifficultySelect: true })
  },
  
  // 选择难度
  selectDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty
    this.setData({
      aiDifficulty: difficulty,
      showDifficultySelect: false
    })
    this.initAI(difficulty)
  },
  
  // 初始化 AI
  initAI(difficulty) {
    this.ai = new DouDiZhuAI(difficulty)
  },
  
  // AI 出牌
  landlordAI() {
    const isFree = !this.data.lastHand || this.data.lastHandPlayer === 'landlord'
    const cardsToPlay = this.ai.selectCards(
      this.data.landlordCards,
      this.data.lastHand,
      isFree
    )
    // ... 执行出牌
  }
})
```

---

## 🎨 UI 设计

### 难度选择界面

```
┌─────────────────────────────────┐
│     选择 AI 难度                  │
├─────────────────────────────────┤
│                                 │
│  😊 简单                        │
│  适合新手练习                   │
│  [选择]                         │
│                                 │
│  🎯 普通                        │
│  正常游戏体验                   │
│  [选择]                         │
│                                 │
│  🔥 地狱                        │
│  挑战最强 AI                    │
│  [选择]                         │
│                                 │
└─────────────────────────────────┘
```

### 游戏提示

**简单难度:**
- "对手思考中... 😊"
- "对手：要不起~ 😅"

**普通难度:**
- "对手出牌了！🎯"
- "对手：不要 🎯"

**地狱难度:**
- "对手使出了妙手！🔥"
- "对手：暂时保留 🔥"

---

## 📊 测试数据

### 预期胜率

| 难度 | AI 胜率 | 玩家胜率 | 平均时长 |
|------|--------|---------|---------|
| 简单 | 30% | 70% | 5 分钟 |
| 普通 | 50% | 50% | 7 分钟 |
| 地狱 | 75% | 25% | 10 分钟 |

### 性能指标

- AI 决策时间：< 1 秒
- 内存占用：< 1MB
- 代码行数：~600 行

---

## ✅ 实现清单

### 已完成
- [x] AI 核心模块 (`doudizhu-ai.js`)
- [x] 三个难度策略
- [x] 牌型识别
- [x] 记牌功能
- [x] 难度选择 UI
- [x] 游戏主逻辑集成

### 待完成
- [ ] 前端 UI 优化
- [ ] 难度选择弹窗
- [ ] AI 思考动画
- [ ] 难度说明文档
- [ ] 测试和调优

---

## 🚀 使用说明

### 1. 开始游戏

```
1. 打开斗地主游戏
2. 点击"选择难度"
3. 选择简单/普通/地狱
4. 开始游戏
```

### 2. 难度推荐

**新手玩家:**
- 推荐：简单难度
- 原因：熟悉规则，建立信心

**普通玩家:**
- 推荐：普通难度
- 原因：平衡体验，有挑战性

**高手玩家:**
- 推荐：地狱难度
- 原因：极限挑战，提升技术

---

## 🎯 后续优化

### 短期优化
- [ ] 增加 AI 思考时间
- [ ] 优化 AI 提示语
- [ ] 增加难度说明

### 中期优化
- [ ] AI 学习功能
- [ ] 自适应难度
- [ ] 战绩统计

### 长期优化
- [ ] 多人在线对战
- [ ] AI 训练系统
- [ ] 比赛模式

---

**设计目标:** 让每个玩家都能找到适合自己的难度，享受斗地主的乐趣！🃏
