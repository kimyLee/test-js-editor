// 实现复杂spy game
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'

declare global {
  interface Window {
    When_JOYO_Read_music: any;
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
  return val - 500000
  //  return val
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
let replayTimer = null as any // 回放的计时器

function clearReplay () {
  playing = false
  clearTimeout(replayTimer)
  clearAllLight()
}

function startGame () {
  clearReplay()
  blePlayMusic('cbeg')
  playing = false
  lastVal = -1
  currentType = 'piano'
  _setColor(colorWhite)
}

export default function music () {
  console.log('music game running')
  const musicMap = {
    piano: [
      'p0C4', 'p0D4', 'p0E4', 'p0F4', 'p0G4', 'p0A4', 'p0B4', 'p0C5', 'pCs4', 'pDs4', 'pFs4', 'pGs4', 'pAs4',
    ],
    // piano: [
    //   'p0C4', 'p0D4', 'p0E4', 'p0F4', 'p0G4', 'p0A4', 'p0B4', 'pCs4', 'pDs4', 'pEs4', 'pFs4', 'pAs4',
    // ],
    guitar: [
      't0C4', 't0D4', 't0E4', 't0F4', 't0G4', 't0A4', 't0B4', 't0C5', 'tCs4', 'tDs4', 'tFs4', 'tGs4', 'tAs4',
    ],
    muqin: [
      'v0C4', 'v0D4', 'v0E4', 'v0F4', 'v0G4', 'v0A4', 'v0B4', 'v0C5', 'vCs4', 'vDs4', 'vFs4', 'vGs4', 'vAs4',
    ],
    guzheng: [
      'g0C4', 'g0D4', 'g0E4', 'g0F4', 'g0G4', 'g0A4', 'g0B4', 'g0C5', 'gCs4', 'gDs4', 'gFs4', 'gGs4', 'gAs4',
    ],
    sakesi: [
      'd0C4', 'd0D4', 'd0E4', 'd0F4', 'd0G4', 'd0A4', 'd0B4', 'd0C5', 'dCs4', 'dDs4', 'dFs4', 'dGs4', 'dAs4',
    ],
  } as any

  function randomMusic (song: any[]) { // 随机跟弹
    const colorMap = [
      // 0xff00e5, 0xff9900, 0x0085ff, 0x00ff0a, 0x8f00ff, 0xffe600, 0xff0000, 0x00ffe0,
      0xff0000, 0xfaad14, 0xffff00, 0x00ff00, 0x0000ff, 0xd30dea, 0xeb2f96, 0xffffff,
    ]
    currentNote = 0
    currentSong = song
    purePlaySong()
    // playing = true
    // _setColor(colorMap[currentSong[currentNote] - 1])
    // blePlayMusic('mat1')

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
      // 0xff00e5, 0xff9900, 0x0085ff, 0x00ff0a, 0x8f00ff, 0xffe600, 0xff0000, 0x00ffe0,
      0xff0000, 0xfaad14, 0xffff00, 0x00ff00, 0x0000ff, 0xd30dea, 0xeb2f96, 0xffffff,
    ]
    if (currentNote < currentSong.length) {
      if (key === currentSong[currentNote]) {
        currentNote++
        if (currentSong[currentNote] === 0) {
          currentNote++
        }
      }
      blePlayMusic(musicMap[currentType][key - 1])

      if (currentNote < currentSong.length) {
        clearAllLight()
        setTimeout(() => {
          _setColor(colorMap[currentSong[currentNote] - 1])
        }, 100)
      } else {
        setTimeout(() => {
          // playing = false
          blePlayMusic('gwin')
          playlightAnimation(colorWin1, colorWin2, colorWin1)
          setTimeout(() => {
            playing = false
            purePlaySong()
          }, 300)
        }, 500)
      }
    }
  }

  async function purePlaySong () {
    const colorMap = [
      // 0xff00e5, 0xff9900, 0x0085ff, 0x00ff0a, 0x8f00ff, 0xffe600, 0xff0000, 0x00ffe0,
      0xff0000, 0xfaad14, 0xffff00, 0x00ff00, 0x0000ff, 0xd30dea, 0xeb2f96, 0xffffff,

    ]
    const play = (key: number) => {
      return new Promise((resolve, reject) => {
        replayTimer = setTimeout(() => {
          if (key !== 0) {
            if (musicMap[currentType][key - 1]) {
              console.log('play')
              blePlayMusic(musicMap[currentType][key - 1])
            // _setColor(colorMap[key - 1])
            }
          }
          resolve(0)
        }, 250)
      })
    }
    for (let i = 0; i < currentSong.length; i++) {
      await play(currentSong[i])
    }
    // playing = false
    clearTimeout(replayTimer)
    clearAllLight()
  }

  const song1 = [
    1, 1, 5, 5, 6, 6, 5, 0, 4, 4, 3, 3, 2, 2, 1,
  ]
  // 茉莉花
  //   3 3568865（快速连续） 565
  // 3 3568865（快速连续） 565
  // 5 5 5 35 6 665 3 235 321 121
  const song3 = [
    3, 0, 3, 5, 6, 8, 8, 6, 5, 0, 5, 6, 5, 0, 0,
    3, 0, 3, 5, 6, 8, 8, 6, 5, 0, 5, 6, 5, 0, 0,
    5, 0, 5, 0, 5, 0, 3, 5, 6, 0, 6, 6, 5, 0, 0, 3, 0, 2, 3, 5, 0, 3, 2, 1, 0, 1, 2, 1,
  ]
  // const song2 = [ // 上学歌
  //   1, 2, 3, 1, 5, 0, 6, 6, 8, 6, 5, 0, 6, 6, 8, 0, 5, 6, 3, 0, 6, 5, 3, 5, 3, 1, 2, 3, 1,
  // ]
  // const song2 = [ // 粉刷讲
  //   5, 3, 5, 3, 5, 3, 1, 0, 2, 4, 3, 2, 5, 0, 5, 3, 5, 3, 5, 3, 1, 0, 2, 4, 3, 2, 1,
  // ]
  // const song2 = [ // 洋娃娃和小熊跳舞 节拍 250ms
  //   1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 5, 0, 5, 4, 3, 0, 4, 0, 4, 0, 4, 3, 2, 0, 1, 0, 3, 0, 5, 0, 0,
  //   1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 5, 0, 5, 4, 3, 0, 4, 0, 4, 0, 4, 3, 2, 0, 1, 0, 3, 0, 1,
  // ]
  //   玛丽有只小羊羔
  // 3212333 222 355
  // 3212333122321
  // 12345 318 64553 12345321 2 3 1 1
  const song2 = [
    1, 2, 3, 4, 5, 0, 3, 1, 8, 0, 6, 4, 5, 5, 3, 0, 1, 2, 3, 4, 5, 3, 2, 1, 0, 2, 0, 3, 0, 2, 5, 0, 0,
    1, 2, 3, 4, 5, 0, 3, 1, 8, 0, 6, 4, 5, 5, 3, 0, 1, 2, 3, 4, 5, 3, 2, 1, 0, 2, 0, 3, 0, 1, 0, 1, 0,
  ]

  // const song3 = [
  //   2, 2, 3, 2, 5, 'c', 0, 2, 2, 3, 2, 6, 5,
  // ]

  const colorMap = [
    0xff0000, 0xfaad14, 0xffff00, 0x00ff00, 0x0000ff, 0xd30dea, 0xeb2f96, 0xffffff,
  ]

  window.When_JOYO_Read_music = function (val: number) {
    const value = _fixCodeVal(val)
    if (value === 400) { // 开始音乐游戏
      startGame()
    }
    // 跟弹
    if (value === 999) {
      blePlayMusic('yx11')
    }
    if (value === 998) {
      blePlayMusic('xx11')
    }
    if (value === 421) {
      clearReplay()
      randomMusic(song1)
    }
    if (value === 422) {
      clearReplay()
      randomMusic(song2)
    }
    if (value === 423) {
      clearReplay()
      randomMusic(song3)
    }
    // if (value === 411) {
    //   clearReplay()
    //   randomMusic(song1)
    // }
    // 切换乐器
    if (value >= 411 && value <= 415) {
      clearReplay()
      switch (value) {
        case 411:
          currentType = 'piano'
          blePlayMusic(musicMap.piano[0])
          break
        case 412:
          currentType = 'guitar'
          blePlayMusic(musicMap.guitar[0])
          break
        case 413:
          currentType = 'sakesi'
          blePlayMusic(musicMap.sakesi[0])
          break
        case 414:
          currentType = 'muqin'
          blePlayMusic(musicMap.muqin[0])
          break
        case 415:
          currentType = 'guzheng'
          blePlayMusic(musicMap.guzheng[0])
          break
      }
    }
    // 76527767 - 76527771 // 5个黑键

    if (value >= 431 && value <= 438) { // 5音符
      if (playing) {
        playMusic(value - 431 + 1)
      } else {
        clearReplay()
        _setColor(colorMap[value - 431])
        setTimeout(() => {
          blePlayMusic(musicMap[currentType][value - 431])
        })
      }
    }
    if (value >= 441 && value <= 445) { // 黑键没有
      clearReplay()
      blePlayMusic(musicMap[currentType][value - 441 + 8])
    }
  }
}
