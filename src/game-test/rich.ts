// 实现复杂spy game
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'

declare global {
  interface Window {
    When_JOYO_Read: any;
  }
}

// const throttle = function (func: any, delay: any) {
//   let prev = Date.now()
//   return function (this: any, ...args: any) {
//     // const context = this
//     // const args = arguments
//     const now = Date.now()
//     if (now - prev >= delay) {
//       func.apply(this, args)
//       prev = Date.now()
//     }
//   }
// }
// const delayPlayMusic = throttle(blePlayMusic, 400)

// let timer = null as any
// function playBg () {
//   timer = setInterval(() => {
//     blePlayMusic('tala')
//   }, 300)
// }
// function stopBg () {
//   clearInterval(timer)
// }

const colorRed = 0xff0000
const colorGreen = 0x00ff00
const colorBlue = 0x0000ff
const colorWhite = 0xffffff
const colorYellow = 0xffff00

let currentEvt = 0
let totalMoney = 92

// 动画数组
// const colorRed1 = [0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0xff0000, 0xff0000, 0xff0000]
const colorWhite1 = [colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, colorWhite, colorWhite, colorWhite]
// const colorRed2 = [0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000]
const colorWhite2 = [0, colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, colorWhite, colorWhite, colorWhite, colorWhite]

// const colorWin1 = [0x35C759, 0xFECA06, 0xFF6A03, 0xEA2C04, 0x35C759, 0xFECA06, 0xFF6A03, 0xEA2C04, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00]
// const colorWin2 = [0xEA2C04, 0xFF6A03, 0xEA2C04, 0x35C759, 0xFECA06, 0xFF6A03, 0x35C759, 0xFECA06, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00]

function playlightAnimation (color1: any[], color2: any[], final: any) {
  _setLight(color1)
  const HZ = 200
  // blePlayMusic('tend')
  setTimeout(() => {
    _setLight(color2)
    setTimeout(() => {
      _setLight(color1)
      // blePlayMusic('tend')
      setTimeout(() => {
        _setLight(color2)
        setTimeout(() => {
          _setLight(final)
          // blePlayMusic('tend')
          blePlayMusic('mat6')
        }, HZ)
      }, HZ)
    }, HZ)
  }, HZ)
}

function _setLight (colors: number[], backColor = 0) {
  const arr = colors.concat(Array(12 - colors.length).fill(backColor))
  bleSetLight({ colors: arr, bright: 1 })
}
function _setColor (color: number, num = 12, backColor = 0) { // 用x颜色点亮num颗灯
  const arr = Array(num).fill(color).concat(Array(12 - num).fill(backColor))
  bleSetLight({ colors: arr, bright: 1 })
}
// function breathColor (color: number) { // 用x颜色点亮num颗灯
//   const arr = Array(num).fill(color).concat(Array(12 - num).fill(backColor))
//   bleSetLight({ colors: arr, bright: 1 })
// }

function _fixCodeVal (val: number) {
  const value = val - 1800
  console.log(value, '233')
  return value
}

const temp = {
  position: 1,
  magic: 2,
  money: 0,
} as any

const map = 30
let lastPlayer = -1
const PLAYERA_ID = 61
const PLAYERB_ID = 62
const PLAYERC_ID = 63
const PLAYERD_ID = 64

let playerA = Object.assign({}, temp)
let playerB = Object.assign({}, temp)
let playerC = Object.assign({}, temp)
let playerD = Object.assign({}, temp)

let currentPlayer = {} as any
let tempWalkStep = 0
let tempWalkTotalStep = 0
let isLotteryFlag = false
const devlopStatus = false

// const tempScan = [] as any[]
// const players = {} as any // 所有玩家目标
// const playerPicked = {} as any // 所有玩家游戏已采集自己的目标
// const playerPickedAll = {} as any // 所有玩家游戏已采集所有的点
// const gamePlayerNumber = 0
// const target_len = 0

// status
// const choosePlayerFlag = false

// const new_map = Array(50).fill(null)

// JOYO大转盘, 跑马灯然后随机停
function lightAnimation (finnal: number, current: number, cb: any) {
  if (current < finnal) {
    const time_step = 50
    let time = time_step
    const remain = finnal - current
    if (remain <= 25) {
      time = time_step + (25 - remain) * 5
    }
    setTimeout(() => {
      lightAnimation(finnal, current + 1, cb)
    }, time)

    cb(current, (current + 1) >= finnal)
  }
}
function randomMoney () {
  clearAllLight()
  const colors = [0xff9800, 0xfeca06, 0xfedd7b, 0, 0, 0, 0, 0]
  const result = Math.floor(Math.random() * 8) // 0-7
  blePlayMusic('loty')
  lightAnimation(result + 60, 0, (current: number, isFinnal: boolean) => {
    const index = current % 8
    const part1 = colors.slice(0, index)
    const part2 = colors.slice(index)
    const arr = part2.concat(part1)
    _setLight(arr)

    if (isFinnal) {
      const i = arr.indexOf(0xff9800)
      const arr1 = Array(8).fill(0)
      arr1[i] = 0xff9800
      // stopBg()
      setTimeout(() => {
        blePlayMusic('ev02')
        _setLight(arr1)
      }, 200)
    }
  })
}
// 摇晃骰子, 需要玩家
function roll (playerID: number) {
  if (playerID === lastPlayer) {
    return
  }
  lastPlayer = playerID
  switch (playerID) {
    case PLAYERA_ID:
      currentPlayer = playerA
      break
    case PLAYERB_ID:
      currentPlayer = playerB
      break
    case PLAYERC_ID:
      currentPlayer = playerC
      break
    case PLAYERD_ID:
      currentPlayer = playerD
      break
  }
  clearAllLight()
  tempWalkStep = 0

  const result = Math.floor(Math.random() * 6) + 1 // 0-7
  tempWalkTotalStep = result

  currentPlayer.position = currentPlayer.position + result
  if (currentPlayer.position > 36) { // todo: 地图总长
    currentPlayer.position = currentPlayer.position - 36
  }
  console.log(currentPlayer, 'currentPlayer')
  console.log(tempWalkTotalStep, 'tempWalkTotalStep')
  // 播放2s动画
  const resultArr = Array(result).fill(0xffffff).concat(Array(12 - result).fill(0))
  blePlayMusic('roll')
  playlightAnimation(colorWhite1, colorWhite2, resultArr)
}

(window as any).roll = roll

function walk (readVal: number) {
  if (readVal === currentPlayer.position) {
    // 开始结算
    if (isEvt(readVal)) { // 遭遇事件
      _setColor(colorYellow)
      // blePlayMusic('chek') // todo
      blePlayMusic('revt') // todo
    } else if (isLottery(readVal)) {
      _setColor(colorGreen)
      blePlayMusic('csm1')
      isLotteryFlag = true
      // randomMoney()
    } else if (isMagicPoor(readVal)) {
      _setColor(colorBlue)
      blePlayMusic('csm1')
      setTimeout(() => {
        getMagic()
      }, 800)
      // blePlayMusic('pert')
    } else if (isMagicCard(readVal)) {
      _setColor(colorBlue)
      blePlayMusic('csm2')
      // blePlayMusic('gret')
    } else {
      _setColor(colorGreen)
      blePlayMusic(Math.random() > 0.5 ? 'gret' : 'pert')
    }
    // blePlayMusic('gret')
    // 播放特定语音
  } else {
    tempWalkStep++
    const music = ['mat1', 'mat2', 'mat3', 'mat4', 'mat5', 'mat5', 'mat6']
    // todo: 记录已走步数
    if (tempWalkStep <= tempWalkTotalStep) {
      _setLight([...Array(tempWalkStep).fill(colorBlue), ...Array(tempWalkTotalStep - tempWalkStep).fill(colorWhite)])
      blePlayMusic(music[tempWalkStep - 1])
    }
  }
}
(window as any).walk = walk

function isEvt (val: number) {
  return [9, 13, 22, 34].indexOf(val) >= 0
}

function isMagicPoor (val: number) {
  return val === 7 || val === 16 || val === 31
}
function isMagicCard (val: number) {
  return false
}
function isLottery (val: number) {
  return val === 4 || val === 17 || val === 35 || val === 27
}

// 获取魔水晶
function showMagicAnimation (count: number) {
  const music = ['mat1', 'mat2', 'mat3', 'mat4', 'mat5', 'mat5', 'mat5']
  if (count <= currentPlayer.magic) {
    _setColor(colorBlue, count)
    blePlayMusic(music[count - 1])
    setTimeout(() => {
      showMagicAnimation(count + 1)
    }, 350)
  }
}
function showMagicAnimation2 (count: number) {
  // const music = ['mat1', 'mat2', 'mat3', 'mat4', 'mat5', 'mat5', 'mat5']
  blePlayMusic('ev02') // 钱包
  _setColor(colorBlue, count + 1)
  setTimeout(() => {
    _setColor(colorBlue, count)
    setTimeout(() => {
      _setColor(colorBlue, count + 1)
      setTimeout(() => {
        _setColor(colorBlue, count)
        setTimeout(() => {
          _setColor(colorBlue, count + 1)
          setTimeout(() => {
            _setColor(colorBlue, count)
          }, 350)
        }, 350)
      }, 350)
    }, 350)
  }, 350)
}
(window as any).showMagicAnimation2 = showMagicAnimation2

function getMagic () {
  clearAllLight()
  // currentPlayer = playerA
  currentPlayer.magic = currentPlayer.magic + 1
  showMagicAnimation(1)
}
(window as any).getMagic = getMagic

function playMagic () {
  clearAllLight()
  if (currentPlayer.magic <= 0) {
    _setColor(colorRed)
    blePlayMusic('olwh')
  } else {
    currentPlayer.magic = currentPlayer.magic - 1
    showMagicAnimation2(currentPlayer.magic)
  }
}

// 获取魔法卡（灯效音效）
function getMagicCard () {
  clearAllLight()
  currentPlayer = playerA
  currentPlayer.magic = currentPlayer.magic + 1
  showMagicAnimation(1)
}

export default function rich () {
  console.log('spy game running')

  window.When_JOYO_Read = function (val: number) {
    // 游戏开始选择玩家
    // let value = val - 1800
    const value = _fixCodeVal(val)
    if (value === 50) {
      clearAllLight()
      // blePlayMusic('gbeg')
      blePlayMusic('rsta')
      totalMoney = 92
      playerA = Object.assign({}, temp)
      playerB = Object.assign({}, temp)
      playerC = Object.assign({}, temp)
      playerD = Object.assign({}, temp)
      currentPlayer = {} as any
      tempWalkStep = 0
      tempWalkTotalStep = 0
      isLotteryFlag = false
    } else if (value >= 61 && value <= 64) {
      // 骰子
      roll(value)
    } else if (value === 53 && isLotteryFlag) {
      randomMoney()
      isLotteryFlag = false
    } else if (value === 54) {
      playMagic()
    } else if (value === 55) {
      playMagic()
    } else if (value === 56) {
      playMagic()
    } else if (value === 51) { // 后门
      isLotteryFlag = true
      blePlayMusic('gret')
    } else if (value === 70) { // 后门: 找到宝箱
      _setColor(colorBlue)
      blePlayMusic('csm1')
    } else if (value === 71) { // 后门：触发事件
      _setColor(colorYellow)
      const arr = ['rev1', 'rev2']
      blePlayMusic('revt') // todo
      setTimeout(() => {
        blePlayMusic(arr[currentEvt]) // todo
        currentEvt = currentEvt + 1
        if (currentEvt > 1) {
          currentEvt = 0
        }
      }, 500)
    } else if (value === 72) { // 后门：孙小美
      blePlayMusic('rsxm')
    } else if (value === 73) { // 后门：红颜搏命
      blePlayMusic('rhyb')
    } else if (value === 74) { // 后门：查询余额
      showMoney()
    } else if (value === 75) { // 后门：支付10元
      totalMoney = totalMoney - 4
      if (totalMoney < 0) {
        totalMoney = 0
      }
      blePlayMusic('rpay')
      setTimeout(() => {
        showMoney()
      }, 800)
    } else if (value >= 1 && value <= 36) { // 一共36格
      walk(value)
      // 特殊触发
      // if (devlopStatus) {
      //   devlopStatus = false
      // }
    }
    // 抽奖
  }
}

function showMoney () {
  blePlayMusic('rm' + totalMoney)
  // blePlayMusic('rmon') // 当前余额
  // setTimeout(() => {
  //   blePlayMusic('rm' + totalMoney)
  // }, 1000)
}
// 使用魔法卡（扫码支付）
// 触发事件卡（各种语音）
// 踩到普通地点，买地音效、付费音效
