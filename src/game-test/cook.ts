// 实现复杂捉迷藏
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'
import { point } from 'blockly/core/utils/svg_paths'

declare global {
  interface Window {
    When_JOYO_Read_cook: any;
  }
}

const colorRed = 0xff0000
const colorGreen = 0x00ff00
const colorBlue = 0x0000ff
const colorPurple = 0x8F00ff
const colorWhite = 0xffffff
const colorYellow = 0xffff00

// 动画数组
const colorWhite1 = [colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, colorWhite, colorWhite, colorWhite]
const colorWhite2 = [0, colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, colorWhite, colorWhite, colorWhite, colorWhite]
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
  // let value = val
  // // 识别到颜色 红黄蓝绿
  // if (value > 1800) {
  //   value = value - 1800
  // }
  return val - 500000
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
let level = 1
let score = 0
let showFlag = false

let targetColor = [] as any[]
let userPick = [] as any[]

function startGame () {
  targetColor = []
  userPick = []
  score = 0
  level = 1
  blePlayMusic('cbeg')
  _setColor(colorWhite)
}

function generateMenu () { // 生成菜等颜色
  const colors = [colorYellow, colorGreen, colorRed, colorPurple]
  // const levelNum = [3, 4, 5, 5, 5]
  const levelNum = [3, 4, 5]
  const res = []

  for (let i = 0; i < levelNum[level - 1]; i++) {
    res.push(colors[Math.floor(Math.random() * 4)])
  }
  targetColor = [...res]
  return res
}

async function showMenu () {
  if (showFlag) return
  showFlag = true
  const list = generateMenu()
  const music = ['men1', 'men2', 'men3', 'men4', 'men5']
  function play (index: number) {
    return new Promise((resolve, reject) => {
      blePlayMusic(music[index])
      _setLight(list.slice(0, index + 1))
      setTimeout(() => {
        resolve(0)
      }, 500)
    })
  }
  for (let i = 0; i < list.length; i++) {
    await play(i)
  }
  setTimeout(() => {
    blePlayMusic('menf')
    _setColor(0)
    showFlag = false
  }, 500)
}

function pickColor (val: number) {
  const music = ['ckr1', 'ckg1', 'cky1', 'ckp1']
  const colors = [colorRed, colorGreen, colorYellow, colorPurple]
  if (userPick.length < targetColor.length) {
    userPick.push(colors[val - 511])
    blePlayMusic(music[val - 511])
    _setLight(userPick)
  }
}

function checkColor () {
  if (userPick.length === targetColor.length) {
    const str1 = JSON.stringify(userPick.sort())
    const str2 = JSON.stringify(targetColor.sort())
    const music = ['c001', 'c003', 'c005', 'c005']
    const index = Math.min(level, 3)

    blePlayMusic('fire')
    if (str1 === str2) {
      // blePlayMusic(music[index - 1])
      // _setColor(colorGreen)
      playlightAnimation(colorWhite1, colorWhite2, Array(12).fill(colorGreen))
      setTimeout(() => {
        blePlayMusic(music[index - 1])
      }, 1000)
      score++
    } else {
      playlightAnimation(colorWhite1, colorWhite2, Array(12).fill(colorRed))
      setTimeout(() => {
        blePlayMusic('cneg')
      }, 1000)
      // _setColor(colorRed)
      // blePlayMusic('gswa')
    }
    if (level < 3) {
      level++
    } else {
      setTimeout(() => {
        blePlayMusic('gwin')
        playlightAnimation(colorWin1, colorWin2, colorWin1)
        setTimeout(() => {
          _setColor(colorGreen, score)
        }, 1000)
        _setColor(colorWhite, score)
      }, 1500)
    }
    userPick = []
  }
}

export default function cook () {
  console.log('cook game running')

  window.When_JOYO_Read_cook = function (value: number) {
    const val = _fixCodeVal(value)
    console.log('识别到', val)
    if (val === 500) { // 开始迷宫
      startGame() // 误触？
    }
    if (val >= 511 && val <= 514) { // 捡菜
      pickColor(val)
    }
    if (val === 520) { // 煮菜
      checkColor()
    }
    if (val === 505) { // 煮菜
      showMenu()
    }
  }
}
