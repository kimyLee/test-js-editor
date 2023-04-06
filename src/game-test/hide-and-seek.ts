// 实现复杂捉迷藏
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'
import { point } from 'blockly/core/utils/svg_paths'

declare global {
  interface Window {
    When_JOYO_Read: any;
  }
}

const colorRed = 0xff0000
const colorGreen = 0x00ff00
const colorBlue = 0x0000ff
const colorWhite = 0xffffff
const colorYellow = 0xffff00

// 动画数组
const colorRed1 = [0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0xff0000, 0xff0000, 0xff0000]
const colorRed2 = [0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000]
const colorWrong = [0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0]
const colorWin1 = [0x35C759, 0xFECA06, 0xFF6A03, 0xEA2C04, 0x35C759, 0xFECA06, 0xFF6A03, 0xEA2C04, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00]
const colorWin2 = [0xEA2C04, 0xFF6A03, 0xEA2C04, 0x35C759, 0xFECA06, 0xFF6A03, 0x35C759, 0xFECA06, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00]

function _setLight (colors: number[], backColor = 0) {
  const arr = colors.concat(Array(12 - colors.length).fill(backColor))
  bleSetLight({ colors: arr, bright: 1 })
}
function _setColor (color: number, num = 12, backColor = 0) { // 用x颜色点亮num颗灯
  const arr = Array(num).fill(color).concat(Array(12 - num).fill(backColor))
  bleSetLight({ colors: arr, bright: 1 })
}

function _fixCodeVal (val: number) {
  let value = val
  console.log(val, '233')
  // 识别到颜色 红黄蓝绿
  if (value > 1800) {
    value = value - 1800
  }
  return value
}

function playlightAnimation (color1: any[], color2: any[], final: any) {
  _setLight(color1)
  const HZ = 200
  setTimeout(() => {
    _setLight(color2)
    setTimeout(() => {
      _setLight(color1)
      setTimeout(() => {
        _setLight(color2)
        setTimeout(() => {
          _setLight(final)
        }, HZ)
      }, HZ)
    }, HZ)
  }, HZ)
}

// 跑马灯然后随机停
function lightAnimation (finnal: number, current: number, cb: any) {
  if (current < finnal) {
    const time_step = 50
    const time = time_step
    setTimeout(() => {
      lightAnimation(finnal, current + 1, cb)
    }, time)

    cb(current, (current + 1) >= finnal)
  }
}

// 全局变量
let targetPos = -1
let targetDoor = -1
let unlockFlag = false
let hideFlag = false

function startGame () {
  generateDoor()
  targetPos = -1
  unlockFlag = false

  // _setColor(colorGreen) // 全绿

  const colors = [0xff9800, 0xfeca06, 0xfedd7b, 0, 0, 0, 0, 0]
  blePlayMusic('gbeg')
  lightAnimation(40, 0, (current: number, isFinnal: boolean) => {
    const index = current % 8
    const part1 = colors.slice(0, index)
    const part2 = colors.slice(index)
    const arr = part2.concat(part1)
    _setLight(arr)

    if (isFinnal) {
      setTimeout(() => {
        _setColor(colorWhite)
      }, 200)
    }
  })
}

function generateDoor () {
  targetDoor = Math.floor(Math.random() * 6) + 49
}

function hidePoint (val: number) {
  targetPos = val
  // blePlayMusic('swbm')
  setTimeout(() => {
    blePlayMusic('csm2')
    _setColor(colorGreen)
  }, 800)
}

function checkIsTarget (val: number) {
  if (val === targetPos) {
    blePlayMusic('swbm')
    setTimeout(() => {
      blePlayMusic('fhed')
      _setColor(colorGreen)
      unlockFlag = true
    }, 800)
  } else {
    blePlayMusic('swbm')
    setTimeout(() => {
      blePlayMusic('fnon')
      _setColor(colorRed)
    }, 800)
  }
}

function unlockDoor (val: number) {
  if (unlockFlag) {
    blePlayMusic('mat1')
    if (targetDoor === val) {
      setTimeout(() => {
        blePlayMusic('gwin')
        playlightAnimation(colorWin1, colorWin2, colorWin1)
      }, 500)
    } else {
      setTimeout(() => {
        blePlayMusic('gswa')
        playlightAnimation(colorRed1, colorRed2, colorRed1)
      }, 500)
      unlockFlag = false
    }
  }
}

export default function hideAndSeek () {
  console.log('hideAndSeek game running')

  window.When_JOYO_Read = function (value: number) {
    const val = _fixCodeVal(value)
    console.log('识别到', val)
    if (val === 38) { // 开始捉迷藏
      startGame() // 误触？
    }
    if (val === 55) {
      blePlayMusic('swbm')
      hideFlag = true
    }
    if (val >= 49 && val <= 54 && unlockFlag) {
      unlockDoor(val)
    }
    if (val >= 56 && val <= 68 && !unlockFlag) {
      if (hideFlag) {
        hidePoint(val)
        hideFlag = false
      } else {
        checkIsTarget(val)
      }
    }
  }
}
