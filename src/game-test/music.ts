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
  return val
}
// JOYO大转盘, 跑马灯然后随机停
// function lightAnimation (finnal: number, current: number, cb: any) {
//   if (current < finnal) {
//     const time_step = 50
//     let time = time_step
//     const remain = finnal - current
//     if (remain <= 25) {
//       time = time_step + (25 - remain) * 5
//     }
//     setTimeout(() => {
//       lightAnimation(finnal, current + 1, cb)
//     }, time)

//     cb(current, (current + 1) >= finnal)
//   }
// }

let lastVal = -1
let currentType = 'piano'
let currentNote = 0
let currentSong = [] as any[]
let playing = false

function startGame () {
  blePlayMusic('gbeg')
  playing = false
  lastVal = -1
  currentType = 'piano'
  _setColor(colorWhite)
}

export default function music () {
  console.log('music game running')
  const musicMap = {
    piano: [
      'p0C4', 'p0D4', 'p0E4', 'p0F4', 'p0G4', 'p0A4', 'p0B4', 'pCs4', 'pDs4', 'pEs4', 'pFs4', 'pAs4',
    ],
    guitar: [
      't0C4', 't0D4', 't0E4', 't0F4', 't0G4', 't0A4', 't0B4', 'tCs4', 'tDs4', 'tEs4', 'tFs4', 'tAs4',
    ],
    muqin: [
      'm0C4', 'm0D4', 'm0E4', 'm0F4', 'm0G4', 'm0A4', 'm0B4', 'mCs4', 'mDs4', 'mEs4', 'mFs4', 'mAs4',
    ],
    guzheng: [
      'g0C4', 'g0D4', 'g0E4', 'g0F4', 'g0G4', 'g0A4', 'g0B4', 'gCs4', 'gDs4', 'gEs4', 'gFs4', 'gAs4',
    ],
    sakesi: [
      's0C4', 's0D4', 's0E4', 's0F4', 's0G4', 's0A4', 's0B4', 'pCs4', 'pDs4', 'pEs4', 'pFs4', 'pAs4',
    ],
  } as any

  function randomMusic (song: any[]) { // 随机跟弹
    const colorMap = [
      0xff00e5, 0xff9900, 0x0085ff, 0x00ff0a, 0x8f00ff, 0xffe600, 0xff0000, 0x00ffe0,
    ]
    currentNote = 0
    currentSong = song
    playing = true
    _setColor(colorMap[currentSong[currentNote] - 1])
    blePlayMusic('mat1')
    // const play = async (color: string) => {
    //   return new Promise((resolve) => {
    //     setTimeout(() => {

    //     })
    //   })
    // }
    // for ()
  }
  function playMusic (key: number) { // 1-7
    const colorMap = [
      0xff00e5, 0xff9900, 0x0085ff, 0x00ff0a, 0x8f00ff, 0xffe600, 0xff0000, 0x00ffe0,
    ]
    console.log(currentSong, currentType, musicMap[currentType], key)
    console.log(currentSong.length, musicMap[currentType][key - 1])
    if (currentNote < currentSong.length) {
      if (key === currentSong[currentNote]) {
        currentNote++
      }
      blePlayMusic(musicMap[currentType][key - 1])
      if (currentNote < currentSong.length) {
        _setColor(colorMap[currentSong[currentNote] - 1])
      } else {
        setTimeout(() => {
          // playing = false
          blePlayMusic('gwin')
          playlightAnimation(colorWin1, colorWin2, colorWin1)
          setTimeout(() => {
            purePlaySong()
          }, 1000)
        }, 500)
      }
    }
  }

  async function purePlaySong () {
    const colorMap = [
      0xff00e5, 0xff9900, 0x0085ff, 0x00ff0a, 0x8f00ff, 0xffe600, 0xff0000, 0x00ffe0,
    ]
    function play (key: number) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          blePlayMusic(musicMap[currentType][key - 1])
          _setColor(colorMap[key - 1])
          resolve(0)
        }, 800)
      })
    }
    for (let i = 0; i < currentSong.length; i++) {
      await play(currentSong[i])
    }
    playing = false
  }

  const song1 = [
    1, 1, 5, 5, 6, 6, 5, 4, 4, 3, 3, 2, 2, 1,
  ]
  const song2 = [
    3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 3, 2, 2, 3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 2, 1, 1,
  ]

  window.When_JOYO_Read = function (val: number) {
    const value = _fixCodeVal(val)
    if (value === 76527740) { // 开始音乐游戏
      startGame()
    }
    // 跟弹
    if (value === 76527739) {
      randomMusic(song1)
    }
    if (value === 76527736) {
      randomMusic(song2)
    }
    // 切换乐器
    if (value >= 76527728 && value <= 76527732) {
      switch (value) {
        case 76527732:
          currentType = 'piano'
          blePlayMusic(musicMap.piano[0])
          break
        case 76527728:
          currentType = 'guitar'
          blePlayMusic(musicMap.guitar[0])
          break
        case 76527730:
          currentType = 'muqin'
          blePlayMusic(musicMap.muqin[0])
          break
        case 76527729:
          currentType = 'guzheng'
          blePlayMusic(musicMap.guzheng[0])
          break
        case 76527731:
          currentType = 'sakesi'
          blePlayMusic(musicMap.sakesi[0])
          break
      }
    }
    // 76527767 - 76527771 // 5个黑键

    if (value >= 76527748 && value <= 76527755) { // 5音符
      if (playing) {
        playMusic(value - 76527748 + 1)
      } else {
        blePlayMusic(musicMap[currentType][value - 76527748])
      }
    }
    if (value >= 76527767 && value <= 76527771) { // 7个音符
      blePlayMusic(musicMap[currentType][value - 76527767 + 7])
    }
  }
}
