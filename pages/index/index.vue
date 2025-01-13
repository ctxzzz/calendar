<template>
  <view class="calendar-container">
    <view class="calendar-header">
      <custom-navbar :back="false" />
      <view class="calendar-header-wrap">
        <view
          class="location"
          @click="chooseLocation">
          <i class="iconfont rili-location"></i>
          {{ location.name }}
        </view>
        <view class="date-picker">
          <i
            class="iconfont rili-xiangzuo"
            @click="prev"></i>
          <view @click="showPicker = true">{{ activeDate }}</view>
          <i
            class="iconfont rili-xiangyou"
            @click="next"></i>
        </view>

        <view
          v-if="showCalendarBtn"
          class="calendar-btn"
          @click="toToday"
          >今</view
        >
      </view>
    </view>
    <uni-grid
      :column="7"
      class="grid-weeks"
      :showBorder="false">
      <uni-grid-item
        v-for="(item, index) in week"
        :key="item">
        <view
          class="grid-item-box grid-week-item"
          :class="{ danger: index === 6 || index === 5 }"
          >{{ item }}
        </view>
      </uni-grid-item>
    </uni-grid>
    <z-swiper
      ref="zSwiperRef"
      class="z-swaiper-wrap"
      grabCursor
      :initialSlide="2"
      direction="vertical"
      @slidePrevTransitionStart="slidePrevStart"
      @slideNextTransitionStart="slideNextStart"
      @slideChangeTransitionEnd="slideChangeEnd"
      :custom-style="{ height: height + 'px', background: '#a171e' }">
      <z-swiper-item
        v-for="item in list"
        :key="item.month">
        <Panel
          @change="onChange"
          :item="item"
          ref="panelRef"
          :holidays="holidays"
          :currentDate="currentDate"
          :activeDate="activeDate"
          :height="`${height}px`"></Panel>
      </z-swiper-item>
    </z-swiper>

    <view
      class="calendar-card"
      v-if="currentDetails">
      <view class="calendar-card-details">
        <view
          class="weather-block"
          v-if="weatherData">
          <view class="weather-temp-block">
            <view class="weather-text">
              <i
                :class="`qweather-icons qi-${weatherData.icon} weather-icon`"></i>
              <text class="weather-text">{{ weatherData.text }}</text>
              <text class="weather-temp">{{ weatherData.temp }}℃</text>
            </view>
          </view>
          <view class="weather-other-block">
            <text class="weather-other">{{ weatherData.windDir }}</text>
            <text class="weather-other">{{ weatherData.windScale }}级</text>
						<view v-if="airquality.category" class="aqi" :class="{warning: airquality.category === '良',danger: airquality.category !== '优' && airquality.category !== '良'}">AQI {{airquality && airquality.category}}</view>
          </view>
        </view>
        <view class="calendar-card-details-date">
          <view class="lunar">
            <view class="tag">农历</view>
            <view class="lunar-text">
              <text class="lunar-day"
                >{{ currentDetails.monthCN }}月{{ currentDetails.dayCN }}</text
              >
              <text class="lunar-year"
                >{{ currentDetails.yearInGanZhi }}年
                {{ currentDetails.shengxiao }}</text
              >
            </view>
          </view>
        </view>
        <view class="calendar-card-details-info">
          <view>
            <view class="badge-tag">宜</view>
            {{ currentDetails.yi.join(' ') }}
          </view>
          <view>
            <view class="badge-tag danger">忌</view>
            {{ currentDetails.ji.join(' ') }}
          </view>
        </view>
      </view>
      <view
        class="calendar-card-footer"
        v-if="countdown">
        <i class="iconfont rili-shijian1"></i>
        距离 {{ countdown.name }} 还有{{ countdown.daysBetween }}天
      </view>
    </view>
    <view class="calendar-card">
      <view class="title"
        >星座运势 <text class="date">{{ currentDate }}</text></view
      >
      <view class="container">
        <view class="container-left">
          <i :class="`xingzuo-icon iconfont rili-${xingzuo.icon}`"></i>
          <text class="xingzuo-name">{{ xingzuo.name }}</text>
          <text class="xingzuo-range">({{ xingzuo.range }})</text>
        </view>

        <view class="container-right">
          <view class="xingzuo-col"
            >综合运势
            <up-rate
              readonly
              activeColor="#f0ad4e"
              :count="xingzuo.summary_star > 5 ? xingzuo.summary_star : 5"
              v-model="xingzuo.summary_star"></up-rate>
          </view>
          <view class="xingzuo-col">幸运颜色： {{ xingzuo.lucky_color }}</view>
          <view class="xingzuo-col">幸运数字： {{ xingzuo.lucky_num }}</view>
          <view class="xingzuo-col">贵人星座： {{ xingzuo.grxz }}</view>
          <view class="xingzuo-col">吉时： {{ xingzuo.lucky_time }}</view>
          <view class="xingzuo-txt"
            ><up-icon
              name="heart-fill"
              color="#f56c6c"
              size="22"></up-icon
            >{{ xingzuo.love_txt }}</view
          >
        </view>
      </view>
    </view>
    <City ref="cityRef" />
    <up-picker
      :show="showPicker"
      ref="uPickerRef"
      :columns="columns"
      @cancel="showPicker = false"
      :defaultIndex="defaultIndex"
      @confirm="confirm"></up-picker>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import Panel from './Panel.vue';
import City from './City.vue';
import dayjs from 'dayjs';
import { Solar, Lunar, HolidayUtil } from 'lunar-javascript';
import config from '/config.js';
import { xingzuoData } from '@/assets/js/constant.js';
import { nextTick } from 'vue';

const location = ref({
  name: '蜀山',
  id: '101220109',
});

const initFlag = ref();
const zSwiperRef = ref();
const cityRef = ref();

const week = ['一', '二', '三', '四', '五', '六', '日'];
const today = dayjs().format('YYYY-MM-DD');
const currentDate = ref(today);

const activeDate = ref(today); // 点击选中的日期

const weatherData = ref({
  text: '晴',
  temp: '20',
  windScale: '2',
  windDir: '东南风',
});
const xingzuo = ref({});

const list = ref([
  {
    id: 1,
    month: dayjs().subtract(2, 'month').format('YYYY-MM'),
  },
  {
    id: 2,
    month: dayjs().subtract(1, 'month').format('YYYY-MM'),
  },
  {
    id: 3,
    month: dayjs().format('YYYY-MM'),
  },
  {
    id: 4,
    month: dayjs().add(1, 'month').format('YYYY-MM'),
  },
  {
    id: 5,
    month: dayjs().add(2, 'month').format('YYYY-MM'),
  },
]);

const loadList = (ym) => {
  const arr = [];
  for (let index = 2; index > 0; index--) {
    arr.push({
      month: dayjs(ym).subtract(index, 'month').format('YYYY-MM'),
    });
  }
  arr.push({
    month: dayjs(ym).format('YYYY-MM'),
  });
  for (let index = 1; index < 3; index++) {
    arr.push({
      month: dayjs(ym).add(index, 'month').format('YYYY-MM'),
    });
  }
  return arr;
};

const holidays = ref([]);
const getHolidays = () => {
  holidays.value = HolidayUtil.getHolidays('2025').map((item) => {
    return {
      date: item.getDay(),
      isWork: item.isWork(),
      name: item.getName(),
      holiday: item.getTarget(),
    };
  });
};

const countdown = ref();
const getCountdown = () => {
  if (current.value) {
    const daysBetween = dayjs(current.value.date).diff(dayjs(today), 'day');
    console.log(current.value);
    countdown.value = {
      ...current.value,
      name:
        current.value.festivals.length > 0
          ? current.value.showLabel
          : current.value.date,
      daysBetween,
    };
    return;
  }
  for (let index = 0; index < holidays.value.length; index++) {
    const item = holidays.value[index];
    if (!item.isWork) {
      if (dayjs(item.date).isAfter(dayjs(activeDate.value))) {
        const daysBetween = dayjs(item.holiday).diff(
          dayjs(activeDate.value),
          'day'
        );
        countdown.value = {
          ...item,
          daysBetween,
        };
        break;
      }
    }
  }
};

onMounted(() => {
  getHolidays();
  getCountdown();

  onActiveDateChange(currentDate.value);
  getConstellation();

  setTimeout(() => {
    zSwiperRef.value.swiper.slideTo(2, 0, false);
    initFlag.value = true;
  }, 0);
  getWeather();
  // #ifdef MP-WEIXIN
  getLocation();
  // #endif
});

const _getLocation = () => {
  uni.getLocation({
    success: (data) => {
      uni.request({
        url: `https://geoapi.qweather.com/v2/city/lookup?location=${data.longitude},${data.latitude}&key=${config.qweatherKey}`,
        success: (res) => {
          const result = res.data.location[0];
          location.value = {
            ...result,
          };
          getWeather();
          getAirquality();
        },
      });
    },
  });
};
const getLocation = () => {
  // #ifdef MP-WEIXIN
  uni.getSetting({
    success(res) {
      if (!res.authSetting['scope.userLocation']) {
        uni.authorize({
          scope: 'scope.userLocation',
          success() {
            _getLocation();
          },
        });
      } else {
        _getLocation();
      }
    },
  });
  // #endif
  // #ifdef H5

  uni.getLocation().then((res) => {
    uni.request({
      url: `https://geoapi.qweather.com/v2/city/lookup?location=${res.longitude},${res.latitude}&key=${config.qweatherKey}`,
      success: (res) => {
        console.log(res);
      },
    });
  });
  // #endif
};

const height = ref(322);

const slidePrevStart = (e) => {
  if (!initFlag.value) return;
  console.log('slidePrevStart');
  const activeIndex = e.activeIndex;
  if (activeIndex === 1) {
    const month = list.value[0].month;
    zSwiperRef.value.swiper.slideNext(0, false);
    list.value.unshift({
      id: list.value[0].id + 1,
      background: '#213DD3',
      month: dayjs(month).subtract(1, 'month').format('YYYY-MM'),
    });
  }
};
const slideNextStart = (e) => {
  if (!initFlag.value) return;
  console.log('slideNextStart');
  const activeIndex = e.activeIndex;
  if (activeIndex >= list.value.length - 1) {
    const month = list.value[activeIndex].month;
    list.value.push({
      id: list.value[list.value.length - 1].id + 1,
      background: '#213DD3',
      month: dayjs(month).add(1, 'month').format('YYYY-MM'),
    });
  }
};
const slideChangeEnd = (e) => {
  if (!initFlag.value) {
    initFlag.value = true;
    return;
  }
  console.log('slideChangeEnd');
  const activeIndex = e.activeIndex;
  const month = list.value[activeIndex].month;
  if (today.split('-').slice(0, 2).join('-') === month) {
    onActiveDateChange(today);
  } else {
    onActiveDateChange(`${month}-01`);
  }
};

const currentDetails = ref();
const getWeather = () => {
  const storeWeather = uni.getStorageSync('weatherData');
  if (
    storeWeather &&
    today === storeWeather.date &&
    location.value.id === storeWeather.location
  ) {
    weatherData.value = storeWeather;
    return;
  }
  uni.request({
    url: `https://devapi.qweather.com/v7/weather/now?location=${location.value.id}&key=${config.qweatherKey}`,
    success: (res) => {
      const now = res.data.now;
      weatherData.value = now;
      uni.setStorageSync('weatherData', {
        ...now,
        date: today,
        location: location.value.id,
      });
    },
  });
};
const  airquality = ref({})
const getAirquality = () => {
	const storeAirquality = 
      uni.getStorageSync('airquality', airquality)
	if (storeAirquality && dayjs().isSame(storeAirquality.timestamp, 'hour') && location.value.id === storeAirquality.locationId) {
		airquality.value = storeAirquality
		return
	}
  uni.request({
    url: `https://devapi.qweather.com/v7/air/now?location=${location.value.id}&key=${config.qweatherKey}`,
    success: (res) => {
			 airquality.value = {
				...res.data.now,
				timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
				locationId: location.value.id
			 };
      uni.setStorageSync('airquality', airquality)
    },
  });
};
const getConstellation = () => {
  const date = dayjs(today).format('MMDD');
  const storeXingzuo = uni.getStorageSync('storeXingzuo');
  if (storeXingzuo && storeXingzuo.date === today) {
    xingzuo.value = storeXingzuo;
    return;
  }
  const starRes =
    xingzuoData.find((item) => {
      const [start, end] = item.range.split('-');
      return date >= start;
    }) || xingzuoData[xingzuoData.length - 1];
  uni.request({
    url: `https://route.showapi.com/872-1?appKey=${config.apiKey}&date=${dayjs(
      date
    ).format('MMDD')}`,
    method: 'POST',
    success: (res) => {
      const data = res.data.showapi_res_body.day;
      xingzuo.value = {
        ...starRes,
        ...data,
      };
      uni.setStorageSync('storeXingzuo', {
        ...starRes,
        ...data,
        date: today,
      });
    },
  });
};

const panelRef = ref();
const activeData = ref();

const current = ref();
const onChange = (data) => {
  current.value = data;
  onActiveDateChange(data.date);
};

const onActiveDateChange = (date) => {
  activeDate.value = date;
  const [y, m, d] = date.split('-');
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const data = {
    date,
    shengxiao: lunar.getYearShengXiao(),
    monthCN: lunar.getMonthInChinese(),
    dayCN: lunar.getDayInChinese(),
    yearCN: lunar.getYearInChinese(),
    yearInGanZhi: lunar.getYearInGanZhi(),
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
  };
  currentDetails.value = data;
  getCountdown();
};

const chooseLocation = () => {
  uni.clearStorageSync();
  return;
  cityRef.value.open();
};
const showCalendarBtn = computed(() => {
  return !dayjs(today).isSame(dayjs(activeDate.value), 'month');
});
const toToday = () => {
  const index = list.value.findIndex((item) => {
    return dayjs(item.month).isSame(dayjs(today), 'month');
  });
  zSwiperRef.value.swiper.slideTo(index);
};

const showPicker = ref(false);
const startYear = 1900;
const endYear = 2175;
const yearsColumns = Array.from(
  {
    length: endYear - startYear + 1,
  },
  (_, i) => startYear + i
);

const monthColumns = Array.from(
  {
    length: 12,
  },
  (_, i) => i + 1
);
const columns = ref([yearsColumns, monthColumns]);

const defaultIndex = [
  yearsColumns.findIndex((item) => {
    return item === dayjs(today).year();
  }),
  monthColumns.findIndex((item) => {
    return item === dayjs(today).month() + 1;
  }),
];
const confirm = (e) => {
  const value = e.value;
  const toDate = `${value[0]}-${value[1]}-01`;
  const index = list.value.findIndex((item) => {
    return dayjs(item.month).isSame(dayjs(toDate), 'month');
  });
  if (index > -1) {
    zSwiperRef.value.swiper.slideTo(index);
  } else {
    loadList(value);
    list.value = [...list.value, ...loadList(value)];
    nextTick(() => {
      zSwiperRef.value.swiper.slideTo(list.value.length - 3);
    });
  }
  showPicker.value = false;
};

const next = () => {
  zSwiperRef.value.swiper.slideNext();
};
const prev = () => {
  zSwiperRef.value.swiper.slidePrev();
};
</script>

<style lang="scss">
.calendar-container {
  background: $uni-bg-color-grey;

  .calendar-header {
    background: #fff;
    width: 100%;

    .calendar-header-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30rpx;
      height: 100rpx;

      .location {
        display: flex;
        align-items: center;
        position: absolute;
        gap: 10rpx;
        left: 26rpx;
        color: $danger;
      }

      .date-picker {
        display: flex;
        align-items: center;
        gap: 26rpx;
        font-weight: 600;
        font-family: 'Times New Roman';
        font-size: 38rpx;
      }

      .calendar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #eaeaea;
        border-radius: 16rpx;
        width: 60rpx;
        height: 60rpx;
        background: $red;
        color: #fff;
        position: absolute;
        right: 20rpx;
      }
    }
  }

  .grid-weeks {
    background: #fff;

    .uni-grid-wrap {
      background: #fff;
    }

    .grid-item-box {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      padding: 10rpx;
      margin: 6rpx;
      border: 2rpx solid transparent;
      box-sizing: border-box;
    }
  }

  .z-swaiper-wrap {
    background: #fff;
  }

  .calendar-card {
    padding: 16rpx 28rpx;
    margin: 24rpx 20rpx;
    border-radius: 12rpx;
    background: #fff;

    .title {
      font-size: 40rpx;
      font-family: SimSun;
      font-weight: 600;

      .date {
        font-size: 28rpx;
        margin-left: 10rpx;
        font-family: 'Times New Roman', Times, serif;
      }
    }

    .calendar-card-details {
      position: relative;
      margin-bottom: 16rpx;

      .calendar-card-details-date {
        display: flex;
        align-items: center;
        gap: 50rpx;
        margin-bottom: 32rpx;

        .lunar {
          display: flex;
          align-items: center;
          gap: 20rpx;

          .tag {
            writing-mode: vertical-lr;
            color: #f8a324;
            border: 1px solid #f8a324;
            border-radius: 6rpx;
            font-size: 20rpx;
            padding: 4rpx 0;
            background: #f3f1ee;
          }

          .lunar-text {
            font-family: SimSun;
            display: flex;
            flex-direction: column;
            font-weight: 600;
          }

          .lunar-day {
            font-size: 36rpx;
          }
        }

        .weather {
          font-size: 40rpx;
          font-weight: 600;
          font-family: 'Times New Roman', Times, serif;
        }
      }

      .calendar-card-details-info {
        font-size: 28rpx;
        display: flex;
        flex-direction: column;
        gap: 10rpx;
        color: $font3;
      }

      .weather-block {
        position: absolute;
        right: 10rpx;
        top: -10rpx;
        display: flex;
        flex-direction: column;
        align-items: flex-end;

        .weather-temp-block {
          color: $danger;
          font-size: 26rpx;
          .weather-text {
            font-size: 30rpx;
            display: flex;
            align-items: center;
            gap: 8rpx;
          }

          .weather-temp {
            margin-left: 8rpx;
            font-size: 50rpx;
            vertical-align: baseline;
          }
        }

        .weather-other-block {
          display: flex;
          gap: 4rpx;
          align-items: center;
          font-size: 30rpx;
          color: $success;
					.aqi {
						margin-left: 4rpx;
						padding: 4rpx 12rpx;
						background: $success;
						border-radius: 24rpx;
						font-size: 28rpx;
						color: #fff;
						font-weight: 600;
						&.warning {
							background: $warning;
						}
						&.danger {
							background: $danger;
						}
					}
        }
      }
    }

    .calendar-card-footer {
      border-top: 1rpx solid #e9e9e9;
      padding-top: 16rpx;
      display: flex;
      align-items: center;
      color: #333;
      font-size: 28rpx;
      gap: 16rpx;
      color: $font3;
    }

    .container {
      display: flex;
      padding: 40rpx 0;
      gap: 20rpx;

      .container-left {
        flex: 4;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .xingzuo-icon {
          font-size: 80rpx;
          color: $uni-color-warning;
          margin-bottom: 22rpx;
        }

        .xingzuo-name {
          font-size: 40rpx;
          color: $uni-color-warning;
        }

        .xingzuo-range {
          color: $font3;
        }
      }

      .container-right {
        flex: 5;
        display: flex;
        flex-direction: column;
        font-size: 28rpx;
        font-family: Microsoft YaHei;

        .xingzuo-col {
          display: flex;
          gap: 10rpx;
          color: $font3;
        }

        .xingzuo-txt {
          color: $font3;
          margin-top: 12rpx;

          .u-icon {
            display: inline-block;
            vertical-align: middle;
          }
        }
      }
    }
  }
}

.badge-tag {
  display: inline-block;
  width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 50%;
  font-size: 24rpx;
  color: #fff;
  background: #74ccd2;
  margin-right: 10rpx;

  &.danger {
    background: #f18585;
  }
}
</style>
