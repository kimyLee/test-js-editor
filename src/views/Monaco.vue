
<template>
  <div class="code-view">
    <div class="header">
      <div>
        <span class="title"
              style="font-size: 20px;margin-left: 20px"
              @click="navigatorBack">
          首页
        </span>
        <!-- 上传文件 -->
        <label class="title"
               style="font-size: 20px;"
               for="fileInput">
          导入
          <input id="fileInput"
                 type="file"
                 accept=".js"
                 hidden="" />
        </label>

        <span class="title"
              style="font-size: 20px"
              @click="exportCode">
          导出
        </span>
      </div>
      <div class="btn-box">
        <a-button ghost
                  @click="connect">
          {{ connectStatus ? '断开连接' : '连接' }}
        </a-button>

        <a-button ghost
                  @click="saveCode">
          保存
        </a-button>

        <a-button ghost
                  type="primary"
                  @click="toggleLoop">
          {{ !loopStatus ? '开启Loop' : '停止Loop' }}
        </a-button>
        <a-button ghost
                  type="primary"
                  @click="runCode">
          {{ !runStatus ? '运行' : '停止' }}
        </a-button>
      </div>
    </div>
    <div class="code-box">
      <div id="container" />
    </div>
    <!-- 文本上传区 -->
  </div>
</template>

<script lang="ts">
import * as monaco from 'monaco-editor'
import { useStore } from 'vuex'

import router from '@/router'
import {
  defineComponent,
  getCurrentInstance,
  reactive,
  onMounted,
  toRefs,
  onUnmounted,
  nextTick,
  markRaw,
  watch,
  computed,
} from 'vue'
import { blePlayMusic, bleSetLight, bleSetSingleLight, clearAllLight } from '@/api/joyo-ble/index'
import { bleSetLightAnimation, clearAnimation } from '@/api/joyo-ble/light-animation'
import { connectJoyo, disconnectJoyo, bleState } from '@/api/joyo-ble/web-ble-server'
import { projectPrefix } from '@/utils/config'
import preSet from '@/lib/blockly/blocks/preBlock'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import PreSetCodeString from '@/utils/js-editor-methods.jo'

// 引入解释器
// import '@/lib/acorn.js' // todo ts
// import '@/lib/interpreter.js' // todo ts
// import '@/lib/acorn_interpreter' // todo ts

const Interpreter = window.Interpreter

declare global {
    interface Window {
      Babel: any;
      oidChange: any;
      When_JOYO_Read: any;
      lastOID: any;

      workspace: any;
      blePlayMusic: any;
      bleSetLight: any;
      sleepFn: any;
      setUp: any;
      Interpreter: any;
    }
}

export default defineComponent({
  name: 'BleUsage',
  components: {
  },
  setup () {
    // @ts-ignore
    const { proxy } = getCurrentInstance()
    let myInterpreter: any = markRaw({})
    const preserveVar = ['window', 'self', 'print', 'getDateNow', 'sleepFn', 'blePlayMusic', 'bleSetLight', 'clearAllLight', 'bleSetLightAnimation', 'value', 'When_JOYO_Read', 'setUp']
    let codeEditor = null as unknown as (monaco.editor.IStandaloneCodeEditor)
    const state = reactive({
      enableAlways: true,
      workspace: null,
      connectStatus: false,
      recoverFlag: false,
      runStatus: false,
      loopStatus: false,
      loopTimer: null as any,
      currentState: 'local',
      visible: false,
      gameVisible: false,
      // varInfo: [] as string[],
      varInfo: {} as Record<string, any>,
      varInfoOrigin: {} as Record<string, any>,
      debugInfo: '',
      sandBoxStepCount: 0,
      sandBoxMaxStep: 8000,
      sandBoxMaxSetupTime: 5000,
      sandBoxMaxSetupBegin: 0,
    })
    let timer = null as any
    const workspace = null as any

    const route = useRoute()
    const store = useStore()

    watch(() => bleState.connectStatus, (val) => {
      state.connectStatus = val
      if (!val) {
        debugLog('断开连接！', 'system')
      } else {
        debugLog('Joyo已连接', 'system')
      }
    })

    const navigatorBack = () => {
      location.href = ''
    }

    const connect = () => {
      // heartBeat()
      if (state.connectStatus) {
        disconnectJoyo()
      } else {
        connectJoyo()
      }
    }
    const clearCanvas = () => {
      //
    }
    const getCode = () => {
      return codeEditor?.getValue()
    }

    const saveCode = (withoutMessage?: boolean) => {
      // 保存代码
      format()
      const code = getCode()
      const uuid = (route.query?.uuid as string) || ''
      if (uuid) {
        store.dispatch('updateProject', { uuid, content: code })
      } else {
        localStorage.setItem('js-code', code)
      }
      !withoutMessage && message.success('保存成功')
    }

    const loadCode = (str?: string) => {
      const code = str || localStorage.getItem('js-code') || ''
      if (codeEditor) {
        codeEditor.setValue(code)
      }
    }

    const exportCode = () => {
      const code = getCode()
      download('game.js', code)
    }

    function download (filename: string, text: string) {
      var element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
      element.setAttribute('download', filename)

      element.style.display = 'none'
      document.body.appendChild(element)

      element.click()

      document.body.removeChild(element)
    }

    function debugLog (str: string, type = 'info') {
      state.debugInfo = `[${type}]: ` + state.debugInfo + '\n' + str
    }

    const handleOIDVal = (num: number) => { // 预先处理下OID码, 将8010 ···值映射到 1···
      return num
    }

    // 暂停运行代码
    const stopRun = () => {
      state.sandBoxStepCount = 0
      state.sandBoxMaxSetupBegin = 0
      clearAnimation()
      clearAllLight()
      myInterpreter = null
      state.runStatus = false
    }

    // 初始化沙盒的全局对象
    function initFunc (interpreter: any, globalObject: any) {
      const sleepFn = (delay: number) => {
        var start = new Date().getTime()
        while (new Date().getTime() < start + delay * 1000);
      }
      const bleSetLightFn = (str: string) => {
        return bleSetLight(JSON.parse(str))
      }

      const _setColor = (color: number | string, num = 12, backColor = 0) => {
        const arr = Array(num).fill(color).concat(Array(12 - num).fill(backColor))
        return bleSetLight(({ colors: arr, bright: 1 }))
      }

      // const _setColor = (color: number | string, num = 12, backColor = 0) => {
      //   const arr = Array(num).fill(color).concat(Array(12 - num).fill(backColor))
      //   return bleSetLight(({ colors: arr, bright: 1 }))
      // }

      // 执行内置灯光动画
      const bleSetLightAnimationFn = (type: string, time: number, color: number) => {
        bleSetLightAnimation(type, time, color)
      }

      // 清除所有灯光事件
      const clearAllLightFn = () => {
        clearAnimation()
        return clearAllLight()
      }

      var wrapper = function print () {
        debugLog(arguments[0], 'log')
        return console.log(...arguments)
      }
      var wrapperDate = function getDateNow () {
        return Date.now()
      }
      interpreter.setProperty(globalObject, '_print',
        interpreter.createNativeFunction(wrapper))

      interpreter.setProperty(globalObject, '_getDateNow',
        interpreter.createNativeFunction(wrapperDate))

      interpreter.setProperty(globalObject, '_sleepFn',
        interpreter.createNativeFunction(sleepFn))

      interpreter.setProperty(globalObject, '_playMusic',
        interpreter.createNativeFunction(blePlayMusic))

      interpreter.setProperty(globalObject, 'bleSetLight',
        interpreter.createNativeFunction(bleSetLightFn))

      interpreter.setProperty(globalObject, '_setColor',
        interpreter.createNativeFunction(_setColor))

      interpreter.setProperty(globalObject, '_clearAllLight',
        interpreter.createNativeFunction(clearAllLightFn))

      // interpreter.setProperty(globalObject, 'bleSetLightAnimation',
      //   interpreter.createNativeFunction(bleSetLightAnimationFn))
    }

    function runButton () {
      if (myInterpreter?.run()) {
        setTimeout(runButton, 100)
      }
    }

    function getVariables (allkeys: string[], obj: any) { // 获取沙盒中的变量
      return allkeys.filter((item: string) => {
        return preserveVar.indexOf(item) === -1 && (typeof obj[item] !== 'object' || (obj[item] && obj[item].class === 'Array'))
      })
    }

    function sleep (ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    function toggleLoop () {
      if (!state.loopStatus) {
        state.loopStatus = true
        clearInterval(state.loopTimer)
        state.loopTimer = setInterval(() => {
          if (myInterpreter && myInterpreter?.appendCode) {
            myInterpreter.appendCode('_loop()')
            // nextStep()
            myInterpreter.run()
          }
        }, 100)
      } else {
        state.loopStatus = false
        clearInterval(state.loopTimer)
      }
    }

    function handleInterpreterOIDEvt (val: number) {
      state.sandBoxStepCount = 0
      if (myInterpreter && myInterpreter?.appendCode) {
        myInterpreter.appendCode(`When_JOYO_Read(${val})`)
        // nextStep()
        myInterpreter.run()
        // 获取参数状态
        // const obj = myInterpreter.globalObject.properties
        // const vars = getVariables(Object.keys(obj), obj)
        // for (let i = 0; i < vars.length; i++) {
        //   const e = vars[i]
        //   // state.varInfoOrigin = obj[e]
        //   if (typeof obj[e] === 'object') {
        //     state.varInfo[e] = (obj[e]?.properties)
        //   } else {
        //     state.varInfo[e] = obj[e]
        //   }
        // }
      }
    }

    function nextStep () {
      try {
        if (myInterpreter?.step()) {
          state.sandBoxStepCount++
          if (state.sandBoxStepCount < state.sandBoxMaxStep) {
            window.setTimeout(nextStep, 0)
          } else {
            stopRun()
            debugLog('未终结的循环，超过最大可执行数', 'error')
          }
        }
      } catch (err: any) {
        debugLog(err.toString())
        console.log(err)
      }
    }

    function heartBeat () {
      clearInterval(timer)
      timer = setInterval(() => { // 定时防止休眠
        bleSetSingleLight(11, 0x000000)
      }, 20000)
    }

    function clearHeartBeat () {
      clearInterval(timer)
    }

    function handleCode (code: string) {
      // 转成bable
      const result = window.Babel.transform(PreSetCodeString + code, { presets: ['es2015'] }).code
      console.log(result)
      return result
    }

    const runCode = async () => {
      if (state.runStatus) {
        stopRun()
        return
      }
      saveCode(true)
      state.varInfo = {}
      window.lastOID = -1
      state.debugInfo = ''

      if (!bleState.connectStatus) {
        debugLog('JOYO未连接', 'system')
      }
      if (codeEditor) {
        // const code = Babel.transform(getCode(), { presets: ['es2015'] }).code
        const code = handleCode(getCode())
        try {
          // 新建一个解释器
          myInterpreter = new Interpreter(code, initFunc)
          // nextStep()
          myInterpreter.run()
          state.runStatus = true
        } catch (err: any) {
          debugLog(err.toString())
          console.log(err)
        }
      }
    }

    function initFileEvt () {
      const fileInput = document.getElementById('fileInput') as HTMLInputElement
      if (fileInput) {
        fileInput.addEventListener('change', function selectedFileChanged () {
          if (this?.files?.length === 0) {
            console.log('请选择文件！')
            return
          }

          const reader = new FileReader()
          reader.onload = function fileReadCompleted () {
            try {
              loadCode(reader.result as string)
            } catch (err) {
              console.log(err)
            }
          }
          this?.files && reader.readAsText(this?.files[0])
        })
      }
    }

    function getContentByUUID (uuid = '') { // 获取程序内容
      const content = localStorage.getItem(`${projectPrefix}-${uuid}`) || preSet.runSample
      try {
        loadCode(content)
      } catch (error) {
        console.log(error)
      }
    }

    function format () {
      (codeEditor as any).getAction(['editor.action.formatDocument'])._run()
    }

    function copyLine () {
      const model = codeEditor.getModel()
      if (model) {
        const lineNumber = codeEditor.getPosition()?.lineNumber as number
        const lineText = model.getLineContent(lineNumber || 0)
        console.log(lineText)
        model.pushEditOperations(
          [],
          [
            {
              range: new monaco.Range(lineNumber + 1, 1, lineNumber + 1, 1),
              text: lineText + '\n',
            },
          ],
          null as any,
        )
      }
    }

    // 路由守卫
    onBeforeRouteLeave(() => {
      const uuid = route.query?.uuid as string
      try {
        const code = getCode()
        if (uuid) {
          const content = localStorage.getItem(`${projectPrefix}-${uuid}`)
          if (content !== code) {
            if (window.confirm('当前程序未保存，确认离开？')) {
              return true
            }
            return false
          }
        }
      } catch (err) {
        console.log(err)
      }
      return true
    })

    onUnmounted(() => {
      //
    })

    onMounted(() => {
      const box = document.getElementById('container')
      if (box) {
        // monaco.languages.typescript.javascriptDefaults.addExtraLib(
        //   '/index.d.ts',
        // )
        monaco.languages.registerCompletionItemProvider('javascript', {
          provideCompletionItems (model, position) {
            return {
              suggestions: [
                {
                  label: '_print', // 显示的提示内容
                  kind: monaco.languages.CompletionItemKind.Function, // 用来显示提示内容后的不同的图标
                  insertText: '_print()', // 选择后粘贴到编辑器中的文字
                  detail: '打印信息', // 提示内容后的说明
                },
                {
                  label: '_getDateNow', // 显示的提示内容
                  kind: monaco.languages.CompletionItemKind.Function, // 用来显示提示内容后的不同的图标
                  insertText: '_getDateNow()', // 选择后粘贴到编辑器中的文字
                  detail: '获取当前日期', // 提示内容后的说明
                },
                {
                  label: '_sleepFn', // 显示的提示内容
                  kind: monaco.languages.CompletionItemKind.Function, // 用来显示提示内容后的不同的图标
                  insertText: '_sleepFn(1)', // 选择后粘贴到编辑器中的文字
                  detail: '等待1秒', // 提示内容后的说明
                },
                {
                  label: '_playMusic', // 显示的提示内容
                  kind: monaco.languages.CompletionItemKind.Function, // 用来显示提示内容后的不同的图标
                  insertText: '_playMusic(Music.WIN)', // 选择后粘贴到编辑器中的文字
                  detail: '播放音效', // 提示内容后的说明
                },
                {
                  label: '_setColor', // 显示的提示内容
                  kind: monaco.languages.CompletionItemKind.Function, // 用来显示提示内容后的不同的图标
                  insertText: '_setColor(Color.WHITE)', // 选择后粘贴到编辑器中的文字
                  detail: '用单一颜色设置灯光', // 提示内容后的说明
                },
                {
                  label: '_setLight', // 显示的提示内容
                  kind: monaco.languages.CompletionItemKind.Function, // 用来显示提示内容后的不同的图标
                  insertText: '_setLight([Color.WHITE])', // 选择后粘贴到编辑器中的文字
                  detail: '用一个数组设置灯光，不满8个的会不亮灯', // 提示内容后的说明
                },
                {
                  label: '_clearAllLight', // 显示的提示内容
                  kind: monaco.languages.CompletionItemKind.Function, // 用来显示提示内容后的不同的图标
                  insertText: '_clearAllLight()', // 清除所有灯光
                  detail: ' 清除所有灯光', // 提示内容后的说明
                },

              ],
            } as any
          },
          // triggerCharacters: ['_'], // 触发提示的字符，可以写多个
        })
        codeEditor = markRaw(monaco.editor.create(document.getElementById('container') as HTMLElement, {
          value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
          language: 'javascript',
          fontSize: 20,
          theme: 'vs-dark',
        }))
      }

      initFileEvt()
      getContentByUUID(route.query?.uuid as string)

      window.workspace = workspace
      window.lastOID = -1;

      (window as any).handleNotifyEvent = (msg: number[]) => {
        if (msg.length === 11 && msg[2] === 0x05 && msg[3] === 0xB1 && msg[4] === 0x04) {
          if (myInterpreter && myInterpreter.appendCode) {
            const val = handleOIDVal(msg[10] * 256 * 256 * 256 + msg[9] * 256 * 256 + msg[8] * 256 + msg[7])
            // 限定 1 到 54
            if (val !== window.lastOID || state.enableAlways) { // todo: 通用码
              window.lastOID = val
              handleInterpreterOIDEvt(val)
            }
          }
        }
      }

      // 屏蔽网页保存，改为代码保存
      window.addEventListener('keydown', function (e) {
        if (e.key === 's' && ((/macintosh|mac os x/i.test(navigator.userAgent)) ? e.metaKey : e.ctrlKey)) {
          e.preventDefault()
          saveCode()
        }
        if (e.key === 'h' && ((/macintosh|mac os x/i.test(navigator.userAgent)) ? e.metaKey : e.ctrlKey)) {
          e.preventDefault()
          copyLine()
        }
      })
    })

    return {
      // testColorCode,
      toggleLoop,
      ...toRefs(state),
      runCode,
      saveCode,
      clearCanvas,
      connect,
      navigatorBack,
      exportCode,

    }
  },
})
</script>

<style lang="scss" scoped>
.code-view::v-deep {
  position: fixed;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.header {
  width: 100%;
  height: 60px;
  background-color: #232528;
  display: flex;
  justify-content: space-between;
  // padding: 13px 17px 10px;
  span {
    display: inline-block;
  }
  .title {
    font-weight: bold;
    font-size: 30px;
    color: #fff;
    height: 60px;
    line-height: 60px;
    margin-right: 20px;
    cursor: pointer;
    &.active {
      font-size: 24px !important;
    }
  }
  .btn-box {
    height: 100%;
    vertical-align: middle;
    line-height: 60px;
    .ant-btn {
      margin-right: 10px;
    }
  }

}
.dropdown {
  .menu-item {
    font-size: 20px;
    padding: 15px 10px;
  }
}
.code-box {
  width: 100%;
  height: 100%;
  text-align: left;
  font-size: 24px;
  // flex: 1;
  // display: flex;
}
#container {
  width: 100%;
  height: 100%;
  // flex: 1;
}
</style>
