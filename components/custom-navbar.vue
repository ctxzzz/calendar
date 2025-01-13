<template>
  <view
    class="custom-nav-bar"
    :style="{ height: height }">
    <text
      class="back-button"
      v-if="back"
      @click="goBack"
      >返回</text
    >
    <text class="title">{{ title }}</text>
    <!-- 其他导航栏元素 -->
  </view>
</template>
<script>
export default {
  props: {
    back: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      height: '0', // 根据需要调整高度
    };
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
  },
  mounted() {
    const windowInfo = wx.getWindowInfo();
    this.height = windowInfo.statusBarHeight * 2 + 'px';
  },
};
</script>
<style>
.custom-nav-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 44px;
  /* 根据需要调整高度 */
  background-color: trans;
  /* 导航栏背景色 */
}

.back-button {
  /* 返回按钮样式 */
}

.title {
}
</style>
