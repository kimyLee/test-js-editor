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

function _setLight (colors: number[]) {
  bleSetLight({ colors, bright: 1 })
}
function _setColor (color: number, num = 8) { // 用x颜色点亮num颗灯
  const arr = Array(num).fill(color).concat(Array(8 - num).fill(0))
  bleSetLight({ colors: arr, bright: 1 })
}

const map = [[2, 8], [1, 3, 8, 9], [2, 4], [3, 5, 9, 10], [4, 6], [5, 11], [8, 13], [1, 2, 7, 10], [2, 4], [4, 8, 11, 15, 16, 17], [6, 10, 12, 17], [11, 18], [7, 14], [13, 19], [8, 10, 16, 20], [10, 15, 17, 21], [10, 11, 16, 18, 22, 29], [12, 17, 23, 24], [14, 20, 25, 26], [8, 19, 15, 21, 26, 27], [16, 20, 22, 27], [17, 21, 27, 29], [18, 29], [18, 30], [19, 31], [19, 20, 27, 33], [20, 21, 22, 26, 29, 33], [29, 35], [17, 23, 22, 27, 28, 35], [24, 36], [25, 32], [31, 33], [26, 27, 32, 34], [33, 35], [28, 29, 34, 36], [30, 35]]

let targetLen = 0
let current_scanned = null
let temp = []
let scan_again_flag = 0
let link = []
let players = {} // 所有玩家游戏数据
let player1 = []
let player2 = []
let player3 = []
let player4 = []
let player5 = []
let player6 = []

// status
let choosePlayerFlag = false

function initAll () { // 游戏初始化
  current_scanned = null
  temp = []
  scan_again_flag = 0
  link = []
  player1 = []
  player2 = []
  player3 = []
  player4 = []
  player5 = []
  player6 = []
}

function initPlayer (number: number) { // 扫描开始卡牌初始化开始玩家 1-6
  _setColor(colorWhite)
  players = { // 游戏玩家数据
    51: [],
    52: [],
    53: [],
    54: [],
    55: [],
    56: [],
  }
    = [24, 12, 8, 6, 5, 4][(number - 1)]
  choosePlayerFlag = true
  // 等待选择玩家

  // for (i = 1; i_inc >= 0 ? i <= number : i >= number; i += i_inc) {
  //   players[(i - 1)] = generate_target()
  //   link = []
  // }
  // blePlayMusic('gbeg')
  // // just for debug, without logic
  // print('players', JSON.stringify(players))
  // sleepFn(0.5)
  // clearAllLight()
  // sleepFn(0.5)
  // // blue
  // bleSetLight(JSON.stringify({ colors: [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], bright: 1 }))
}

export default function spy () {
  console.log('spy game running')
  initAll()

  const spyMap = [] as any // 51 - 54
  const temp = [] as any
  let scanAgainflag = false

  const spyMapCode = {
    41: [16, 17, 18, 23, 24, 29],
    42: [7, 8, 13, 14, 15, 20],
    43: [19, 20, 25, 26, 31, 32],
    44: [2, 3, 4, 10, 11, 12],
    45: [27, 30, 33, 34, 35, 36],
  } as any

  function generateSpyCode (order: number) { // 生成间谍对应
    spyMap.push(spyMapCode[order])
    if (spyMap.length === 4) {
      setTimeout(() => {
        blePlayMusic('gbeg')
      }, 300)
    }
    console.log(spyMap.length, spyMap)
  }

  function scanMore () {
    //
  }

  window.When_JOYO_Read = function (val: number) {
    // 游戏开始选择玩家
    const value = val - 1800
    if (value >= 41 && value <= 45) {
      initPlayer(val - 39)
    }

    if (choosePlayerFlag) { //

    }

    console.log('oid', value)
    if (scanAgainflag) {
      if (value > 0 && value < 37) {
        blePlayMusic('03mi')
        temp.push(value)

        if (temp.length >= 6) { // 进行判定
          let flag = true
          for (let i = 0; i < 6; i++) {
            if (link.indexOf(temp[i]) < 0) {
              flag = false
            }
          }
          if (flag) {
            setTimeout(() => {
              blePlayMusic('gwin')
              bleSetLight({ colors: [65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280], bright: 1 })
            })
          } else {
            setTimeout(() => {
              blePlayMusic('fail')
              bleSetLight(({ colors: [16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680], bright: 1 }))
            }, 500)
          }
          scanAgainflag = false
        }
      }
    }
    if (!scanAgainflag) {
      if (value >= 41 && value <= 45) {
        generateSpyCode(value)
        blePlayMusic('mov5')
      }
      if (value === 51) {
        currentPlayer = player1
        blePlayMusic('mov5')
        link = spyMap[0]
      }
      if (value === 52) {
        currentPlayer = player2
        blePlayMusic('mov5')
        link = spyMap[1]
      }
      if (value === 53) {
        currentPlayer = player3
        blePlayMusic('mov5')
        link = spyMap[2]
      }
      if (value === 54) {
        currentPlayer = player4
        blePlayMusic('mov5')
        link = spyMap[3]
      }
      console.log(link, 'link')

      if (value > 0 && value < 37) {
        if (link.indexOf(value) >= 0) { // 如果在正确答案内
          bleSetLight({ colors: [65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280, 65280], bright: 1 })
          blePlayMusic('03mi')
          if (currentPlayer != null && !(currentPlayer.indexOf(value) >= 0)) {
            currentPlayer.push(value)
          }
          console.log('currentPlayer', JSON.stringify(currentPlayer))
          if (currentPlayer.length === 6) {
            console.log('currentPlayer', JSON.stringify(currentPlayer))
            bleSetLight({ colors: [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], bright: 1 })
            // sleepFn(1)
            setTimeout(() => {
              blePlayMusic('gret')
              bleSetLight({ colors: [0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff], bright: 1 })
            }, 500)
            scanAgainflag = true
            // todo: 需要再识别一次
          }
          currentPlayer = null
        } else {
          // 如果是别人目标，显示黄色，如果不是显示红色
          for (const item in spyMap) {
            const arr = spyMap[item]
            if (arr.indexOf(value) >= 0) { // 别人的目标
              bleSetLight({ colors: [0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00, 0xffff00], bright: 1 })
              blePlayMusic('olwh')
              return
            }
          }
          bleSetLight(({ colors: [16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680, 16711680], bright: 1 }))
          blePlayMusic('olwh')
        }
      }
    }
  }

  function setUp () {
    currentPlayer = null
    player1 = []
    player2 = []
    player3 = []
    player4 = []

    bleSetLight({ colors: [0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00], bright: 1 })
    blePlayMusic('stat')
    // generateLinkCode()
  }
  setUp()
}
