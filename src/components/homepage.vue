<template>
  <div class="main">
    <h2 class="section-title">我的</h2>
    <div class="cards-grid">
      <div class="card daily-card" v-if="UserInfo.backgroundUrl">
        <div class="bg-image" :style="{ backgroundImage: `url(${UserInfo.backgroundUrl})` }"></div>
        
        <!-- 用户头像容器 -->
        <div class="avatar-container">
          <img 
            v-if="UserInfo.avatarUrl" 
            :src="UserInfo.avatarUrl" 
            alt="用户头像"
            class="user-avatar"
          />
        </div>

        <!-- 可选：添加用户昵称 -->
        <div class="user-info">
          <h3>{{ UserInfo.nickname || '用户名' }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { userInfo } from '@/stores/userInfo'
const UserInfo = userInfo()
</script>

<style scoped lang="scss">
.main {
  padding: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  user-select: none;
}
.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}
.cards-grid {
  display: grid;
  gap: 24px;
  width: 100%;
}

.daily-card {
  position: relative;
  display: flex;
  flex-direction: column; // 改为垂直布局
  align-items: center; // 内容居中
  justify-content: center; // 垂直居中
  width: 100%;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  // 渐变遮罩
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.7) 100%);
    z-index: 1;
  }

  .bg-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transition: transform 0.5s ease;
    z-index: 0;
  }

  // 头像容器
  .avatar-container {
    position: relative;
    z-index: 2;
    margin-bottom: 12px; // 与文字保持距离
  }

  // 用户头像
  .user-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
  }

  // 用户信息
  .user-info {
    position: relative;
    z-index: 2;
    text-align: center;
    
    h3 {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
  }

  // 悬浮效果
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

    .bg-image {
      transform: scale(1.05);
    }

    .user-avatar {
      transform: scale(1.1); // 头像也放大
    }
  }
}
</style>