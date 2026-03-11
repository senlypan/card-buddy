/**
 * 振动反馈工具
 * 使用微信振动 API 提供游戏反馈
 * 
 * 振动模式：
 * - 轻触 (light) - 发牌、按钮
 * - 中等 (medium) - 失败
 * - 重触 (heavy) - 胜利
 */

// 振动反馈映射
const vibrationPatterns = {
  deal: 'light',    // 发牌 - 轻触
  win: 'heavy',     // 胜利 - 重触
  lose: 'medium',   // 失败 - 中等
  check: 'light',   // 检查/比牌 - 轻触
  button: 'light',  // 按钮 - 轻触
  bgm: null         // 背景音乐（无振动）
}

/**
 * 初始化振动反馈
 * 无需加载任何文件
 */
function initAudio() {
  // 无需初始化，直接使用振动 API
  // console.log('✅ 振动反馈已就绪')
}

/**
 * 播放振动反馈
 * @param {string} type - 反馈类型：deal/win/lose/check/button/bgm
 */
function playAudio(type) {
  const pattern = vibrationPatterns[type]
  
  if (pattern) {
    wx.vibrateShort({ 
      type: pattern,
      success: () => {
        // 成功振动，无需日志
      },
      fail: () => {
        // 振动失败（可能用户关闭了振动），静默处理
      }
    })
  }
  // bgm 类型不处理
}

/**
 * 获取振动模式
 * @param {string} type - 反馈类型
 * @returns {string} 振动模式
 */
function getVibrationPattern(type) {
  return vibrationPatterns[type] || 'light'
}

module.exports = {
  initAudio,
  playAudio,
  getVibrationPattern
}
