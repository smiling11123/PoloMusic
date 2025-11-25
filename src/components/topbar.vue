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
      <button class="tohome" @click="$router.push('/')">
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
    </div>

    <div class="right">
      <!-- 用户头像和下拉菜单 -->
      <div class="user-menu-container" ref="userMenuContainer">
        <button class="user" @click="toggleUserMenu">
          <img
            class="userPic"
            v-if="userInfos.avatarUrl"
            :src="userInfos.avatarUrl"
            alt="用户头像"
          />
          <img class="userPic" v-else src="../../public/user.jpg" alt="默认头像" />
        </button>

        <!-- 下拉菜单 -->
        <div class="dropdown-menu" v-show="isUserMenuOpen">
          <div class="menu-item" @click="goToUserProfile">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
            <span>个人中心</span>
          </div>
          <div class="menu-item" @click="goToSettings">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path
                d="M19.14,12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24,0-.43.17-.47.41l-.36,2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47,0-.59.22L2.74,8.87c-.12.21-.08.47.12.61l2.03,1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03,1.58c-.18.14-.23.41-.12.61l1.92,3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36,2.54c.05.24.24.41.48.41h3.84c.24,0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47,0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6,1.62 3.6,3.6-1.62,3.6-3.6,3.6z"
              />
            </svg>
            <span>设置</span>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-item" @click="handleLogout">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path
                d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
              />
            </svg>
            <span>退出登录</span>
          </div>
        </div>
      </div>

      <button class="win-btn" @click="minimize" title="最小化">━</button>
      <button class="win-btn" @click="toggleMax" title="最大化/还原">▢</button>
      <button class="win-btn close" @click="close" title="关闭">✕</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { userInfo } from '@/stores/userInfo'
import { pagecontrol } from '@/stores/page'
import { useRouter } from 'vue-router'
import { search } from '@/stores/search'
import SearchBox from './SearchBox.vue'
import { GetSearchData } from '@/api/Search'
import { LogOut } from '@/api/Login'

const searcher = search()
const router = useRouter()
const isMax = ref(false)
const userInfos = userInfo()
const searchKeyWord = ref('')
const pagecontroler = pagecontrol()
const isUserMenuOpen = ref(false)
const userMenuContainer = ref<HTMLDivElement>()

const minimize = () => {
  window.electronAPI?.minimize?.()
}

const toggleMax = async () => {
  const res = await window.electronAPI?.toggleMaximize?.()
  isMax.value = !!res
}

const Fold = () => {
  pagecontroler.IsFold = !pagecontroler.IsFold
}

const close = () => {
  window.electronAPI?.close?.()
}

// 新增：切换下拉菜单
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

// 新增：点击外部关闭菜单
const handleClickOutside = (e: MouseEvent) => {
  if (userMenuContainer.value && !userMenuContainer.value.contains(e.target as Node)) {
    isUserMenuOpen.value = false
  }
}

// 新增：菜单项功能
const goToUserProfile = () => {
  //router.push('/user-profile')
  isUserMenuOpen.value = false
}

const goToSettings = () => {
  //router.push('/settings')
  isUserMenuOpen.value = false
}

const handleLogout = () => {
  LogOut()
  // 清除用户数据
  localStorage.removeItem('neteaseCookie')
  localStorage.removeItem('userProfile')
  localStorage.removeItem('userDetail')

  isUserMenuOpen.value = false

  setTimeout(() => {
    router.replace('/')
    window.location.reload()
  }, 1500)
}

// 监听点击外部事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const dosearch = async () => {
  searcher.keyword = searchKeyWord.value
  router.push('SearchResult')
}
</script>

<style>
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
  background: #1c1c1e;
  -webkit-app-region: drag;
}

.btn-control {
  background: none;
  width: 25px;
  height: 25px;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.2s;
  -webkit-app-region: no-drag;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.topbar .left,
.topbar .center,
.topbar .right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.explore {
  -webkit-app-region: no-drag;
}

.tohome,
.fold,
.dosearch {
  background: none;
  width: 30px;
  height: 30px;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: color 0.2s;
  -webkit-app-region: no-drag;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

/* 所有按钮区域必须声明 no-drag */
.btn,
.win-btn,
.control {
  -webkit-app-region: no-drag;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.win-btn.close {
  color: #fff;
  background: rgba(145, 145, 145, 0.12);
}
.win-btn:hover {
  background: rgba(255, 255, 255, 0.04);
}
.btn:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* 用户菜单容器 */
.user-menu-container {
  position: relative;
  -webkit-app-region: no-drag;
}

.user {
  background: none;
  width: 45px;
  height: 45px;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 6px;
  transition: color 0.2s;
  -webkit-app-region: no-drag;
}

.userPic {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

/* 下拉菜单样式 */
.dropdown-menu {
  position: absolute;
  top: 55px;
  right: 0;
  background: #1c1c1e;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  padding: 8px 8px;
  z-index: 1001;
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
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.menu-item svg {
  flex-shrink: 0;
}

.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

/* 加载动画 */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #0bdc9a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .topbar {
    padding: 0 8px;
  }

  .user {
    width: 36px;
    height: 36px;
  }
}
</style>
