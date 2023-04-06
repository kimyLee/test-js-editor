// 实现复杂spy game
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'

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
  if (value >= 341 && value <= 344) {
    value = 0
  }
  if (value >= 361 && value <= 366) {
    value = 1
  }
  if (value >= 381 && value <= 384) {
    value = 2
  }
  if (value >= 351 && value <= 354) {
    value = 3
  }
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
let currentInput = [] as number[]

let timer = null as any
let comboFlag = 0
let findTime = 0

function startGame () {
  currentInput = []
  comboFlag = 0
  findTime = 0
  timer = null
  blePlayMusic('gbeg')

  // _setColor(colorGreen) // 全绿

  const colors = [0xff9800, 0xfeca06, 0xfedd7b, 0, 0, 0, 0, 0]
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

function checkResult () { // 判断结果，增加业务逻辑
  if (currentInput[0] === currentInput[1]) { // 成功
    const music = ['good', 'gret', 'amaz', 'pert']
    blePlayMusic(music[comboFlag])
    comboFlag++
    comboFlag = Math.min(comboFlag, 3)
    findTime++
    if (findTime === 8) {
      setTimeout(() => {
        blePlayMusic('gwin')
        playlightAnimation(colorWin1, colorWin2, colorWin1)
      }, 500)
    }
    setTimeout(() => {
      _setColor(0)
    }, 200)
  } else {
    comboFlag = 0
    blePlayMusic('nwit')
    setTimeout(() => {
      _setLight(colorWrong)
    }, 200)
  }

  currentInput = []
}

function handleInput (val: number) { // 根据结果显示灯光 0 - 3 红黄蓝绿
  const music = ['mat1', 'mat2', 'mat3', 'mat4']
  blePlayMusic(music[val])
  currentInput.push(val)

  const colorMap = [colorRed, colorYellow, colorBlue, colorGreen] // 颜色

  _setColor(colorMap[val])
  clearTimeout(timer)
  timer = setTimeout(() => {
    // 判断 结果
    if (currentInput.length === 2) {
      setTimeout(() => {
        checkResult()
      }, 300)
    } else {
      setTimeout(() => {
        _setColor(0)
      }, 500)
    }
  }, 500)
}

export default function ohmind () {
  console.log('ohmind game running')

  window.When_JOYO_Read = function (value: number) {
    const val = _fixCodeVal(value)
    console.log('识别到', val)
    if (val === 36) { // 开始游戏
      startGame() // 误触？
    }
    if (val >= 0 && val <= 3 && currentInput.length < 2) { // 扫描输入
      handleInput(val)
    }
  }
}
