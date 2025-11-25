import { request, withCookie } from "@/api/request";
//登录接口

export const PhoneNumberLogin = async (params) => {
  return request({
    url: "/login/cellphone",
    params: { phone: params.phone, password: params.password},
  }).then((res) => res.data);
}
//邮箱登录
export const EmailLogin = async (params) => {
  return request({
    url: "/login",
    params: { email: params.email, password:params.password},
  }).then((res) => res.data);
}

/**
 * 发送验证码（短信/邮箱）
 * @param {Object} params - 参数对象
 * @param {string} params.phone - 手机号
 * @param {string} [params.ctcode="86"] - 国家代码，默认86
 * @returns {Promise<Object>} 返回 { code: number, data: boolean, message?: string }
 */
export const SendCaptcha = async (params) => {
  return request({
    url: "/captcha/sent",
    method: "POST",
    params: {
      phone: params.phone,
      ctcode: params.ctcode || "86",
    },
  }).then((res) => res.data);
};

/**
 * 验证验证码是否正确
 * @param {Object} params - 参数对象
 * @param {string} params.phone - 手机号
 * @param {string} params.captcha - 用户输入的验证码
 * @returns {Promise<Object>} 返回 { code: number, data: boolean, message?: string }
 */
export const VerifyCaptcha = async (params) => {
  return request({
    url: "/captcha/verify",
    method: "POST",
    params: {
      phone: params.phone,
      captcha: params.captcha,
    },
  }).then((res) => res.data);
};

/**
 * 检查是否需要验证码
 * @param {Object} params - 参数对象
 * @param {string} params.phone - 手机号
 * @returns {Promise<Object>} 返回 { code: number, data: boolean }
 */
export const CheckNeedCaptcha = async (params) => {
  return request({
    url: "/captcha/sent",
    method: "POST",
    params: {
      phone: params.phone,
    },
  }).then((res) => res.data);
};

//获取登录二维码
//获取二维码unikey，用于生成二维码
export const GetQRCodekey = async () => {
  return request({
    url: "/login/qr/key",

  }).then((res) => res.data);
}

export const GetQRCode = async (params) => {
  return request({
    url: "/login/qr/create",
    params: { key: params, qrimg: true },
  }).then((res) => res.data);
}

//二维码状态检测
export const CheckQRCodeStatus = async (params) => {
  return request({
    url: "/login/qr/check",
    params: { key: params}
  }).then((res) => res.data);
}

//登录状态
export const CheckLoginStatus = async () => {
  return request({
    url: "/login/status",
    params: withCookie(),

  }).then((res) => res.data);
}

//退出登录
export const LogOut = async () =>{
  return request({
    url: '/logout',
    params: withCookie(),
  })
}