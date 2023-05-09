// 实现复杂spy game
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'

declare global {
  interface Window {
    When_JOYO_Read_cat: any;
  }
}

const colorRed = 0xff0000
const colorGreen = 0x00ff00
const colorBlue = 0x0000ff
const colorWhite = 0xffffff
const colorYellow = 0xffff00
const colorPurple = 0xd30dea

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
const pool = [
  [colorBlue, colorRed, colorYellow],
  [colorRed, colorGreen, colorPurple],
  [colorBlue, colorRed, colorGreen],
  [colorRed, colorBlue, colorGreen],

  [colorRed, colorBlue, colorYellow],
  [colorRed, colorBlue, colorPurple],
  [colorRed, colorGreen, colorBlue],
  [colorBlue, colorRed, colorPurple],

  [colorRed, colorPurple, colorYellow],
  [colorRed, colorPurple, colorGreen],
  [colorRed, colorYellow, colorPurple],
  [colorYellow, colorBlue, colorGreen],

  [colorGreen, colorYellow, colorBlue],
  [colorGreen, colorRed, colorPurple],
  [colorRed, colorPurple, colorBlue],
  [colorBlue, colorBlue, colorBlue],
]
let activePool = [] as number[][]
let count = 5
let gameover = false
let currentLight = [] as number[]
let costTime = 0
let timeStart = 0
let timeEnd = 0

function startGame () {
  blePlayMusic('gbeg')
  count = 5
  timeStart = 0
  timeEnd = 0
  costTime = 0
  gameover = false

  activePool = [...pool]
  currentLight = []

  _setColor(colorGreen)
  setTimeout(() => {
    countDown()
  }, 1000)
}

function startRecord () {
  timeStart = Date.now()
}
function endRecord () {
  timeEnd = Date.now()
  costTime = timeEnd - timeStart + costTime
  console.log('持续', timeEnd - timeStart)
}

function showLight (num: number) {
  blePlayMusic('tend')
  _setColor(colorWhite, num)
}
function showColor () {
  const index = Math.floor(Math.random() * activePool.length)
  currentLight = [...activePool[index]]
  _setLight(currentLight)
  activePool.splice(index, 1)
  startRecord()
}

function countDown () {
  if (count <= 0) return
  count--
  const step = 350
  showLight(5)
  setTimeout(() => {
    showLight(4)
    setTimeout(() => {
      showLight(3)
      setTimeout(() => {
        showLight(2)
        setTimeout(() => {
          showLight(1)
          setTimeout(() => {
            showColor()
          }, step)
        }, step)
      }, step)
    }, step)
  }, step)
}

function handleCheck (val: number) {
  if (JSON.stringify(pool[val]) === JSON.stringify(currentLight)) {
    blePlayMusic('good')
    _setColor(colorGreen)
    endRecord()
    setTimeout(() => {
      if (count <= 0) {
        blePlayMusic('gwin')
        if (costTime < 20000) {
          _setColor(colorBlue)
        } else if (costTime < 30000) {
          _setLight(Array(6).fill(colorYellow))
        } else {
          _setLight(Array(4).fill(colorWhite))
        }
        gameover = true
        console.log(costTime, 'costTime')
      } else {
        countDown()
      }
    }, 500)
  } else {
    blePlayMusic('nwit')
    // _setColor(colorRed)
    // setTimeout(() => {
    //   _setLight(cu)
    // })
  }
}

export default function fastCat () {
  console.log('fastCat game running')

  window.When_JOYO_Read_cat = function (value: number) {
    const val = _fixCodeVal(value)
    // console.log('识别到', val)
    if (val === 65) { // 开始游戏
      startGame() // 误触？
    }
    if (val >= 113 && val <= 128 && !gameover) { // 扫描输入
      handleCheck(val - 113)
    }
  }
}
