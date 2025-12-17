import OpenAI from 'openai'

const GROQ_API_KEY = null

// 初始化客户端
const client = new OpenAI({
  apiKey: GROQ_API_KEY || null,
  // 1. 如果你在国外/开了全局代理，用官方地址：
  //baseURL: 'https://api.groq.com/openai/v1',
  baseURL: 'https://gorqserver.m15179028795-1.workers.dev/openai/v1',
  
  // 2. ⭐ 如果你在国内且没有魔法，用你的 Cloudflare Worker 地址：
  // baseURL: "https://你的worker名.你的子域名.workers.dev/openai/v1",

  dangerouslyAllowBrowser: true, // 允许在前端直接调用（个人项目没问题，生产环境建议走后端）
})

export async function getMusicRecommendation(userQuery: string) {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一个专业的音乐 DJ 助手 Polomusic AI。
          你的任务是根据用户的情绪或描述推荐歌曲。
          你只需要以json格式为我推荐歌曲，要求包含歌曲名name、歌手名artists、推荐理由reason`,
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
      // 推荐使用 Llama3-70b 或 8b，速度极快
      model: 'groq/compound-mini',
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || '抱歉，我暂时想不出来推荐什么歌...'
  } catch (error) {
    console.error('Groq API Error:', error)
    return '网络开小差了，请检查网络设置或 API Key。'
  }
}
