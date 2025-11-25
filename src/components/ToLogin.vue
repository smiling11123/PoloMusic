<template>
  <div class="login-container">
    <div class="bg-glow"></div>

    <div class="login-box">
      <div class="login-header">
        <h2>登录网易云音乐</h2>
        <p>享受高品质音乐生活</p>
      </div>

      <n-card class="login-card" :bordered="false" content-style="padding: 0;">
        <n-tabs
          type="line"
          animated
          v-model:value="activeTab"
          justify-content="space-evenly"
          class="custom-tabs"
        >
          <n-tab-pane name="qr" tab="扫码登录">
            <div class="qr-login">
              <div class="qr-wrapper">
                <div class="qr-border-box">
                  <img
                    v-if="qrImg"
                    :src="qrImg"
                    alt="扫码登录"
                    class="qr-image"
                    @click="refreshQR"
                  />
                  <n-skeleton v-else height="180px" width="180px" />

                  <div v-if="qrExpired" class="qr-expired-mask">
                    <span>已过期</span>
                    <n-button type="primary" size="small" @click="refreshQR">点击刷新</n-button>
                  </div>
                </div>
              </div>
              <p class="qr-tip">{{ qrStatusText }}</p>
            </div>
          </n-tab-pane>

          <n-tab-pane name="phone" tab="手机号">
            <form class="custom-form" @submit.prevent="handlePhoneLogin">
              <div class="form-item">
                <input
                  v-model="formValue.phone"
                  type="tel"
                  placeholder="请输入手机号"
                  maxlength="11"
                  class="custom-input"
                  required
                />
              </div>
              <div class="form-item">
                <input
                  v-model="formValue.password"
                  type="password"
                  placeholder="请输入密码"
                  class="custom-input"
                  required
                />
              </div>
              <button
                type="submit"
                :disabled="!formValue.phone || !formValue.password || loading"
                class="login-btn"
              >
                {{ loading ? '登录中...' : '立即登录' }}
              </button>
            </form>
          </n-tab-pane>

          <n-tab-pane name="cookie" tab="Cookie">
            <form class="custom-form" @submit.prevent="handleCookieLogin">
              <div class="form-item">
                <textarea
                  v-model="cookieFormValue.cookie"
                  placeholder="粘贴 Cookie (需包含 MUSIC_U)"
                  rows="5"
                  class="custom-input textarea-input"
                  required
                ></textarea>
              </div>

              <div class="cookie-guide">
                <p>如何获取 Cookie?</p>
                <ol>
                  <li>浏览器打开网易云音乐官网并登录</li>
                  <li>F12 打开控制台 -> Application -> Storage -> Cookies</li>
                  <li>找到 <span>MUSIC_U</span> 字段并复制内容</li>
                </ol>
              </div>

              <button
                type="submit"
                :disabled="!cookieFormValue.cookie || cookieLoading"
                class="login-btn"
              >
                {{ cookieLoading ? '验证中...' : '验证登录' }}
              </button>
            </form>
          </n-tab-pane>
        </n-tabs>
      </n-card>

      <div class="message-area">
        <transition name="fade">
          <div v-if="errorMsg" class="msg-box error">{{ errorMsg }}</div>
        </transition>
        <transition name="fade">
          <div v-if="successMsg" class="msg-box success">{{ successMsg }}</div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { request } from '@/api/request'
import type { AxiosResponse } from 'axios'
import { CheckLoginStatus } from '@/api/Login'
import { GetUserDetail, GetUserSubcount } from '@/api/useInfo'
import { pagecontrol } from '@/stores/page'

interface QRKeyResponse {
  code: number
  data: {
    unikey: string
  }
}

interface QRCreateResponse {
  code: number
  data: {
    qrimg: string
    qrurl: string
  }
}

interface QRCheckResponse {
  code: number
  cookie?: string
  message?: string
}

interface PhoneLoginResponse {
  code: number
  cookie?: string
  profile?: {
    nickname: string
    userId: number
  }
  message?: string
}

interface UserAccountResponse {
  code: number
  account?: {
    id: number
    vipType: number
  }
  profile?: {
    nickname: string
    userId: number
  }
}

const router = useRouter()
const message = useMessage()
const activeTab = ref<'qr' | 'phone' | 'cookie'>('qr')
const pagecontroler = pagecontrol()

// 二维码登录状态
const qrImg = ref<string>('')
const qrKey = ref<string>('')
const qrStatusText = ref<string>('请使用网易云音乐APP扫码登录')
const qrExpired = ref<boolean>(false)
const checkTimer = ref<number | null>(null)

// 手机号登录表单
const loading = ref<boolean>(false)
const formValue = reactive({
  phone: '',
  password: '',
})

// Cookie 登录表单
const cookieLoading = ref<boolean>(false)
const cookieFormValue = reactive({
  cookie: '',
})

// 提示信息
const errorMsg = ref<string>('')
const successMsg = ref<string>('')

// 获取二维码
const getQRCode = async () => {
  try {
    qrExpired.value = false
    qrImg.value = ''
    qrStatusText.value = '正在获取二维码...'

    const keyRes = await request.get<any, AxiosResponse<QRKeyResponse>>('/login/qr/key')
    qrKey.value = keyRes.data.data.unikey

    const qrRes = await request.get<any, AxiosResponse<QRCreateResponse>>('/login/qr/create', {
      params: { key: qrKey.value, qrimg: true },
    })
    qrImg.value = qrRes.data.data.qrimg

    startCheckQRStatus()
  } catch (error) {
    errorMsg.value = '获取二维码失败，请重试'
    qrStatusText.value = '获取失败'
  }
}

// 轮询检测扫码状态
const startCheckQRStatus = () => {
  qrStatusText.value = '请使用网易云音乐APP扫码登录'

  checkTimer.value = window.setInterval(async () => {
    if (!qrKey.value) return

    try {
      const statusRes = await request.get<any, AxiosResponse<QRCheckResponse>>('/login/qr/check', {
        params: { key: qrKey.value },
      })

      const code = statusRes.data.code

      if (code === 800) {
        qrExpired.value = true
        qrStatusText.value = '二维码已过期，请点击刷新'
        clearCheckTimer()
        return
      }

      if (code === 801) {
        qrStatusText.value = '请使用网易云音乐APP扫码登录'
      } else if (code === 802) {
        qrStatusText.value = '已扫码，请在手机上确认登录'
      } else if (code === 803) {
        qrStatusText.value = '登录成功！'

        clearCheckTimer()

        const cookie = statusRes.data.cookie
        if (cookie) {
          localStorage.setItem('neteaseCookie', cookie)
          const status = await CheckLoginStatus()
          const usersubcount = await GetUserSubcount()
          console.log(usersubcount)
          console.log(status)

          if (status.data.profile) {
            localStorage.setItem('userProfile', JSON.stringify(status.data.profile))
            const userDetail = await GetUserDetail(status.data.profile.userId)
            localStorage.setItem('userDetail', JSON.stringify(userDetail))
          }
          successMsg.value = '登录成功，正在跳转...'
          //router.push('/')
          setTimeout(() => {
            router.replace('/')
            window.location.reload()
          }, 1500)
        }
      }
    } catch (error) {
      console.error('检查二维码状态失败:', error)
    }
  }, 1000)
}

// 清除定时器
const clearCheckTimer = () => {
  if (checkTimer.value) {
    clearInterval(checkTimer.value)
    checkTimer.value = null
  }
}

// 刷新二维码
const refreshQR = () => {
  clearCheckTimer()
  getQRCode()
}

// 手机号登录
const handlePhoneLogin = async () => {
  try {
    if (!formValue.phone || !formValue.password) {
      errorMsg.value = '请填写完整信息'
      return
    }

    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(formValue.phone)) {
      errorMsg.value = '手机号格式不正确'
      return
    }

    loading.value = true
    errorMsg.value = ''

    const res = await request.get<any, AxiosResponse<PhoneLoginResponse>>('/login/cellphone', {
      params: { phone: formValue.phone, password: formValue.password },
    })

    if (res.data.code === 200) {
      if (res.data.cookie) {
        localStorage.setItem('neteaseCookie', res.data.cookie)
      }
      if (res.data.profile) {
        localStorage.setItem('userProfile', JSON.stringify(res.data.profile))
      }

      successMsg.value = `欢迎回来，${res.data.profile?.nickname || ''}！`

      setTimeout(() => {
        //router.replace('/')
        window.location.reload()
      }, 1500)
    } else {
      errorMsg.value = res.data.message || '登录失败'
    }
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}

// Cookie 登录
const handleCookieLogin = async () => {
  try {
    if (!cookieFormValue.cookie.trim()) {
      errorMsg.value = '请输入Cookie'
      return
    }

    if (!cookieFormValue.cookie.includes('MUSIC_U=')) {
      errorMsg.value = 'Cookie必须包含 MUSIC_U 字段'
      return
    }

    cookieLoading.value = true
    errorMsg.value = ''

    const cookie = cookieFormValue.cookie.trim()

    const testRes = await request.get<any, AxiosResponse<UserAccountResponse>>('/user/account', {
      headers: { Cookie: cookie },
    })

    if (testRes.data.code === 200) {
      pagecontroler.IsLogin = true
      localStorage.setItem('neteaseCookie', cookie)

      const status = await CheckLoginStatus()
      const usersubcount = await GetUserSubcount()
      console.log(usersubcount)
      console.log(status)

      if (status.data.profile) {
        localStorage.setItem('userProfile', JSON.stringify(status.data.profile))
        const userDetail = await GetUserDetail(status.data.profile.userId)
        localStorage.setItem('userDetail', JSON.stringify(userDetail))
      }

      successMsg.value = `登录成功！欢迎 ${testRes.data.profile?.nickname || '用户'}`
      //router.push('/')
      setTimeout(() => {
            router.replace('/')
            window.location.reload()
          }, 1500)
    } else {
      throw new Error('Cookie无效或已过期')
    }
  } catch (error: any) {
    errorMsg.value = error.message || 'Cookie验证失败'
  } finally {
    cookieLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  getQRCode()
})
onUnmounted(() => {
  clearCheckTimer()
})
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #1c1c1e;
  color: #fff;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
}

.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  background: #1c1c1e;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.login-box {
  width: 400px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 10px;

  h2 {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #fff 0%, #aaa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    margin: 8px 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 1px;
  }
}

.login-card {
  background: rgba(30, 30, 30, 0.6) !important;
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;

  :deep(.n-card__content) {
    padding: 0 !important;
  }
}

:deep(.n-tabs) {
  .n-tabs-nav {
    background: rgba(0, 0, 0, 0.2);
    padding: 10px 10px 0;
  }
  .n-tabs-tab {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    transition: all 0.3s;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    &.n-tabs-tab--active {
      color: #ffffff;
      font-weight: 700;
      font-size: 16px;
    }
  }
  .n-tabs-bar {
    background-color: #ffffff;
    height: 3px;
    border-radius: 3px;
  }
  .n-tabs-pane-wrapper {
    padding: 30px;
  }
}

.qr-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.5s ease;
}

.qr-wrapper {
  position: relative;
  width: 180px;
  height: 180px;
  margin-bottom: 24px;
}

.qr-border-box {
  width: 100%;
  height: 100%;
  background: #fff;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-expired-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #333;
  font-weight: bold;
}

.qr-tip {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.custom-form {
  padding: 10px 0;
}

.form-item {
  margin-bottom: 16px;
}

/* 原生输入框样式 */
.custom-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  font-size: 16px;
  color: #fff;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  outline: none;
  transition: all 0.3s;
  box-sizing: border-box;
}

.custom-input:focus {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
}

.custom-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* 文本域特殊样式 */
.textarea-input {
  height: auto;
  min-height: 120px;
  padding: 12px 16px;
  resize: vertical;
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 13px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #000000;
  border: none;
  border-radius: 10px;
  margin-top: 10px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
}

.login-btn:hover:not([disabled]) {
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cookie-guide {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.1);

  p {
    margin: 0 0 8px 0;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
  }

  ol {
    margin: 0;
    padding-left: 18px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    line-height: 1.6;

    li span {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
      padding: 0 4px;
      border-radius: 4px;
    }
  }
}

.message-area {
  height: 40px;
  text-align: center;
}

.msg-box {
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  display: inline-block;
  backdrop-filter: blur(10px);

  &.error {
    background: rgba(28, 28, 30, 0.2);
    color: #ffffff;
  }

  &.success {
    background: rgba(28, 28, 30, 0.2);
    color: #ffffff;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
