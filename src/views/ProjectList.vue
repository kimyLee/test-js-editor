<template>
  <div class="project-list page">
    <HeaderNav
      :sub-title="$t(LANG.HOME_HEADER.SUBTITLE)">
      <!-- 显示JOYO ICON -->
      <div class="logo" />
      <a-button shape="circle"
                class="header-btn"
                @click="visibleOfJOYOUpdate = true">
        <a-badge v-show="hasNewVersion"
                 dot
                 :number-style="{width: '12px', height: '12px'}"
                 :offset="[3, 0]"
                 color="yellow">
          <img class="joyo-icon"
               src="~@/assets/joyo.png" />
        </a-badge>

        <img v-show="!hasNewVersion"
             class="joyo-icon"
             src="~@/assets/joyo.png" />
      </a-button>
      <a-button key="2"
                class="header-btn"
                @click="connectJoyo">
        <span class="connect-text">
          <span class="connect-dot"
                :class="{'active': connectStatus}" />
          {{ connectStatus? $t (LANG.BLOCKLY_MENU.DISCONNECT) : $t(LANG.BLOCKLY_MENU.CONNECT) }}
        </span>
        <question-circle-outlined style="fontSize: 20px;color: #aaa;vertical-align: middle;"
                                  @click.stop="visibleOfConnectTip = true" />
      </a-button>

      <a-button key="2"
                class="header-btn"
                @click.stop="createProjectPop">
        创建JS程序
        <template #icon>
          <PlusOutlined />
        </template>
      </a-button>
    </HeaderNav>
    <div class="container">
      <div class="warning-tip">
        <a-alert :message="$t(LANG.HOME_HEADER.PROGRAM_WARN)"
                 show-icon
                 type="warning" />
      </div>

      <transition-group name="fade"
                        class="list-view"
                        tag="div">
        <!-- todo: 可改名 -->
        <div v-for="v in projectList"
             :key="v.uuid"
             :class="handleItemClass(v)"
             class="item"
             @click.stop="onProjectClick(v)">
          <div class="content">
            <span class="title">
              {{ v.name }}
            </span>
            <!-- 更多选择 -->
            <div class="bottom-line"
                 @click.stop>
              <!-- 重命名 -->
              <HighlightOutlined class="bottom-icon"
                                 title="重命名"
                                 @click="renameGamePop(v.name, v.uuid)" />
              <!-- 下载 -->
              <vertical-align-bottom-outlined class="bottom-icon download-icon"
                                              :title="$t(LANG.GAME_LIST.DOWNLOAD)"
                                              @click="exportProgram(v.name, v.uuid)" />
              <!-- 删除 -->
              <a-popconfirm :title="$t(LANG.GAME_LIST.DELETE_CONFIRM)"
                            :ok-text="$t(LANG.COMMON.CONFIRM)"
                            :cancel-text="$t(LANG.COMMON.CANCEL)"
                            @confirm="handleDelete(v.uuid)">
                <span class="bottom-icon del-icon">
                  <delete-outlined :title="$t(LANG.GAME_LIST.DELETE)" />
                </span>
              </a-popconfirm>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 输入新建程序名弹窗 -->
    <a-modal v-model:visible="visibleOfCreateProject"
             :width="360"
             :ok-text="$t(LANG.COMMON.CONFIRM)"
             :cancel-text="$t(LANG.COMMON.CANCEL)"
             :title="$t(LANG.GAME_LIST.CREATE_NEW_GAME)"
             @ok="handleOk">
      <a-input ref="refCreatePopBox"
               v-model:value="programName"
               :placeholder="$t(LANG.GAME_LIST.GAME_NAME)" />
    </a-modal>

    <!-- 重命名程序弹窗 -->
    <a-modal v-model:visible="visibleOfRenameProject"
             :width="360"
             :ok-text="$t(LANG.COMMON.CONFIRM)"
             :cancel-text="$t(LANG.COMMON.CANCEL)"
             :title="$t(LANG.GAME_LIST.RENAME_GAME)"
             @cancel="programName = ''"
             @ok="handleRenameOk">
      <a-input ref="refCreatePopBox"
               v-model:value="programName"
               :placeholder="$t(LANG.GAME_LIST.GAME_NAME)" />
    </a-modal>

    <!-- JOYO版本信息及更新 -->
    <UpdateProcess v-model="visibleOfJOYOUpdate" />
    <ConnectTip v-model="visibleOfConnectTip" />
    <!-- <a-modal
             :width="360"
             ok-text="更新版本"
             cancel-text="我知道了"
             title="创建新程序"
             @ok="handleUpdateJOYO">
      <div>当前版本号：v1.0.0</div>
      <div>已是最新版本</div>
    </a-modal> -->
  </div>
</template>

<script lang="ts">
import {
  computed,
  watchEffect,
  watch,
  defineComponent,
  getCurrentInstance,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  toRefs,
  ref,
  nextTick,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
// import type { UploadChangeParam } from 'ant-design-vue'
import { message } from 'ant-design-vue'

// import { useStore } from '@/store'
import HeaderNav from '@/components/HeaderNav.vue'
import UpdateProcess from '@/components/update-pop/UpdateProcess.vue'
import ConnectTip from '@/components/update-pop/ConnectTip.vue'
import {
  HomeOutlined, MessageOutlined, FileSearchOutlined,
  HighlightOutlined, DownOutlined, QuestionCircleOutlined, PlusOutlined, DeleteOutlined, EllipsisOutlined, VerticalAlignBottomOutlined, DeliveredProcedureOutlined,
} from '@ant-design/icons-vue'
import { useStore } from 'vuex'
import { exportFile } from '@/lib/project/common'

import { bleState } from '@/api/joyo-ble/web-ble-server'
import { locale, LocaleEnum } from '@/locale/index'
import LANG from '@/i18n/type'
// import spy from '@/game-test/spy'
// import rich from '@/game-test/rich'
import unlocko from '@/game-test/unlocko'
import ohmind from '@/game-test/ohmind'
import mineSweeper from '@/game-test/mine-sweeper'
import hideAndSeek from '@/game-test/hide-and-seek'
import fastCat from '@/game-test/fast-cat'
import bee from '@/game-test/bee'
import music from '@/game-test/music'
import maze from '@/game-test/maze'
import cook from '@/game-test/cook'

import { projectPrefix } from '@/utils/config'

declare global {
    interface Window {
      JSZip: any,
    }
}

export default defineComponent({
  name: 'Home',
  components: {
    // DownloadOutlined,
    // EllipsisOutlined,
    // DeliveredProcedureOutlined,
    VerticalAlignBottomOutlined,
    PlusOutlined,
    DeleteOutlined,
    HeaderNav,
    UpdateProcess,
    ConnectTip,
    QuestionCircleOutlined,
    // DownOutlined,
    HighlightOutlined,
    // HomeOutlined,
    // MessageOutlined,
    // FileSearchOutlined,
  },

  setup () {
    // @ts-ignore
    // const { proxy } = getCurrentInstance()
    // const store = useStore()

    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const refCreatePopBox = ref()
    const fileList = ref([])

    const state: any = reactive({
      programName: '',
      programId: '',
      visibleOfJOYOUpdate: false,
      visibleOfConnectTip: false,
      visibleOfCreateProject: false,
      visibleOfRenameProject: false,
      visibleOfExportProject: false,
    })

    const projectList = computed(() => {
      return store.getters.projectListByFilter
    })

    const connectStatus = computed(() => { // 看下行否
      return store.getters['ble/connectStatus']
    })

    watch(() => connectStatus.value, (val) => {
      if (val) {
        store.dispatch('ble/bleGetCurrentVersion')
      }
    })

    const fetchProjectList = async () => {
      store.dispatch('getProject')
    }

    // 创建程序
    const createProjectPop = () => {
      state.visibleOfCreateProject = true
      nextTick(() => {
        refCreatePopBox.value.focus()
      })
    }

    // 重命名程序
    const renameGamePop = (name: string, id: string) => {
      state.visibleOfRenameProject = true
      state.programId = id
      state.programName = name
      nextTick(() => {
        refCreatePopBox.value.focus()
      })
    }
    const createProject = (name: string) => {
      store.dispatch('createProject', { name })
    }
    const handleOk = () => {
      if (state.programName) {
        const list = projectList.value
        // 检查名字是否重复
        for (let i = list.length; i--;) {
          if (list[i].name === state.programName) {
            message.warning('程序名已存在')
            return
          }
        }
        createProject(state.programName)
        state.programName = ''
        state.visibleOfCreateProject = false
      } else {
        message.warning('程序名不能为空')
      }
    }
    const handleRenameOk = () => {
      if (state.programName) {
        const list = projectList.value
        // 检查名字是否重复
        for (let i = list.length; i--;) {
          if (list[i].name === state.programName) {
            message.warning('程序名已存在')
            return
          }
        }
        // createProject(state.programName)
        store.dispatch('renameProject', {
          name: state.programName,
          id: state.programId,
        })
        state.programName = ''
        state.programId = ''
        state.visibleOfRenameProject = false
      } else {
        message.warning('程序名不能为空')
      }
    }
    const onProjectClick = (v: { uuid: string }) => {
      // router.push(`/blockly?uuid=${v.uuid}`)
      router.push(`/js-editor?uuid=${v.uuid}`)
    }

    function importProgram () { // 从已有程序里倒入
      //
    }

    function initFileEvt () {
      const fileInput = document.getElementById('listFileInput') as HTMLInputElement
      if (fileInput) {
        fileInput.addEventListener('change', function selectedFileChanged () {
          if (this?.files?.length === 0) {
            return
          }
          const files = this?.files
          const reader = new FileReader()
          reader.onload = function fileReadCompleted () {
          // 当读取完成时，内容只在`reader.result`中
            const name = files?.[0]?.name?.split('.')[0]
            try {
              store.dispatch('createProject', { name, content: reader.result })
            } catch (err) {
              console.log(err)
            }
          }
          files && reader.readAsText(files[0])
        })
      }
    }

    // 导出程序
    function exportAllProgram () {
      // 初始化一个zip打包对象
      try {
        const JSZip = window.JSZip
        const zip = new JSZip()
        projectList.value.forEach((project: any) => {
        // zip包里面不断塞svg文件
          const content = localStorage.getItem(`${projectPrefix}-${project.uuid}`)
          zip.file(project.name + '.jo', content)
        })
        zip.generateAsync({
          type: 'blob',
        }).then((content: any) => {
        // 下载的文件名
          var filename = 'programs.zip'
          // 创建隐藏的可下载链接
          var eleLink = document.createElement('a')
          eleLink.download = filename
          eleLink.style.display = 'none'
          // 下载内容转变成blob地址
          eleLink.href = URL.createObjectURL(content)
          // 触发点击
          document.body.appendChild(eleLink)
          eleLink.click()
          // 然后移除
          document.body.removeChild(eleLink)
        })
      } catch {
        message.error('导出出错')
      }
    }

    // 导出单个程序
    function exportProgram (name: string, uuid: string) {
      const content = localStorage.getItem(`${projectPrefix}-${uuid}`) // todo: 获取程序详情收归一处
      if (content) {
        exportFile(name + '.jo', content)
      } else {
        message.warn('导出失败')
      }
    }

    function handleItemClass (v: any) {
      const classList = []
      classList.push('item-color' + ((v.createAt || 0) % 5))
      return classList
    }

    function handleDelete (uuid: number) {
      store.dispatch('deleteProject', uuid)
    }

    function connectJoyo () {
      if (!connectStatus.value) {
        store.dispatch('ble/bleConnect')
      } else {
        store.dispatch('ble/bleDisconnect')
      }
    }

    // 比较版本号
    const hasNewVersion = computed(() => {
      if (store.state.ble.lastVersion && store.state.ble.currentVersion) {
        return store.state.ble.lastVersion !== store.state.ble.currentVersion
      } else {
        return false
      }
    })

    const newTabs = (link: string) => {
      window.open(link)
    }

    // function runSpy () {
    //   spy()
    // }
    // function runRich () {
    //   rich()
    // }
    function runUnlocko () { // 2人版unlocko
      // unlocko()
      // ohmind()
      // mineSweeper()
      // hideAndSeek()
      // // fastCat()
      // bee()
      music()
      // maze()
      // cook()
    }
    // function runOhmind () { // 2人版unlocko
    //   ohmind()
    // }
    // function runMineSweeper () { // 2人版unlocko
    //   mineSweeper()
    // }
    // function runHideAndSeek () { // 王子救公主
    //   hideAndSeek()
    // }
    // function runBee () { // 王子救公主
    //   bee()
    // }
    // function runMusic () { // 王子救公主
    //   music()
    // }
    // function runMaze () { // 王子救公主
    //   maze()
    // }
    // function runCook () { // 王子救公主
    //   cook()
    // }

    onBeforeMount(async () => {
      // await fetchProjectList(state.tabType)
    })

    onUnmounted(() => {
      //
    })

    onMounted(async () => {
      (window as any).handleNotifyEvent = (msg: number[]) => {
        if (msg.length === 11 && msg[2] === 0x05 && msg[3] === 0xB1 && msg[4] === 0x04) {
          const val = (msg[10] * 256 * 256 * 256 + msg[9] * 256 * 256 + msg[8] * 256 + msg[7])
          window.When_JOYO_Read && window.When_JOYO_Read(val)
          // window.When_JOYO_Read_cat && window.When_JOYO_Read_cat(val)
          // window.When_JOYO_Read_cook && window.When_JOYO_Read_cook(val)
          // window.When_JOYO_Read_bee && window.When_JOYO_Read_bee(val)
          // window.When_JOYO_Read_hide && window.When_JOYO_Read_hide(val)
          // window.When_JOYO_Read_maze && window.When_JOYO_Read_maze(val)
          // window.When_JOYO_Read_mine && window.When_JOYO_Read_mine(val)
          // window.When_JOYO_Read_music && window.When_JOYO_Read_music(val)
          // window.When_JOYO_Read_ohmind && window.When_JOYO_Read_ohmind(val)
          // window.When_JOYO_Read_unlocko && window.When_JOYO_Read_unlocko(val)
        }
      }

      await store.dispatch('createPresetGame')
      fetchProjectList()
      initFileEvt()

      // 获取最新版本
      store.dispatch('ble/bleGetOriginVersion')
    })

    return {
      // runSpy,
      // runRich,
      runUnlocko,
      // runOhmind,
      // runMineSweeper,
      // runHideAndSeek,
      // runBee,
      // runMusic,
      // runMaze,
      // runCook,
      router,
      refCreatePopBox,
      ...toRefs(state),
      projectList,
      fileList,
      connectStatus,

      hasNewVersion,

      createProjectPop,
      renameGamePop,
      createProject,
      handleOk,
      handleRenameOk,

      handleDelete,

      onProjectClick,

      exportAllProgram,
      exportProgram,

      handleItemClass,

      connectJoyo,

      LocaleEnum,
      LANG,
      setLocale: locale.setLocale,

      newTabs,
    }
  },
})
</script>

<style lang="scss">
.pop-menu-item {
  .anticon {
    font-size: 16px !important;
  }
}
</style>
<style lang="scss" scoped>
.project-list {

  .header-btn {
      color: #fff;
      background: rgba(255, 255, 255, .2);
      border-color: rgba(255, 255, 255, .2);
      &:hover {
        background: rgba(255, 255, 255, .5);
        border-color: rgba(255, 255, 255, .5);
      }
    }
  .head-btn {
    line-height: 1.5715;
    position: relative;
    display: inline-block;
    font-weight: 400;
    white-space: nowrap;
    text-align: center;
    background-image: none;
    border: 1px solid transparent;
    box-shadow: 0 2px 0 rgb(0 0 0 / 2%);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    touch-action: manipulation;
    height: 32px;
    padding: 4px 15px;
    font-size: 14px;
    border-radius: 2px;
    color: rgba(0, 0, 0, 0.85);
    color: #fff;
    background: rgba(255, 255, 255, .2);
    border-color: rgba(255, 255, 255, .2);

    &:hover {
      background: rgba(255, 255, 255, .5);
      border-color: rgba(255, 255, 255, .5);
    }
    #listFileInput {
      opacity: 0;
    }
  }
  .joyo-icon {
    width: 22px;
    height: 22px;
  }
  .connect-text {
  }
  .connect-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: 5px;
    margin-top: -4px;
    vertical-align: middle;
    background: #ccc;
    border-radius: 50%;
    &.active {
      background: #52c41a;
    }
  }

  // 程序列表相关
  .container {
    position: relative;
    // padding: 20px;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: scroll;
    overflow-y: overlay;
    -webkit-overflow-scrolling: touch;
    background: #D2D6DB;

    .list-view {
      position: relative;
      margin: 0 20px;
      display: flex;
      flex-wrap: wrap;

      .item {
        padding: 20px;
        box-sizing: border-box;
        width: 300px;
        height: 200px;
        border-radius: 20px;
        // background-color: rgba(125, 125, 125, 0.16);
        // background-color: #fff;
        background: linear-gradient(0deg, #c4c7ce 20.79%, rgb(232 235 244) 100%);
        // background-image:url("~@/assets/card-bg.png");
        // background-repeat: no-repeat;
        // background-position: 70% 50%;

        box-shadow: 9px 13px 22px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        color: transparent;
        position: relative;
        transition: transform 0.3s ease;
        margin: 20px 20px;
        cursor: pointer;

        &:active {
          background-size: 110% 110%;
        }

        .content {
          .title {
            display: block;
            font-weight: 700;
            font-size: 24px;
            text-align: left;
            color: #666;
          }
          .bottom-line {
            position: absolute;
            color: #888;
            bottom: 0;
            left: 0;
            width: 100%;
            text-align: right;
            font-size: 24px;
            // padding: 5px 20px;
            box-sizing: border-box;
            .bottom-icon {
              padding-right: 15px;
              padding-bottom: 10px;
            }
            .download-icon {
              &:hover {
                color: #1890ff;
              }
            }
            .del-icon {
              &:hover {
                color: red;
              }
            }
          }
        }
      }
    }

    .warning-tip {
      // position: absolute;
      // top: 0;
      // left: 0;
      text-align: left;
    }
    // 删掉了fade-leave-to
    .fade-enter {
      opacity: 0;
    }
    .fade-move {
      transition: all 0.3s ease;
    }
    .fade-enter-active {
      animation: bounce-in 0.3s;
    }
    .fade-leave-active {
      animation: bounce-out 0.3s;
    }

    @keyframes bounce-in {
      0% {
        opacity: 0;
        transform: scale(0.6);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes bounce-out {
      0% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.2;
        transform: scale(0.7);
      }
      100% {
        opacity: 0.1;
        transform: scale(0.4);
      }
    }
  }
}

.icon-fade-enter-active,
.icon-fade-leave-active {
  // transition: opacity 0.3s;
}
.icon-fade-enter-active {
  opacity: 0;
  transform: scale(0.4);
}
.icon-fade-enter,
.icon-fade-leave-to {
  opacity: 0;
  transform: scale(0.4);
}
</style>
