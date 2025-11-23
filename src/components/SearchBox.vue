<!-- SearchBox.vue -->
<template>
  <div class="search-container">
    <span class="search-icon"></span>
    <input
      type="text"
      class="search-box"
      placeholder="搜索"
      :value="modelValue"
      @input="onInput"
      @keyup.enter="onSearch"
    />
    <button v-if="modelValue" class="clear-btn" @click="clear">✕</button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'search'])

const onInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const onSearch = () => {
  if (props.modelValue.trim()) {
    emit('search', props.modelValue)
  }
}

const clear = () => {
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<style scoped>
.search-container {
  position: relative;
  width: 200px;
}

.search-box {
  width: 100%;
  height: 30px;
  padding: 0 40px 0 40px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  color: #333;
  outline: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-box:focus {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-box::placeholder {
  color: #999;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #000000;
  font-size: 16px;
  pointer-events: none;
}

.clear-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.1);
  border: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-size: 12px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 响应式 */
@media (max-width: 768px) {
  .search-container {
    width: 200px;
  }

  .navbar {
    padding: 15px 20px;
  }
}
</style>
