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

const currentEvt = 0
const totalMoney = 92

// 动画数组
// const colorRed1 = [0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0xff0000, 0xff0000, 0xff0000]
const colorWhite1 = [colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, colorWhite, colorWhite, colorWhite]
// const colorRed2 = [0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000]
const colorWhite2 = [0, colorWhite, 0, colorWhite, 0, colorWhite, 0, colorWhite, colorWhite, colorWhite, colorWhite, colorWhite]

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

function _fixCodeVal (val: number) {
  const value = val - 500000
  console.log(value, '233')
  return value
}
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
  if (running) return
  running = true
  clearAllLight()
  const colors = [0xff9800, 0xfeca06, 0xfedd7b, 0, 0, 0, 0, 0]
  const resColor = [colorRed, colorYellow, colorBlue, colorGreen, colorWhite]
  const result = Math.floor(Math.random() * 5) // 红黄蓝绿白
  blePlayMusic('loty')
  lightAnimation(60, 0, (current: number, isFinnal: boolean) => {
    const index = current % 8
    const part1 = colors.slice(0, index)
    const part2 = colors.slice(index)
    const arr = part2.concat(part1)
    _setLight(arr)

    if (isFinnal) {
      const i = arr.indexOf(0xff9800)
      const arr1 = Array(8).fill(0)
      arr1[i] = 0xff9800
      setTimeout(() => {
        blePlayMusic('ev02')
        _setColor(resColor[result])
        running = false
      }, 200)
    }
  })
}

function roll () {
  const resColor = [colorRed, colorYellow, colorBlue, colorGreen, colorWhite]
  const resultArr = resColor[(Math.floor(Math.random() * 5))]
  blePlayMusic('roll') //
  playlightAnimation(colorWhite1, colorWhite2, Array(12).fill(resultArr))
  setTimeout(() => {
    blePlayMusic('mat1') // mat1
  }, 1000)
}

let lastVal = -1
let running = false

function startGame () {
  blePlayMusic('gbeg')
  lastVal = -1
  _setColor(colorWhite)
}

export default function bee () {
  console.log('bee game running')

  window.When_JOYO_Read = function (val: number) {
    const value = _fixCodeVal(val)
    if (value === 700) { // 开始游戏
      startGame()
    }
    if (value === 705) {
      // 骰子
      // randomMoney()
      roll()
    }
  }
}
