<template>
  <div class="page-wrapper">
    <div class="comment-container" @scroll="handleScroll">
      <div class="song-info-card" v-if="songDetail">
        <div class="info-bg" :style="{ backgroundImage: `url(${songDetail.al.picUrl})` }"></div>
        <div class="info-content">
          <div class="cover-wrap">
            <img :src="songDetail.al.picUrl + '?param=120y120'" loading="lazy" />
          </div>
          <div class="text-wrap">
            <div class="song-title">{{ songDetail.name }}</div>
            <div class="artist-row">
              歌手：
              <span v-for="(ar, index) in songDetail.ar" :key="ar.id">
                {{ ar.name }}<span v-if="index as any < songDetail.ar.length - 1"> / </span>
              </span>
            </div>
            <div class="album-row">专辑：{{ songDetail.al.name }}</div>
          </div>
        </div>
      </div>

      <div class="comment-header">
        <h2>
          评论 <span class="count">({{ totalCount }})</span>
        </h2>
      </div>

      <div v-if="isLoading && offset === 0" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载评论中...</p>
      </div>

      <div v-else class="comment-content">
        <div v-if="hotComments.length > 0" class="section">
          <h3 class="section-title">精彩评论</h3>
          <div class="comment-list">
            <div v-for="item in hotComments" :key="item.commentId" class="comment-item">
              <div class="avatar">
                <img :src="item.user.avatarUrl + '?param=50y50'" loading="lazy" />
              </div>
              <div class="content">
                <div class="user-row">
                  <span class="nickname">{{ item.user.nickname }}</span>
                  <span v-if="item.user.vipType > 0" class="vip-tag">VIP</span>
                </div>
                <div class="text">{{ item.content }}</div>
                <div v-if="item.beReplied && item.beReplied.length > 0" class="reply-box">
                  <span class="at">@{{ item.beReplied[0].user.nickname }}: </span>
                  {{ item.beReplied[0].content }}
                </div>
                <div class="info-row">
                  <span class="time">{{ formatDate(item.time) }}</span>
                  <div class="actions">
                    <span class="action-btn" @click="handleReply(item)">回复</span>
                    <span class="action-btn like">
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                        ></path>
                      </svg>
                      {{ item.likedCount }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">最新评论</h3>
          <div class="comment-list">
            <div v-for="item in comments" :key="item.commentId" class="comment-item">
              <div class="avatar">
                <img :src="item.user.avatarUrl + '?param=50y50'" loading="lazy" />
              </div>
              <div class="content">
                <div class="user-row">
                  <span class="nickname">{{ item.user.nickname }}</span>
                </div>
                <div class="text">{{ item.content }}</div>

                <div v-if="item.beReplied && item.beReplied.length > 0" class="reply-box">
                  <span class="at">@{{ item.beReplied[0].user.nickname }}: </span>
                  {{ item.beReplied[0].content }}
                </div>

                <div class="info-row">
                  <span class="time">
                    {{ formatDate(item.time) }}
                    <span v-if="item.ipLocation.location" class="location">
                      · {{ item.ipLocation.location }}</span
                    >
                  </span>
                  <div class="actions">
                    <span class="action-btn" @click="handleReply(item)">回复</span>
                    <span class="action-btn like">
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                        ></path>
                      </svg>
                      {{ item.likedCount }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-state">
          <div v-if="isLoadingMore" class="loading-more">
            <div class="loading-spinner small"></div>
            正在加载...
          </div>
          <div v-if="!hasMore && comments.length > 0" class="no-more">没有更多评论了</div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <div v-if="replyCommentId" class="reply-tag">
        回复: {{ replyNickname }}
        <span class="close" @click="cancelReply">×</span>
      </div>
      <div class="input-wrapper">
        <input
          v-model="commentText"
          type="text"
          :placeholder="replyCommentId ? `回复 ${replyNickname}:` : '发表评论...'"
          @keyup.enter="submitComment"
          ref="inputRef"
        />
        <button class="send-btn" @click="submitComment" :disabled="!commentText.trim()">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GetMusicComment, GetMusicDetail, SendComment } from '@/api/GetMusic' // 引入 SendComment
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Player } from '@/stores'
import { getSongById } from '@/electron/db'
const route = useRoute()
const player = Player()
const songid = ref(null)
// 接口定义
export interface CommentUser {
  userId: number
  nickname: string
  avatarUrl: string
  vipType: number
}

export interface CommentItem {
  user: CommentUser
  beReplied: any[]
  content: string
  time: number
  likedCount: number
  commentId: number
  ipLocation: {
    location: string
  }
}

// 状态定义
watch(
  () => route.params.id,
  async (newid) => {
    if (!newid) return
    const rawId = Array.isArray(newid) ? newid[0] : newid

    if (player.isLocalSong(rawId)) {
      const song = await window.electronAPI.getLocalSongById(rawId)
      songid.value = song.song?.neteaseId
    } else {
      songid.value = rawId as any
    }
    console.log(songid.value)
  },
  { immediate: true },
)

const comments = ref<CommentItem[]>([])
const hotComments = ref<CommentItem[]>([])
const totalCount = ref(0)
const songDetail = ref<any>(null)

// 分页状态
const offset = ref(0)
const limit = 50
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)

// 评论输入状态
const commentText = ref('')
const replyCommentId = ref<number | null>(null)
const replyNickname = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// 获取歌曲详情
const fetchSongDetail = async () => {
  const id = songid.value
  console.log('songid', songid)
  if (!id) return
  try {
    const res = await GetMusicDetail({ ids: id })
    if (res.songs && res.songs.length > 0) {
      songDetail.value = res.songs[0]
    }
  } catch (error) {
    console.error('获取歌曲详情失败', error)
  }
}

// 获取评论列表
const fetchComments = async (isLoadMore = false) => {
  const id = songid.value
  if (!id) return

  if (isLoadMore) {
    isLoadingMore.value = true
  } else {
    isLoading.value = true
    comments.value = []
    hotComments.value = []
    offset.value = 0
    hasMore.value = true
  }

  try {
    const res: any = await GetMusicComment({
      id: Number(id),
      limit: limit,
      offset: offset.value,
    })

    totalCount.value = res.total

    if (offset.value === 0 && res.hotComments) {
      hotComments.value = res.hotComments
    }

    if (res.comments && res.comments.length > 0) {
      comments.value = isLoadMore ? [...comments.value, ...res.comments] : res.comments
      offset.value += limit
    } else {
      hasMore.value = false
    }

    if (!res.more) {
      hasMore.value = false
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// 点击回复
const handleReply = (item: CommentItem) => {
  replyCommentId.value = item.commentId
  replyNickname.value = item.user.nickname
  // 聚焦输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 取消回复
const cancelReply = () => {
  replyCommentId.value = null
  replyNickname.value = ''
  commentText.value = ''
}

// 发送评论
const submitComment = async () => {
  if (!commentText.value.trim()) return

  // 1: 发送, 2: 回复
  const t = replyCommentId.value ? 2 : 1

  try {
    const res: any = await SendComment({
      t: t,
      type: 0, // 0 代表歌曲
      id: Number(songid.value),
      content: commentText.value,
      commentId: Number(replyCommentId.value) || undefined,
    })

    if (res.code === 200) {
      // 成功后清空状态并刷新列表
      commentText.value = ''
      replyCommentId.value = null
      replyNickname.value = ''

      // 简单提示（你可以换成你项目里的 Toast 组件）
      console.log('发送成功')

      // 重新加载评论列表（显示最新评论）
      // 注意：网易云API有缓存，可能不会立刻显示，实际项目中通常手动把新评论unshift到列表顶部
      setTimeout(() => {
        fetchComments(false)
      }, 500)
    } else {
      console.error('发送失败', res)
    }
  } catch (error) {
    console.error('发送评论出错', error)
    alert('发送失败，请稍后重试或检查登录状态')
  }
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollHeight - scrollTop - clientHeight < 100) {
    if (!isLoadingMore.value && hasMore.value && !isLoading.value) {
      fetchComments(true)
    }
  }
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')

  if (year === now.getFullYear()) {
    return `${month}月${day}日 ${hour}:${minute}`
  }
  return `${year}年${month}月${day}日`
}

watch(
  () => songid.value,
  (newId) => {
    if (newId) {
      fetchSongDetail()
      fetchComments(false)
      cancelReply() // 切换歌曲时清除回复状态
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
$text-main: #e0e0e0;
$text-sub: #888888;
$border-color: rgba(255, 255, 255, 0.08);
$accent: #1c1c1e; // 使用你项目的主题色
$bg-color: #121212;
$input-bg: #2a2a2a;

.page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.comment-container {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto;
  padding: 20px 30px 80px 30px; /* 底部留白给输入栏 */
  color: $text-main;
  box-sizing: border-box;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
  }
}

/* --- 输入栏样式 --- */
.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 15px 30px;
  border-radius: 10px;
  background-color: rgba($bg-color, 0.5);
  backdrop-filter: blur(10px);
  border-top: 1px solid $border-color;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .reply-tag {
    font-size: 12px;
    color: $text-sub;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 4px;
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 6px;

    .close {
      cursor: pointer;
      font-size: 14px;
      &:hover {
        color: $text-main;
      }
    }
  }

  .input-wrapper {
    display: flex;
    gap: 12px;

    input {
      flex: 1;
      height: 40px;
      background-color: $input-bg;
      border: 1px solid transparent;
      border-radius: 20px;
      padding: 0 20px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: $accent;
        background-color: lighten($input-bg, 5%);
      }
      &::placeholder {
        color: #666;
      }
    }

    .send-btn {
      height: 40px;
      padding: 0 24px;
      border-radius: 20px;
      background-color: $accent;
      color: #fff;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: #444;
      }
      &:hover:not(:disabled) {
        opacity: 0.9;
      }
    }
  }
}

/* --- 原有样式保持不变 --- */
.song-info-card {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  .info-bg {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background-size: cover;
    background-position: center;
    filter: blur(40px) brightness(0.5);
    z-index: 0;
  }

  .info-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 24px;
    gap: 20px;
  }

  .cover-wrap {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .text-wrap {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;

    .song-title {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
    }

    .artist-row,
    .album-row {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.comment-header {
  margin-bottom: 20px;
  h2 {
    font-size: 20px;
    font-weight: 700;
    .count {
      font-size: 14px;
      color: $text-sub;
      font-weight: normal;
      margin-left: 5px;
    }
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 30px 0 15px;
  color: #fff;
}

.comment-item {
  display: flex;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid $border-color;

  &:last-child {
    border-bottom: none;
  }

  .avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .user-row {
      display: flex;
      align-items: center;
      gap: 8px;
      .nickname {
        font-size: 13px;
        color: #85b9e6;
        cursor: pointer;
        &:hover {
          color: lighten(#85b9e6, 10%);
        }
      }
      .vip-tag {
        font-size: 10px;
        background: #333;
        padding: 0 4px;
        border-radius: 2px;
        color: #ffd700;
      }
    }

    .text {
      font-size: 14px;
      line-height: 1.6;
      color: $text-main;
      white-space: pre-wrap;
    }

    .reply-box {
      background: rgba(255, 255, 255, 0.05);
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 13px;
      color: #ccc;
      margin-top: 4px;
      .at {
        color: #85b9e6;
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      font-size: 12px;
      color: $text-sub;

      .actions {
        display: flex;
        gap: 15px;

        .action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          &:hover {
            color: $text-main;
          }

          &.like:hover {
            color: #ff4d4f;
          }
        }
      }
    }
  }
}

.footer-state {
  padding: 30px 0;
  text-align: center;
  color: $text-sub;
  font-size: 13px;
}

.loading-state {
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: $text-sub;
  gap: 10px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid $accent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  &.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
    display: inline-block;
    vertical-align: middle;
    margin-right: 8px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
