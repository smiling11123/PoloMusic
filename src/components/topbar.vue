<template >
    
    <div class="topbar">
        
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/musichub">音乐库</RouterLink>
        <RouterLink to="/mypage">我的</RouterLink>
    </div>
    <div>
        <RouterView />
    </div>
</template>

<script>
import { RouterLink, RouterView } from 'vue-router';
</script>

<style>
    .topbar{
        display: flex;
        justify-content: center;
        background-color: black;
        gap: 20vh;
        height: 50px;
    }
</style>