// src/api/MatchService.ts
import { GetMusicLyric, GetWordMusicLyric } from './GetMusic'
import { request, withCookie } from './request' // 确保路径正确

export interface MatchedMeta {
  id: number
  neteaseId: number
  title: string
  artist: string
  album: string
  coverUrl: string
  duration: number
  lyric: string
  Tlyric: string
  yrc: string
  Tyrc: string
  Romaji: string
}

// --- 配置：黑名单关键词 ---
// 如果网易云歌名包含这些词，但本地不包含，则视为不匹配
const BLOCK_KEYWORDS = [
  '伴奏',
  '翻唱',
  'Cover',
  'Instrumental',
  'Karaoke',
  'Remix',
  'DJ',
  'Live', // 如果你不想要现场版，可以加上这个
]

// --- 工具：字符串标准化 ---
// 转小写，去除括号内容、后缀、空格、特殊符号
function normalize(str: string = ''): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/\(.*\)|\[.*\]|【.*】/g, '') // 去除括号 (Live), (Remix) 等用于模糊比对
    .replace(/\.mp3|\.flac|\.wav|\.m4a|\.ogg/gi, '') // 去除后缀
    .replace(/\s+/g, '') // 去除空格
    .replace(/[^\w\u4e00-\u9fa5]/g, '') // 只保留字母、数字、汉字
}

/**
 * 步骤 1: 获取歌手准确 ID
 */
async function getArtistId(artistName: string): Promise<number | null> {
  try {
    const params = withCookie({
      keywords: artistName,
      type: 100, // 100 = 歌手
      limit: 3,
    })

    const res = await request.get('/search', { params })
    const artists = res.data?.result?.artists || res.data?.body?.result?.artists || []

    if (!artists || artists.length === 0) return null

    // 优先完全匹配
    const normalizedTarget = normalize(artistName)
    const exact = artists.find((a: any) => normalize(a.name) === normalizedTarget)

    return exact ? exact.id : artists[0].id
  } catch (e) {
    console.warn('Get artist ID failed:', e)
    return null
  }
}

/**
 * 核心校验逻辑：判定是否匹配
 * @param local 本地信息
 * @param remote 网易云信息
 * @param targetArtistId 目标歌手ID
 */
function isStrictMatch(local: any, remote: any, targetArtistId: number | null): boolean {
  const rawRemoteName = remote.name || ''
  const rawLocalTitle = local.title || ''

  // --- 1. 黑名单关键词过滤 (新增逻辑) ---
  // 逻辑：如果远程歌名有“伴奏”，但本地没有，那就不是同一首
  for (const kw of BLOCK_KEYWORDS) {
    // 忽略大小写比较
    const remoteHas = rawRemoteName.toLowerCase().includes(kw.toLowerCase())
    const localHas = rawLocalTitle.toLowerCase().includes(kw.toLowerCase())

    if (remoteHas && !localHas) {
      // 远程是伴奏/翻唱，本地不是 -> 拒绝
      return false
    }
  }

  // --- 2. 歌手一致性校验 ---
  if (targetArtistId) {
    const hasArtist =
      remote.ar?.some((a: any) => a.id === targetArtistId) ||
      remote.artists?.some((a: any) => a.id === targetArtistId)
    if (!hasArtist) return false
  }

  // --- 3. 时长校验 (误差 < 3秒) ---
  const diff = Math.abs(remote.dt - local.duration * 1000)
  if (diff > 3000) return false

  // --- 4. 歌名模糊校验 ---
  const localNorm = normalize(rawLocalTitle)
  const remoteNorm = normalize(rawRemoteName)

  // 互相包含或相等
  return localNorm === remoteNorm || remoteNorm.includes(localNorm)
}

/**
 * 主流程：带 Cookie、分页、黑名单过滤
 */
export async function findBestMatch(localInfo: {
  title: string
  artist: string
  album?: string
  duration: number
}): Promise<MatchedMeta | null> {
  const { artist, title } = localInfo
  const searchKeyword = `${artist} ${title}`

  console.log(`[Match] Searching: "${searchKeyword}"`)

  // 1. 获取歌手 ID (用于过滤翻唱)
  const targetArtistId = await getArtistId(artist)

  // 分页设置
  const MAX_PAGES = 5
  const LIMIT = 30

  // 2. 分页循环
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * LIMIT

    try {
      const params = withCookie({
        keywords: searchKeyword,
        type: 1, // 单曲
        limit: LIMIT,
        offset: offset,
      })

      // 使用 cloudsearch 确保能搜到灰歌
      const res = await request.get('/cloudsearch', { params })
      const songs = res.data?.result?.songs || res.data?.body?.result?.songs

      if (!songs || songs.length === 0) break

      // 3. 遍历当前页
      for (const song of songs) {
        if (isStrictMatch(localInfo, song, targetArtistId)) {
          let lyric = null
          let yrc = null
          let Tlyric = null
          let Tyrc = null
          let Romaji = null
          let lyricRes = await GetMusicLyric(song.id)
          let lrcRes = await GetWordMusicLyric(song.id)
          lyric = lyricRes.lrc?.lyric || null
          Tlyric = lyricRes.tlyric?.lyric || null
          yrc = lrcRes.yrc?.lyric || null
          Tyrc = lrcRes.ytlrc?.lyric || null
          Romaji = lrcRes.romalrc?.lyric || null
          console.log(`[Match] ✅ Match Found: ${song.name} (ID: ${song.id})`)
          return {
            id: song.id,
            neteaseId: song.id,
            title: song.name,
            artist: song.ar?.[0]?.name || song.artists?.[0]?.name,
            album: song.al?.name || song.album?.name,
            coverUrl: song.al?.picUrl || song.album?.picUrl,
            duration: song.dt,
            lyric: lyric,
            Tlyric: Tlyric,
            yrc: yrc,
            Tyrc: Tyrc,
            Romaji: Romaji
          }
        }
      }

      // 当前页没找到，继续下一页...
    } catch (e) {
      console.warn(`[Match] Error at page ${page + 1}:`, e)
    }
  }

  console.log(`[Match] ❌ Failed after ${MAX_PAGES} pages.`)
  return null
}
