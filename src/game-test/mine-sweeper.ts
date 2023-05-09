// 实现扫雷
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'

declare global {
  interface Window {
    When_JOYO_Read_mine: any;
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
  const value = val - 500000
  console.log(val, '233')

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

let findTime = 0
let mineList = [] as any[]

function startGame () {
  mineList = []
  findTime = 0
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

  generateMine()
}

function isMineValid (i: number, j: number, list: any[]) {
  // let repeat = 0
  for (let k = 0; k < list.length; k++) {
    const item = list[k]
    // if (item[0] === i) {
    //   repeat = repeat + 1
    // }
    // if (repeat >= 2) {
    //   return false
    // }
    if ((item[0] === i) && (item[1] === j)) {
      return false
    }
  }
  return true
}
function getRandomList () { // 每行过后，剔除可随机的选项
  const x_list = {} as any
  for (let q = 0; q < mineList.length; q++) {
    const item = mineList[q]
    if (!x_list[item[0]]) {
      x_list[item[0]] = 0
    }
    if (x_list[item[0]] <= 1) {
      x_list[item[0]]++
    }
  }
  const res = []
  for (let i = 0; i < 6; i++) {
    if (!x_list[i]) {
      x_list[i] = 0
    }
    if (x_list[i] <= 1) {
      res.push(i)
    }
  }
  console.log(res)
  return res
}

function generateMine () { // 生成地雷，每行每列各两个
  for (let j = 0; j < 6; j++) { // 列
    let mine = 0
    console.log('生成第N行', j)
    console.log(mineList)
    const randomList = getRandomList()

    while (mine < 2) {
      const index = randomList[Math.floor(Math.random() * randomList.length)] // 生成炸弹位置
      if (isMineValid(index, j, mineList)) {
        mineList.push([index, j])
        mine++
      }
    }
  }
  console.log(mineList)
  return mineList
}

function isMine (val: number) {
  for (let i = 0; i < mineList.length; i++) {
    const item = mineList[i]
    if (val === (item[1] * 6 + item[0] + 101)) {
      return true
    }
  }
  return false
}

function handleInput (val: number) { // 根据结果显示灯光 0 - 3 红黄蓝绿
  blePlayMusic('mine')
  _setColor(colorWhite)
  setTimeout(() => {
    if (isMine(val)) {
      blePlayMusic('scnp')
      _setColor(colorBlue)
      findTime++
      if (findTime >= 12) {
        setTimeout(() => {
          blePlayMusic('gwin')
          playlightAnimation(colorWin1, colorWin2, colorWin1)
        })
      }
    } else {
      blePlayMusic('scnn')
      _setColor(colorRed)
    }
  }, 500)
}

export default function mineSweeper () {
  console.log('ohmind game running')

  window.When_JOYO_Read_mine = function (value: number) {
    const val = _fixCodeVal(value)
    console.log('识别到', val)
    if (val === 100) { // 开始游戏
      startGame() // 误触？
    }
    if (val >= 101 && val <= 136) { // 扫描输入
      handleInput(val)
    }
  }
}
