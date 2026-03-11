# 🔳 振动反馈说明

## 概述

牌友小程序使用微信振动 API 提供游戏反馈，无需音效文件。

## 振动模式

| 场景 | 振动类型 | 说明 |
|------|---------|------|
| 发牌 | `light` (轻触) | 轻微的触觉反馈 |
| 胜利 | `heavy` (重触) | 强烈的庆祝反馈 |
| 失败 | `medium` (中等) | 温和的鼓励反馈 |
| 按钮 | `light` (轻触) | 点击确认反馈 |
| 比牌 | `light` (轻触) | 结果揭晓反馈 |

## 技术实现

```javascript
// utils/audio.js
const vibrationPatterns = {
  deal: 'light',    // 发牌
  win: 'heavy',     // 胜利
  lose: 'medium',   // 失败
  check: 'light',   // 检查/比牌
  button: 'light'   // 按钮
}

function playAudio(type) {
  const pattern = vibrationPatterns[type]
  if (pattern) {
    wx.vibrateShort({ type: pattern })
  }
}
```

## 优点

✅ **无需音效文件** - 减小小包体积  
✅ **无网络请求** - 离线也能用  
✅ **无加载延迟** - 即时反馈  
✅ **无报错日志** - 控制台干净  
✅ **省电节能** - 比播放音效更省电  

## 兼容性

- ✅ iOS 微信
- ✅ Android 微信
- ⚠️ 部分手机可能不支持（静默失败，不影响功能）

## 用户控制

用户可以在微信中关闭振动：
- 微信 → 我 → 设置 → 通用 → 振动

关闭后小程序会自动静默处理，不影响其他功能。

---

**更新日期:** 2026-03-11  
**版本:** v1.1 - 纯振动反馈
