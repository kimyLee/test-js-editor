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
const hideFlag = false
let failFlag = false
let resultPath = [] as any[]
let mapBoomList = [] as any[]

function startGame () {
  failFlag = false
  generateLine() // 生成一条线
  generateBoom()

  blePlayMusic('gbeg')

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

function generateLine () { // 生成一条可行路径，在路径之外随机生成6个炸弹
  // 从 0, 0 到4, 4
  const res = []
  const final = [0, 0]
  res.push([0, 0])
  while (final[0] < 4 || final[1] < 4) {
    const randomX = Math.random() < 0.5
    if (randomX) {
      if (final[0] < 4) {
        final[0]++
        res.push([...final])
      }
    } else {
      if (final[1] < 4) {
        final[1]++
        res.push([...final])
      }
    }
  }
  console.log('路线', JSON.stringify(res))
  resultPath = [...res]
  return res
}

function generateBoom () { // 生成炸弹
  const boomList = [] as any[]
  while (boomList.length < 8) {
    const x = Math.floor(Math.random() * 5)
    const y = Math.floor(Math.random() * 5)
    let sameFlag = false
    for (let i = 0; i < resultPath.length; i++) {
      const item = resultPath[i]
      if (item[0] === x && item[1] === y) {
        sameFlag = true
        break
      }
    }
    for (let i = 0; i < boomList.length; i++) {
      const item = boomList[i]
      if (item[0] === x && item[1] === y) {
        sameFlag = true
        break
      }
    }
    if (!sameFlag) { // 相同的话退出
      boomList.push([x, y])
    }
  }
  mapBoomList = [...boomList]
  console.log(JSON.stringify(boomList))
}

export default function maze () {
  console.log('maze game running')

  window.When_JOYO_Read = function (value: number) {
    const val = _fixCodeVal(value)
    console.log('识别到', val)
    if (val === 90) { // 开始迷宫
      startGame() // 误触？
    }
    if (val >= 65 && val <= 89) {
      if (val === 65) {
        failFlag = false
      }
      if (failFlag) return
      // 踩到雷
      let isBoom = false
      for (let i = 0; i < mapBoomList.length; i++) {
        const item = mapBoomList[i]
        console.log(item[0], item[1], item[0] + item[1] * 5 + 65, val)
        if ((item[0] + item[1] * 5 + 65) === val) {
          isBoom = true
          break
        }
      }
      if (isBoom) {
        failFlag = true
        blePlayMusic('gswa')
        playlightAnimation(colorRed1, colorRed2, colorRed1)
      } else {
        blePlayMusic('mat1')
        _setColor(0)
        setTimeout(() => {
          _setColor(colorGreen)
        }, 300)
      }
      if (val === 89) { // todo: 采集过程点
        setTimeout(() => {
          blePlayMusic('gwin')
          playlightAnimation(colorWin1, colorWin2, colorWin1)
        }, 500)
      }
    }
  }
}
