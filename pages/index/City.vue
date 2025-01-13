<template>
  <u-popup
    :show="visible"
    mode="right"
    :customStyle="{ width: '90vw' }"
    @close="close"
    @open="open">
    <!-- <uni-indexed-list
      :options="list"
      :showSelect="false"
      @click="bindClick"></uni-indexed-list> -->
  </u-popup>
</template>

<script>
import config from '/config.js';
export default {
  name: 'City',
  props: {},
  data() {
    return {
      visible: false,
      list: [],
      cityList: [],
      keyword: '',
    };
  },
  mounted() {
    // this.queryCity()
  },
  methods: {
    // 关闭窗口
    close() {
      this.visible = false;
    },
    open() {
      this.visible = true;
    },
    bindClick(e) {
      console.log('点击item，返回数据' + JSON.stringify(e));
    },
    queryCity() {
      uni.request({
        url: `https://geoapi.qweather.com/v2/city/lookup?location=${this.keyword}&key=${config.qweatherKey}`,
        success: (res) => {
          console.log(res);
        },
      });
    },
  },
};
</script>
