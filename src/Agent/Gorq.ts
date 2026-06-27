import OpenAI from 'openai'

// API Key 应通过环境变量或配置文件提供，不要硬编码
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || null

// 初始化客户端
const client = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://gorqserver.m15179028795-1.workers.dev/openai/v1',
  dangerouslyAllowBrowser: true,
})

// 未配置 API Key 时的提示
if (!GROQ_API_KEY) {
  console.warn('Groq API Key 未配置，AI 推荐功能将不可用。请在 .env 文件中设置 VITE_GROQ_API_KEY')
}

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
