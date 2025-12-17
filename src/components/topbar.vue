<template>
  <header class="topbar">
    <div class="left">
      <button class="fold" @click="Fold">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 32 32"
        >
          <circle cx="9" cy="6" r="1" fill="currentColor"></circle>
          <path
            d="M26 10H6a2.002 2.002 0 0 1-2-2V4a2.002 2.002 0 0 1 2-2h20a2.002 2.002 0 0 1 2 2v4a2.002 2.002 0 0 1-2 2zM6 4v4h20V4z"
            fill="currentColor"
          ></path>
          <circle cx="9" cy="16" r="1" fill="currentColor"></circle>
          <path
            d="M26 20H6a2.002 2.002 0 0 1-2-2v-4a2.002 2.002 0 0 1 2-2h20a2.002 2.002 0 0 1 2 2v4a2.002 2.002 0 0 1-2 2zM6 14v4h20v-4z"
            fill="currentColor"
          ></path>
          <circle cx="9" cy="26" r="1" fill="currentColor"></circle>
          <path
            d="M26 30H6a2.002 2.002 0 0 1-2-2v-4a2.002 2.002 0 0 1 2-2h20a2.002 2.002 0 0 1 2 2v4a2.002 2.002 0 0 1-2 2zM6 24v4h20v-4z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <button class="btn-control" @click="$router.back()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 256 512"
        >
          <path
            d="M31.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L127.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L201.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <button class="btn-control" @click="$router.forward()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 256 512"
        >
          <path
            d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4l-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
    </div>

    <div class="center">
      <button class="tohome" @click="$router.replace('/')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M19 8.71l-5.333-4.148a2.666 2.666 0 0 0-3.274 0L5.059 8.71a2.665 2.665 0 0 0-1.029 2.105v7.2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.2c0-.823-.38-1.6-1.03-2.105"
            ></path>
            <path d="M16 15c-2.21 1.333-5.792 1.333-8 0"></path>
          </g>
        </svg>
      </button>
      <SearchBox class="explore" v-model="searchKeyWord"></SearchBox>
      <button class="dosearch" @click="dosearch">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 24 24"
        >
          <path
            d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0c.41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <button class="musichub" @click="gotomusichub">
        <svg
          t="1764751129627"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="3502"
          width="20"
          height="20"
        >
          <path
            d="M371.2 53.333333H652.8c9.386667 0 16.597333 0 22.869333 0.682667A117.333333 117.333333 0 0 1 780.373333 165.12a123.136 123.136 0 0 1 87.594667 123.221333c16.981333 7.68 32 18.218667 44.885333 32.938667 26.282667 30.037333 34.304 66.773333 34.645334 109.653333 0.298667 41.472-6.698667 93.952-15.445334 159.317334l-17.664 132.608c-6.826667 51.114667-12.330667 92.501333-20.906666 124.885333-8.96 33.706667-22.101333 61.653333-46.805334 83.328-24.746667 21.632-54.186667 30.976-88.789333 35.413333-33.28 4.181333-74.965333 4.181333-126.549333 4.181334H392.618667c-51.541333 0-93.269333 0-126.506667-4.224-34.602667-4.394667-64.042667-13.738667-88.746667-35.413334-24.746667-21.632-37.930667-49.578667-46.848-83.285333-8.576-32.426667-14.08-73.770667-20.906666-124.885333l-17.706667-132.608c-8.704-65.365333-15.701333-117.845333-15.36-159.274667 0.256-42.922667 8.32-79.658667 34.602667-109.696a129.066667 129.066667 0 0 1 44.970666-32.981333A123.136 123.136 0 0 1 243.626667 165.12a117.333333 117.333333 0 0 1 104.704-111.104c6.272-0.682667 13.482667-0.682667 22.826666-0.682667z m-62.634667 106.666667h406.869334a53.333333 53.333333 0 0 0-46.592-42.368 210.090667 210.090667 0 0 0-17.792-0.298667H372.906667c-11.946667 0-15.402667 0.042667-17.792 0.298667a53.333333 53.333333 0 0 0-46.592 42.368z m-87.466666 111.658667c40.192-4.992 91.221333-4.992 154.112-4.992h273.578666c62.933333 0 113.962667 0 154.197334 5.034666a59.008 59.008 0 0 0-57.898667-47.701333H278.997333c-29.141333 0-52.693333 20.906667-57.898666 47.658667z m3.114666 64.170666c-35.157333 4.949333-52.949333 13.952-64.896 27.605334-11.946667 13.653333-18.56 32.426667-18.773333 67.968-0.298667 36.437333 6.016 84.437333 15.146667 152.874666l17.066666 128c7.168 53.76 12.202667 91.050667 19.626667 119.04 7.168 27.178667 15.616 41.514667 27.093333 51.584 11.52 10.026667 26.88 16.512 54.698667 20.053334 28.714667 3.669333 66.389333 3.712 120.618667 3.712h234.410666c54.186667 0 91.904-0.042667 120.618667-3.712 27.861333-3.541333 43.178667-10.026667 54.656-20.053334 11.52-10.069333 19.968-24.405333 27.136-51.541333 7.424-28.032 12.458667-65.322667 19.626667-119.082667l17.066666-128c9.130667-68.437333 15.445333-116.437333 15.189334-152.874666-0.256-35.498667-6.826667-54.314667-18.773334-67.968-11.946667-13.653333-29.781333-22.656-64.938666-27.605334-36.096-5.12-84.48-5.162667-153.514667-5.162666H377.728c-69.034667 0-117.461333 0.085333-153.514667 5.12z m355.370667 178.773334c22.613333 20.053333 47.36 29.397333 60.416 29.397333v64c-31.488 0-67.413333-16.512-96-39.68V725.333333a96 96 0 1 1-64-90.538666V448h64c0 22.997333 13.44 46.933333 35.584 66.56zM480 725.333333a32 32 0 1 0-64 0 32 32 0 0 0 64 0z"
            p-id="3503"
            fill="#bfbfbf"
          ></path>
        </svg>
      </button>
    </div>

    <div class="right">
      <!-- <div class="agent-menu-container" ref="agentMenuContainer">
        <button class="musichub" @click="toggleAgentMenu" :class="{ active: isAgentMenuOpen }">
          <svg
            t="1765440500071"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="11271"
            width="20"
            height="20"
          >
            <path
              d="M1021.659429 514.194286a13.019429 13.019429 0 0 1-9.508572 9.508571l-201.581714 50.395429a325.046857 325.046857 0 0 0-236.544 236.470857L523.702857 1012.297143a13.019429 13.019429 0 0 1-25.234286-0.073143l-50.395428-201.654857A325.046857 325.046857 0 0 0 211.456 574.171429l-201.654857-50.468572a13.019429 13.019429 0 0 1 0-25.234286l201.654857-50.468571a325.046857 325.046857 0 0 0 236.470857-236.470857l50.468572-201.581714a13.019429 13.019429 0 0 1 25.234285 0l50.468572 201.654857a325.046857 325.046857 0 0 0 236.470857 236.470857l201.654857 50.468571a13.019429 13.019429 0 0 1 9.508571 15.725715z m-305.152-3.218286l-10.093715-4.534857A416.256 416.256 0 0 1 515.657143 315.611429l-4.608-10.093715-4.681143 10.093715a416.256 416.256 0 0 1-190.829714 190.829714l-10.093715 4.534857 10.166858 4.754286A416.256 416.256 0 0 1 506.368 706.56l4.608 10.020571 4.681143-10.020571a416.256 416.256 0 0 1 190.756571-190.756571l10.093715-4.754286zM893.366857 28.598857l5.705143 23.113143c11.264 45.348571 46.665143 80.676571 91.940571 91.940571l23.113143 5.778286a13.019429 13.019429 0 0 1 0 25.234286l-23.113143 5.851428a126.390857 126.390857 0 0 0-91.940571 91.867429l-5.778286 23.113143a13.019429 13.019429 0 0 1-25.161143 0l-5.851428-23.113143a126.390857 126.390857 0 0 0-91.940572-91.940571l-23.04-5.778286a13.019429 13.019429 0 0 1 0-25.234286l23.04-5.778286A126.464 126.464 0 0 0 862.354286 51.712l5.778285-23.113143a13.019429 13.019429 0 0 1 25.307429 0z"
              fill="#bfbfbf"
              p-id="11272"
            ></path>
          </svg>
        </button>

        <transition name="fade-slide">
          <div class="agent-dropdown" v-show="isAgentMenuOpen">
            <div class="agent-header">
              <span>✨ Polomusic AI</span>
              <span class="clear-chat" @click="clearChat" title="清空对话">🗑️</span>
            </div>

            <div class="chat-body" ref="chatBodyRef">
              <div v-if="chatMessages.length === 0" class="empty-state">
                <p>👋 你好！我是你的音乐助手。</p>
                <p>试着问我："推荐几首周杰伦的歌" 或 "我想听些伤感的轻音乐"</p>
              </div>

              <div
                v-for="(msg, index) in chatMessages"
                :key="index"
                :class="['message-row', msg.role]"
              >
                <div class="bubble">
                  <span v-if="msg.role === 'assistant' && msg.isLoading" class="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                  <span v-else>{{ msg.content }}</span>
                </div>
              </div>
            </div>

            <div class="chat-input-area">
              <input
                v-model="agentInputValue"
                type="text"
                placeholder="输入你的需求..."
                @keyup.enter="sendAgentMessage"
                :disabled="isAgentThinking"
              />
              <button
                class="send-btn"
                @click="sendAgentMessage"
                :disabled="!agentInputValue.trim() || isAgentThinking"
              >
                ↑
              </button>
            </div>
          </div>
        </transition>
      </div> -->

      <div class="user-menu-container" ref="userMenuContainer">
        <button class="user" @click="toggleUserMenu">
          <img
            class="userPic"
            v-if="userInfos.avatarUrl"
            :src="userInfos.avatarUrl"
            alt="用户头像"
          />
          <img class="userPic" v-else src="/user.jpg" alt="默认头像" />
        </button>

        <transition name="fade-slide">
          <div class="dropdown-menu" v-show="isUserMenuOpen">
            <div
              class="menu-item"
              @click="goToLogin"
              v-if="pagecontroler.IsSkipLogin && !pagecontroler.IsLogin"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
              <span>登录</span>
            </div>
            <div class="menu-item" @click="goToSettings">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path
                  d="M19.14,12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24,0-.43.17-.47.41l-.36,2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47,0-.59.22L2.74,8.87c-.12.21-.08.47.12.61l2.03,1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03,1.58c-.18.14-.23.41-.12.61l1.92,3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36,2.54c.05.24.24.41.48.41h3.84c.24,0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47,0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6,1.62 3.6,3.6-1.62,3.6-3.6,3.6z"
                />
              </svg>
              <span>设置</span>
            </div>
            <div class="menu-item" @click="checkForUpdate">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
                />
              </svg>
              <span>检查更新</span>
            </div>
            <div
              class="menu-divider"
              v-if="!pagecontroler.IsSkipLogin && pagecontroler.IsLogin"
            ></div>
            <div
              class="menu-item"
              @click="handleLogout"
              v-if="!pagecontroler.IsSkipLogin && pagecontroler.IsLogin"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path
                  d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                />
              </svg>
              <span>退出登录</span>
            </div>
          </div>
        </transition>
      </div>

      <button class="win-btn" @click="minimize" title="最小化">━</button>
      <button class="win-btn" @click="toggleMax" title="最大化/还原">▢</button>
      <button class="win-btn close" @click="close" title="关闭">✕</button>
    </div>

    <div class="update-modal-overlay" v-if="updateStatus !== 'idle'">
      <div class="update-modal">
        <h3>软件更新</h3>
        <div class="status-content">
          <div v-if="updateStatus === 'checking'">正在检查更新...</div>
          <div v-if="updateStatus === 'not-available'">当前已是最新版本</div>
          <div v-if="updateStatus === 'available'">
            <p>发现新版本！</p>
            <button class="primary-btn" @click="startDownload">立即下载</button>
          </div>
          <div v-if="updateStatus === 'downloading'">
            <p>正在下载... {{ downloadProgress }}%</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: downloadProgress + '%' }"></div>
            </div>
          </div>
          <div v-if="updateStatus === 'downloaded'">
            <p>下载完成！</p>
            <button class="primary-btn" @click="quitAndInstall">立即重启安装</button>
          </div>
          <div v-if="updateStatus === 'error'">
            <p>检查更新失败</p>
            <p class="error-msg">{{ updateError }}</p>
          </div>
        </div>
        <button
          class="close-modal-btn"
          @click="closeUpdateModal"
          v-if="updateStatus !== 'downloading'"
        >
          关闭
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { userInfo } from '@/stores/userInfo'
import { pagecontrol } from '@/stores/page'
import { useRouter } from 'vue-router'
import { search } from '@/stores/search'
import SearchBox from './SearchBox.vue'
import { LogOut } from '@/api/Login'
import { getMusicRecommendation } from '@/Agent/Gorq'

const searcher = search()
const router = useRouter()
const isMax = ref(false)
const userInfos = userInfo()
const searchKeyWord = ref('')
const pagecontroler = pagecontrol()

// Menu State
const isUserMenuOpen = ref(false)
const isAgentMenuOpen = ref(false)
const userMenuContainer = ref<HTMLDivElement>()
const agentMenuContainer = ref<HTMLDivElement>()

// === AI Agent Logic ===
const chatBodyRef = ref<HTMLDivElement>()
const agentInputValue = ref('')
const isAgentThinking = ref(false)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
}

const chatMessages = ref<ChatMessage[]>([])

const clearChat = () => {
  chatMessages.value = []
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }
}

const sendAgentMessage = async () => {
  const text = agentInputValue.value.trim()
  if (!text || isAgentThinking.value) return

  // 1. 用户消息上屏
  chatMessages.value.push({ role: 'user', content: text })
  agentInputValue.value = ''
  scrollToBottom()
  const result = await getMusicRecommendation(text)
  // 2. 模拟 AI 思考 (Loading)
  isAgentThinking.value = true
  chatMessages.value.push({ role: 'assistant', content: result, isLoading: true })
  scrollToBottom()

  // 3. 模拟回复 (TODO: 这里后续替换为真实 API 调用)
  setTimeout(() => {
    chatMessages.value.pop() // 移除 loading
    chatMessages.value.push({
      role: 'assistant',
      content: `收到！你刚才说的是："${text}"。\n(这是模拟回复，请接入 API 以获取真实推荐)`,
    })
    isAgentThinking.value = false
    scrollToBottom()
  }, 1500)
}

// 互斥打开菜单逻辑
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
  if (isUserMenuOpen.value) isAgentMenuOpen.value = false
}

const toggleAgentMenu = () => {
  isAgentMenuOpen.value = !isAgentMenuOpen.value
  if (isAgentMenuOpen.value) {
    isUserMenuOpen.value = false
    scrollToBottom()
  }
}

// 统一点击外部关闭逻辑
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node

  if (userMenuContainer.value && !userMenuContainer.value.contains(target)) {
    isUserMenuOpen.value = false
  }

  if (agentMenuContainer.value && !agentMenuContainer.value.contains(target)) {
    isAgentMenuOpen.value = false
  }
}

// === Existing Functions ===

const minimize = () => window.electronAPI?.minimize?.()
const toggleMax = async () => {
  const res = await window.electronAPI?.toggleMaximize?.()
  isMax.value = !!res
}
const Fold = () => (pagecontroler.IsFold = !pagecontroler.IsFold)
const close = () => window.electronAPI?.close?.()
const gotomusichub = () => router.push({ name: 'wholemusichub' })
const dosearch = async () => {
  searcher.keyword = searchKeyWord.value
  router.push('SearchResult')
}

const goToLogin= () => {
  pagecontroler.isSkipLogin()
  router.replace('/')
  window.location.reload()
}
const goToSettings = () => (isUserMenuOpen.value = false)

const handleLogout = () => {
  if (!pagecontroler.IsLogin) return
  LogOut()
  localStorage.removeItem('neteaseCookie')
  localStorage.removeItem('userProfile')
  localStorage.removeItem('userDetail')
  isUserMenuOpen.value = false
  setTimeout(() => {
    router.replace('/')
    window.location.reload()
  }, 1500)
}

// === Auto Update Logic ===
const updateStatus = ref('idle')
const downloadProgress = ref(0)
const updateError = ref('')

const checkForUpdate = () => {
  isUserMenuOpen.value = false
  updateStatus.value = 'checking'
  window.electronAPI?.checkForUpdate()
}
const startDownload = () => window.electronAPI?.downloadUpdate()
const quitAndInstall = () => window.electronAPI?.quitAndInstall()
const closeUpdateModal = () => {
  if (updateStatus.value === 'downloading') return
  updateStatus.value = 'idle'
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)

  window.electronAPI?.onAutoUpdaterMessage((event, { message, data }) => {
    switch (message) {
      case 'checking-for-update':
        updateStatus.value = 'checking'
        break
      case 'update-available':
        updateStatus.value = 'available'
        break
      case 'update-not-available':
        updateStatus.value = 'not-available'
        break
      case 'error':
        updateStatus.value = 'error'
        updateError.value = data?.message || 'Unknown'
        break
      case 'download-progress':
        updateStatus.value = 'downloading'
        downloadProgress.value = Math.floor(data.percent)
        break
      case 'update-downloaded':
        updateStatus.value = 'downloaded'
        break
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
button:focus {
  outline: none;
}

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 1000;
  background-color: rgba(28, 28, 30, 0.1); /* 稍微深一点 */
  -webkit-app-region: drag;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  transform: translateZ(0);
  will-change: transform;
  transition: background 0.3s ease;
}

.topbar .left,
.topbar .center,
.topbar .right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Button Commons */
.btn-control,
.tohome,
.fold,
.dosearch,
.musichub,
.user,
.win-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  -webkit-app-region: no-drag;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-control {
  width: 25px;
  height: 25px;
}
.tohome,
.fold,
.dosearch,
.musichub {
  width: 30px;
  height: 30px;
  padding: 6px;
}
.user {
  width: 45px;
  height: 45px;
  padding: 6px;
}

.btn-control:hover,
.tohome:hover,
.fold:hover,
.dosearch:hover,
.musichub:hover,
.user:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 50%;
}

.musichub.active {
  background-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.userPic {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.win-btn {
  padding: 6px 8px;
}
.win-btn.close:hover {
  background: rgba(232, 17, 35, 0.9);
}
.win-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.explore {
  -webkit-app-region: no-drag;
}

/* === Agent Dropdown & User Dropdown Common === */
.agent-menu-container,
.user-menu-container {
  position: relative;
  -webkit-app-region: no-drag;
}

.dropdown-menu,
.agent-dropdown {
  position: absolute;
  top: 55px;
  right: 0;
  background: rgba(28, 28, 30, 0.85);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1001;
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform-origin: top right;
}

/* User Menu Specific */
.dropdown-menu {
  min-width: 180px;
  padding: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  color: #e0e0e0;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
}
.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 6px 0;
}

/* === Agent Dropdown Specific === */
.agent-dropdown {
  right: -80px; /* Adjust position */
  width: 360px;
  height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1002;
}

.agent-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}
.clear-chat {
  cursor: pointer;
  opacity: 0.6;
  font-size: 14px;
}
.clear-chat:hover {
  opacity: 1;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chat-body::-webkit-scrollbar {
  width: 4px;
}
.chat-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  margin-top: 50%;
  transform: translateY(-50%);
  line-height: 1.6;
}

.message-row {
  display: flex;
  width: 100%;
}
.message-row.user {
  justify-content: flex-end;
}
.message-row.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-wrap: break-word;
}
.user .bubble {
  background-color: #0bdc9a;
  color: #1c1c1e;
  border-bottom-right-radius: 2px;
  font-weight: 500;
}
.assistant .bubble {
  background-color: rgba(255, 255, 255, 0.15);
  color: #e0e0e0;
  border-bottom-left-radius: 2px;
}

.chat-input-area {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
}
.chat-input-area input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  color: #fff;
  font-size: 13px;
  outline: none;
}
.chat-input-area input:focus {
  background: rgba(255, 255, 255, 0.12);
}
.send-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #0bdc9a;
  border: none;
  color: #1c1c1e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Typing Animation */
.typing-dots span {
  animation: typing 1.4s infinite ease-in-out both;
  margin: 0 1px;
  font-weight: bold;
}
.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}
@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Modal Styles */
.update-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5); /* Dim background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  -webkit-app-region: no-drag;
}
.update-modal {
  background: #2c2c2e;
  padding: 24px;
  border-radius: 12px;
  width: 320px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.status-content {
  margin-bottom: 20px;
  color: #e0e0e0;
  min-height: 60px;
}
.primary-btn {
  background: #0bdc9a;
  color: #1c1c1e;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.close-modal-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #aaa;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-top: 10px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #0bdc9a;
  transition: width 0.3s ease;
}
.error-msg {
  color: #ff4d4f;
  font-size: 12px;
}

@media (max-width: 768px) {
  .topbar {
    padding: 0 8px;
  }
  .user {
    width: 36px;
    height: 36px;
  }
  .agent-dropdown {
    right: -10px;
    width: 300px;
  }
}
</style>
