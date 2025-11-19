<template>
  <div class="login-container">
    <n-card class="login-card" :bordered="false" size="large">
      <n-tabs type="line" animated v-model:value="activeTab">
        <!-- 二维码登录 -->
        <n-tab-pane name="qr" tab="二维码登录">
          <div class="qr-login">
            <div class="qr-wrapper">
              <img 
                v-if="qrImg" 
                :src="qrImg" 
                alt="扫码登录"
                class="qr-image"
                @click="refreshQR"
              />
              <n-spin v-else size="large" />
            </div>
            <p class="qr-tip">
              {{ qrStatusText }}
            </p>
            <n-button 
              v-if="qrExpired" 
              type="primary" 
              size="small" 
              @click="refreshQR"
              class="refresh-btn"
            >
              刷新二维码
            </n-button>
          </div>
        </n-tab-pane>

        <!-- 手机号登录 -->
        <n-tab-pane name="phone" tab="手机号登录">
          <n-form
            ref="formRef"
            :model="formValue"
            :rules="rules"
            label-placement="left"
            label-width="auto"
            require-mark-placement="right-hanging"
            class="phone-form"
          >
            <n-form-item path="phone" label="手机号">
              <n-input
                v-model:value="formValue.phone"
                placeholder="请输入手机号"
                maxlength="11"
              />
            </n-form-item>
            <n-form-item path="password" label="密码">
              <n-input
                v-model:value="formValue.password"
                type="password"
                placeholder="请输入密码"
                show-password-on="mousedown"
              />
            </n-form-item>
            <n-form-item>
              <n-button
                type="primary"
                size="large"
                :loading="loading"
                :disabled="!formValue.phone || !formValue.password"
                @click="handlePhoneLogin"
                class="login-btn"
              >
                登录
              </n-button>
            </n-form-item>
          </n-form>
        </n-tab-pane>

        <!-- Cookie 登录（新增） -->
        <n-tab-pane name="cookie" tab="Cookie登录">
          <n-form
            ref="cookieFormRef"
            :model="cookieFormValue"
            :rules="cookieRules"
            label-placement="left"
            label-width="auto"
            class="cookie-form"
          >
            <n-form-item 
              path="cookie" 
              label="Cookie"
              :show-feedback="false"
            >
              <n-input
                v-model:value="cookieFormValue.cookie"
                type="textarea"
                placeholder="请粘贴网易云音乐Cookie（需包含 MUSIC_U 字段）"
                :rows="6"
                show-count
                maxlength="2000"
              />
            </n-form-item>
            
            <n-alert type="info" :show-icon="false" style="margin-bottom: 15px;">
              <template #header>如何获取Cookie？</template>
              <ol style="margin: 8px 0 0 20px; font-size: 12px;">
                <li>登录网易云音乐网页版</li>
                <li>按 F12 打开开发者工具</li>
                <li>切换到 Application/Storage 标签</li>
                <li>找到 Cookie 中的 MUSIC_U 字段</li>
                <li>复制完整的 Cookie 字符串</li>
              </ol>
            </n-alert>

            <n-form-item>
              <n-button
                type="primary"
                size="large"
                :loading="cookieLoading"
                :disabled="!cookieFormValue.cookie"
                @click="handleCookieLogin"
                class="login-btn"
              >
                验证并登录
              </n-button>
            </n-form-item>
          </n-form>
        </n-tab-pane>
      </n-tabs>

      <!-- 错误提示 -->
      <n-alert 
        v-if="errorMsg" 
        type="error" 
        :show-icon="false"
        closable
        @close="errorMsg = ''"
        class="error-alert"
      >
        {{ errorMsg }}
      </n-alert>

      <!-- 登录成功提示 -->
      <n-alert 
        v-if="successMsg" 
        type="success" 
        :show-icon="false"
        class="success-alert"
      >
        {{ successMsg }}
      </n-alert>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { request } from '@/api/request'
import type { AxiosResponse } from 'axios'
import { CheckLoginStatus } from '@/api/Login'

// 定义接口类型（保持原有）
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

// 二维码登录状态（保持原有）
const qrImg = ref<string>('')
const qrKey = ref<string>('')
const qrStatusText = ref<string>('请使用网易云音乐APP扫码登录')
const qrExpired = ref<boolean>(false)
const checkTimer = ref<number | null>(null)

// 手机号登录表单（保持原有）
const formRef = ref<FormInst | null>(null)
const loading = ref<boolean>(false)
const formValue = reactive({
  phone: '',
  password: ''
})
const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

// Cookie 登录表单（新增）
const cookieFormRef = ref<FormInst | null>(null)
const cookieLoading = ref<boolean>(false)
const cookieFormValue = reactive({
  cookie: ''
})
const cookieRules: FormRules = {
  cookie: [
    { required: true, message: '请输入Cookie', trigger: 'blur' },
    { 
      validator: (rule: any, value: string) => {
        return value.includes('MUSIC_U=') || new Error('Cookie必须包含 MUSIC_U 字段')
      }, 
      trigger: 'blur' 
    }
  ]
}

// 提示信息（保持原有）
const errorMsg = ref<string>('')
const successMsg = ref<string>('')

// 获取二维码（保持原有）
const getQRCode = async () => {
  try {
    qrExpired.value = false
    qrImg.value = ''
    qrStatusText.value = '正在获取二维码...'
    
    const keyRes = await request.get<any, AxiosResponse<QRKeyResponse>>('/login/qr/key')
    qrKey.value = keyRes.data.data.unikey
    
    const qrRes = await request.get<any, AxiosResponse<QRCreateResponse>>('/login/qr/create', {
      params: { key: qrKey.value, qrimg: true }
    })
    qrImg.value = qrRes.data.data.qrimg
    
    startCheckQRStatus()
  } catch (error) {
    errorMsg.value = '获取二维码失败，请重试'
    qrStatusText.value = '获取失败'
  }
}

// 轮询检测扫码状态（保持原有）
const startCheckQRStatus = () => {
  qrStatusText.value = '请使用网易云音乐APP扫码登录'
  
  checkTimer.value = window.setInterval(async () => {
    if (!qrKey.value) return
    
    try {
      const statusRes = await request.get<any, AxiosResponse<QRCheckResponse>>('/login/qr/check', {
        params: { key: qrKey.value }
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
          await request.post('/activate/initProfile', {}, {
            headers: { Cookie: cookie }
          })
          
          successMsg.value = '登录成功，正在跳转...'
          
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

// 清除定时器（保持原有）
const clearCheckTimer = () => {
  if (checkTimer.value) {
    clearInterval(checkTimer.value)
    checkTimer.value = null
  }
}

// 刷新二维码（保持原有）
const refreshQR = () => {
  clearCheckTimer()
  getQRCode()
}

// 手机号登录（保持原有）
const handlePhoneLogin = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true
    errorMsg.value = ''
    
    const res = await request.get<any, AxiosResponse<PhoneLoginResponse>>('/login/cellphone', {
      params: { phone: formValue.phone, password: formValue.password }
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
        router.replace('/')
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

// Cookie 登录（新增）
const handleCookieLogin = async () => {
  try {
    await cookieFormRef.value?.validate()
    cookieLoading.value = true
    errorMsg.value = ''
    
    const cookie = cookieFormValue.cookie.trim()
    
    // 1. 验证Cookie格式
    if (!cookie.includes('MUSIC_U=')) {
      throw new Error('Cookie必须包含 MUSIC_U 字段')
    }
    
    // 2. 测试Cookie有效性
    const testRes = await request.get<any, AxiosResponse<UserAccountResponse>>('/user/account', {
      headers: { Cookie: cookie }
    })
    
    if (testRes.data.code === 200) {
      // 3. 保存Cookie
      localStorage.setItem('neteaseCookie', cookie)
      const status = await CheckLoginStatus()
      console.log(status)
      // 4. 保存用户信息
      if (status.data.profile) {
        localStorage.setItem('userProfile', JSON.stringify(status.data.profile))
      }
      
      successMsg.value = `登录成功！欢迎 ${testRes.data.profile?.nickname || '用户'}`
      
      // 5. 跳转到首页
      //setTimeout(() => {
        //router.replace('/')
        //window.location.reload()
      //}, 1500)
    } else {
      throw new Error('Cookie无效或已过期')
    }
  } catch (error: any) {
    errorMsg.value = error.message || 'Cookie验证失败'
  } finally {
    cookieLoading.value = false
  }
}

// 生命周期（保持原有）
onMounted(() => {
  //getQRCode()
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.qr-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.qr-wrapper {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 20px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-tip {
  color: #666;
  font-size: 14px;
  text-align: center;
  margin: 0;
}

.refresh-btn {
  margin-top: 10px;
}

.phone-form, .cookie-form {
  padding: 20px 0;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}

.error-alert,
.success-alert {
  margin-top: 20px;
  border-radius: 8px;
}

/* Cookie 登录样式优化 */
.cookie-form {
  :deep(.n-input__textarea-el) {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
  }
}
</style>