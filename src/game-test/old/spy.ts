// 实现复杂spy game
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'

declare global {
  interface Window {
    When_JOYO_Read_spy: any;
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

const colorWin1 = [0x35C759, 0xFECA06, 0xFF6A03, 0xEA2C04, 0x35C759, 0xFECA06, 0xFF6A03, 0xEA2C04, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00]
const colorWin2 = [0xEA2C04, 0xFF6A03, 0xEA2C04, 0x35C759, 0xFECA06, 0xFF6A03, 0x35C759, 0xFECA06, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00]

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

function _setLight (colors: number[], backColor = 0) {
  const arr = colors.concat(Array(12 - colors.length).fill(backColor))
  bleSetLight({ colors: arr, bright: 1 })
}
function _setColor (color: number, num = 12, backColor = 0) { // 用x颜色点亮num颗灯
  const arr = Array(num).fill(color).concat(Array(12 - num).fill(backColor))
  bleSetLight({ colors: arr, bright: 1 })
}
function _fixCodeVal (val: number) {
  const value = val - 1800
  if (value >= 0 && value <= 35) {
    if (value <= 10) {
      return value + 1
    }
    if (value === 35) {
      return 12
    }
    return value + 2
  }
  console.log(value, '233')
  return value
}

const map = [[2, 8], [1, 3, 8, 9], [2, 4], [3, 5, 9, 10], [4, 6], [5, 11], [8, 13], [1, 2, 7, 10], [2, 4], [4, 8, 11, 15, 16, 17], [6, 10, 12, 17], [11, 18], [7, 14], [13, 19], [8, 10, 16, 20], [10, 15, 17, 21], [10, 11, 16, 18, 22, 29], [12, 17, 23, 24], [14, 20, 25, 26], [8, 19, 15, 21, 26, 27], [16, 20, 22, 27], [17, 21, 27, 29], [18, 29], [18, 30], [19, 31], [19, 20, 27, 33], [20, 21, 22, 26, 29, 33], [29, 35], [17, 23, 22, 27, 28, 35], [24, 36], [25, 32], [31, 33], [26, 27, 32, 34], [33, 35], [28, 29, 34, 36], [30, 35]]

let tempScan = [] as any[]
let players = {} as any // 所有玩家目标
let playerPicked = {} as any // 所有玩家游戏已采集自己的目标
let playerPickedAll = {} as any // 所有玩家游戏已采集所有的点
let gamePlayerNumber = 0
let target_len = 0

// status
let choosePlayerFlag = false

function initPlayer (number: number) { // 扫描开始卡牌初始化开始玩家 1-6
  console.log(number, 'initPlayer')
  _setColor(colorWhite, number)
  blePlayMusic('gbeg')

  // gamePlayerId = []
  gamePlayerNumber = number
  target_len = [24, 12, 8, 6, 5, 4][(gamePlayerNumber - 1)]

  players = {} as any // 游戏玩家数据 51: [], 52: [] ···56:
  playerPicked = {} as any // 游戏玩家数据 51: [], 52: [] ···56:
  playerPickedAll = {} as any // 游戏玩家数据 51: [], 52: [] ···56:
  choosePlayerFlag = true
}

function selectPlayer (val: number) { // 选取玩家
  players[val] = []
  playerPicked[val] = []
  playerPickedAll[val] = []
  const len = Object.keys(players).length
  _setLight([...Array(len).fill(colorBlue), ...Array(gamePlayerNumber - len).fill(colorWhite)])
  blePlayMusic('mov5')
  if (len >= gamePlayerNumber) { // 人数达标
    setTimeout(() => {
      blePlayMusic('fbdy')
      choosePlayerFlag = false
      for (const id in players) { // 生成每个玩家的target
        generate_target(id)
      }
    }, 500)
  }
}

function generate_target (playerID: any) {
  // target_len = [24, 12, 8, 6, 5, 4][(gamePlayerNumber - 1)]
  const bornMap = {
    51: [1, 2, 3, 7, 8, 15], //
    52: [4, 5, 6, 9, 10, 16],
    53: [11, 12, 17, 18, 23, 24],
    54: [13, 14, 19, 20, 21, 25],
    55: [26, 27, 31, 32, 33, 34],
    56: [22, 28, 29, 30, 35, 36],
  } as any
  const link = []
  link.push(bornMap[playerID][Math.floor(Math.random() * 6)]) // 初始点
  while (link.length < target_len) {
    if (random_next_node(link)) {
      generate_target(playerID) // 如果生成有误，重新生成
      return
      // break
    }
  }
  players[playerID] = link
  console.log(players, '答案')

  // return link
}

function random_next_node (link: any) {
  const current_node = link[link.length - 1]
  const nodeList = map[current_node - 1]
  const randomAbleList = []

  for (let i = nodeList.length; i--;) {
    const considerNode = nodeList[i] // 可选的点
    let ableFlag = true
    if (link.length >= 2) { // 如果长度大于2，需要判断是否环形
      for (let j = 0; j < link.length - 1; j++) {
        const existNode = link[j]
        if (isClosed(existNode, considerNode)) {
          ableFlag = false
        }
      }
      if (ableFlag) {
        randomAbleList.push(considerNode)
      }
    } else { // 如果长度只有1，都纳入选择
      randomAbleList.push(considerNode)
    }
  }
  if (randomAbleList.length) {
    const tempNode = randomAbleList[Math.floor(Math.random() * randomAbleList.length)]
    link.push(tempNode)
  } else {
    return true
  }
  return false
}

function isClosed (a: number, b: number) {
  if (a === b) return true
  return map[a - 1].indexOf(b) >= 0
}

// 扫描第二次同一个点时候，展示周围的点的状态
function showAround (node: number, pointColor: number, currentID: any) { // 展示周围点的数据
  const nodeList = map[node - 1]
  const arr = []
  for (let i = 0; i < nodeList.length; i++) { // 遍历邻居
    const node = nodeList[i]
    if (players[currentID].indexOf(node) >= 0) { // 该点在本人的目标上
      arr.push(colorGreen)
    } else {
      let emptyFlag = true
      for (const item in players) {
        const targets = players[item]
        if (targets.indexOf(node) >= 0) { // 别人的目标
          arr.push(colorYellow)
          emptyFlag = false
          break
        }
      }
      if (emptyFlag) {
        arr.push(colorRed)
      }
    }
  }
  bleSetLight({ colors: arr.concat(Array(8 - arr.length).fill(0), Array(4).fill(pointColor)), bright: 1 })
}

function reGenerateTarget (playerID: number) { // 重新生成目标角色的答案
  let link = players[playerID]
  link = Math.random() > 0.5 ? [...link] : [...link.reverse()]
  console.log(link, 'link')
  link.splice(0, 1)
  console.log(link, 'newLink')

  const nodeList = map[link[link.length - 1] - 1]
  const randomAbleList = []
  for (let i = nodeList.length; i--;) {
    const considerNode = nodeList[i] // 可选的点
    let ableFlag = true
    for (let j = 0; j < link.length - 1; j++) {
      const existNode = link[j]
      if (isClosed(existNode, considerNode)) {
        ableFlag = false
      }
    }
    if (ableFlag) {
      randomAbleList.push(considerNode)
    }
  }
  if (randomAbleList.length) {
    const tempNode = randomAbleList[Math.floor(Math.random() * randomAbleList.length)]
    link.push(tempNode)
    players[playerID] = link
    console.log('生成新的target: ', link)
    reGeneratePlayerPicked(playerID) // 修正playerPicked
  } else {
    reGenerateTarget(playerID)
  }
}

function reGeneratePlayerPicked (playerID: number) {
  const arr = playerPicked[playerID]
  const newArr = []
  for (let i = arr.length; i--;) {
    if (players[playerID].indexOf(arr[i]) >= 0) {
      newArr.push(arr[i])
    }
  }
  playerPicked[playerID] = [...newArr]
  console.log('生成新的Picked: ', playerPicked[playerID])
}

export default function spy () {
  console.log('spy game running')
  // initPlayer(4)

  let scanAgainFlag = false

  let currentID: any
  let currentlink = [] as any[]
  let currentPicked = [] as any[]
  let currentPickedAll = [] as any[] // 收集所有扫描过的点

  window.When_JOYO_Read_spy = function (val: number) {
    // 游戏开始选择玩家
    // let value = val - 1800
    const value = _fixCodeVal(val)
    if (value >= 41 && value <= 45) { // 开始卡片
      initPlayer(value - 39)
    }

    if (choosePlayerFlag && value >= 51 && value <= 56) { // 录入角色, 51 - 56
      selectPlayer(value)
    }

    if (scanAgainFlag) { // 最后确认答案，需要按顺序识别
      if (value >= 1 && value <= 36) {
        let answer = [...currentlink]
        if (value === currentlink[target_len - 1] && tempScan.length === 0) {
          answer = answer.reverse()
        }
        tempScan.push(value)
        blePlayMusic('mov5')
        _setLight([...Array(tempScan.length).fill(colorGreen), ...Array(target_len - tempScan.length).fill(colorWhite)])
        const len = tempScan.length - 1
        console.log(tempScan[len], answer[len])
        if (tempScan[len] !== answer[len]) { // 答案错误立刻退出
          setTimeout(() => {
            blePlayMusic('olwh')
            _setColor(colorRed)
            scanAgainFlag = false
            reGenerateTarget(currentID)
            // 失败后，目标首尾会变化。
          }, 800)
        } else {
          if (tempScan.length === target_len) {
            setTimeout(() => {
              blePlayMusic('gwin')
              // _setColor(colorGreen)
              playlightAnimation(colorWin1, colorWin2, colorWin1)
              scanAgainFlag = false
            }, 800)
          }
        }
      }
    }
    if (!scanAgainFlag && !choosePlayerFlag) {
      if (value >= 51 && value <= 56) { // 查看自己当前收集到多少线索
        currentID = value
        currentlink = players[currentID]
        currentPicked = playerPicked[currentID]
        currentPickedAll = playerPickedAll[currentID]

        _setLight([...Array(currentPicked.length).fill(colorGreen), ...Array(target_len - currentPicked.length).fill(colorWhite)])
        blePlayMusic('mov5')

        console.log(currentlink, 'currentlink', ' 当前玩家' + currentID)
        console.log('currentPicked', currentPicked)
      }

      if (value >= 1 && value <= 36 && currentID) { // 扫描地图点
        let pointColor: number
        if (currentlink.indexOf(value) >= 0) { // 如果在正确答案内
          _setColor(colorGreen)
          pointColor = colorGreen
          blePlayMusic('03mi')
          if (currentPicked && !(currentPicked.indexOf(value) >= 0)) {
            currentPicked.push(value)
            console.log('新增currentPicked', currentPicked)
          }
          // 找到所有的点
          if (currentPicked.length === target_len) {
            setTimeout(() => {
              blePlayMusic('gret')
              _setColor(colorWhite, target_len)
              scanAgainFlag = true
              tempScan = []
              console.log('找到所有点', currentPicked)
            }, 500)
            return // 无需再显示周围的点
          }
        } else {
          // 如果是别人目标，显示黄色，如果不是显示红色
          let emptyFlag = true
          for (const item in players) {
            const arr = players[item]
            if (arr.indexOf(value) >= 0) { // 别人的目标
              _setColor(colorYellow)
              pointColor = colorYellow
              blePlayMusic('olwh')
              emptyFlag = false
            }
          }
          if (emptyFlag) {
            // 红色
            // _setColor(colorRed)
            playlightAnimation(colorRed1, colorRed2, Array(12).fill(colorRed))
            pointColor = colorRed
            blePlayMusic('olwh')
          }
        }
        // 判断是否第二次识别该点，是的话，显示周围点的信息
        setTimeout(() => {
          if (currentPickedAll.indexOf(value) >= 0) {
            showAround(value, pointColor, currentID)
          } else {
            currentPickedAll.push(value)
            console.log('新增currentPickedAll', currentPickedAll)
          }
        }, 500)
      }
    }
    console.log('识别到的贴纸值', value)
  }
}
