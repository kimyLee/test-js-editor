// 实现复杂spy game
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'

declare global {
  interface Window {
    When_JOYO_Read_unlocko: any;
  }
}

const colorRed = 0xff0000
const colorGreen = 0x00ff00
const colorBlue = 0x0000ff
const colorWhite = 0xffffff
const colorYellow = 0xffff00

// 动画数组

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
  console.log('_fixCodeVal', val)
  let value = val
  if (val > 500000) {
    value = val - 500000
  }

  if (value === 230) {
    value = 0
  }
  if (value === 220) {
    value = 1
  }
  if (value === 240) {
    value = 2
  }
  if (value === 210) {
    value = 3
  }
  console.log(value, '2331')
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

// 全局变量
let answer = [] as number[]
let currentInput = [] as number[]
let scanTime = 0
let firstScanInput = [] as number[]
let firstScanRes = [] as number[]

function startGame () {
  scanTime = 0
  firstScanInput = []
  firstScanRes = []
  currentInput = []
  answer = []
  blePlayMusic('cbeg')

  // _setColor(colorGreen) // 全绿

  const colors = [0xff9800, 0xfeca06, 0xfedd7b, 0, 0, 0, 0, 0]
  _setColor(colorGreen)
  // lightAnimation(40, 0, (current: number, isFinnal: boolean) => {
  //   const index = current % 8
  //   const part1 = colors.slice(0, index)
  //   const part2 = colors.slice(index)
  //   const arr = part2.concat(part1)
  //   _setLight(arr)

  //   if (isFinnal) {
  //     setTimeout(() => {
  //       _setColor(colorGreen)
  //     }, 200)
  //   }
  // })

  generateCode()
}

function generateCode () { // 红黄蓝绿4个颜色里生成2个，可重复；阻止1-2次尝试直接成功
  const ans = []
  ans.push(Math.floor(Math.random() * 4))
  ans.push(Math.floor(Math.random() * 4))
  answer = ans
  const colorMap = [colorRed, colorYellow, colorBlue, colorGreen] // 颜色
  console.log(answer[0], answer[1])
  // return ans
}

function checkBasicResult (input: number[], ans: number[]) { // 判断结果，有5种情况 全灭，一白，一黄，两白，两黄，[colorWhite, colorYellow]
  const res = []
  const temp_input = [...input]
  const index0 = temp_input.indexOf(ans[0]) //

  if (index0 >= 0) {
    res.push(index0 === 0 ? colorYellow : colorWhite)
    temp_input[index0] = -1
  }
  const index1 = temp_input.indexOf(ans[1]) // 44  41
  if (index1 >= 0) {
    res.push(index1 === 1 ? colorYellow : colorWhite)
  }
  console.log('basic', ...res)
  return res
}

function checkResult () { // 判断结果，增加业务逻辑
  const res = checkBasicResult(currentInput, answer)
  if (scanTime === 0 && res.length === 2) { // 首次扫描
    console.log('首次接近全对')
    checkAndReset()
    return
  }
  if (scanTime === 1 && res.join() === [colorYellow, colorYellow].join()) { // 第2次全对
    console.log('第二次全对')
    checkAndReset()
    return
  }
  if (scanTime === 0) {
    firstScanInput = [...currentInput] // 存储首次扫描输入
    firstScanRes = [...res] // 存储首次扫描输入
  }
  scanTime++
  if (res.join() === [colorYellow, colorYellow].join()) { // 成功
    blePlayMusic('gwin')
    playlightAnimation(colorWin1, colorWin2, colorWin1)
  } else {
    showResult(res)
  }
  // showResult(res)
  // showResult(res) // 显示灯光
}

// 1. 阻止第一次识别出两个颜色，若是，重新生成并给出结果
// 2. 若第二次识别正确，重新生成符合首次条件的答案，并告知结果
function checkAndReset () {
  if (firstScanInput.length === 0) {
    generateCode()
    checkResult()
  } else {
    generateCode()
    while (checkBasicResult(firstScanInput, answer).join() !== firstScanRes.join()) {
      generateCode()
    }
    checkResult()
  }
}

function showResult (res: number[]) { // 根据结果显示灯光
  _setLight(res)
  blePlayMusic('chek')
  currentInput = []
}

function handleInput (val: number) { // 根据结果显示灯光 0 - 3 红黄蓝绿
  const music = ['mat1', 'mat2', 'mat3', 'mat4']
  blePlayMusic(music[val])
  currentInput.push(val)

  const colorMap = [colorRed, colorYellow, colorBlue, colorGreen] // 颜色

  _setLight(currentInput.map((ele) => {
    return colorMap[ele]
  }))
}

export default function unlocko () {
  console.log('unlocko game running')

  window.When_JOYO_Read_unlocko = function (value: number) {
    const val = _fixCodeVal(value)
    console.log('识别到', val)
    if (val === 200) {
      startGame() // 误触？
    }
    if (val >= 0 && val <= 3 && currentInput.length < 2) { // 扫描输入
      handleInput(val)
    }
    if (val === 205 && currentInput.length === 2) { // 检查答案
      checkResult()
    }
  }
}
