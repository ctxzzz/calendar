<template>
  <view
    class="month-panel"
    :style="[getStyle()]">
    <uni-grid
      :column="7"
      @change="handleGridClick"
      :showBorder="false">
      <uni-grid-item
        v-for="(item, index) in dataList"
        :index="index"
        :key="item.date">
        <view
          class="grid-item-box"
          :data-date="item.date"
          :class="[
            {
              'out-month': item.prev || item.next,
              holiday: item.isHoliday && !item.isWork,
              active: item.date === activeDate,
              current: currentDate === item.date,
            },
          ]">
          <view class="text">{{ item.dateLabel }}</view>
          <view class="text lunar-text">{{ item.showLabel }}</view>

          <view
            v-if="item.isHoliday"
            class="grid-dot">
            <uni-badge
              :custom-style="{
                'background-color': item.isWork ? '#e6a23c' : '#f56c6c',
              }"
              :text="item.isWork ? '班' : '休'" />
          </view>

          <view
            v-if="item.date === today"
            class="grid-dot">
            <uni-badge
              :custom-style="{
                'background-color': '#409eff',
              }"
              text="今" />
          </view>
        </view>
      </uni-grid-item>
    </uni-grid>
  </view>
</template>

<script setup>
import dayjs from 'dayjs';
import { Solar, Lunar, HolidayUtil } from 'lunar-javascript';
import { computed, ref, watch } from 'vue';

const props = defineProps({
  item: {
    type: [Object, String],
    default: () => {},
  },
  height: {
    type: String,
    default: '300rpx',
  },
  customStyle: {
    type: Object,
    default: () => {},
  },
  holidays: {
    type: Array,
    default: () => [],
  },
  currentDate: {
    type: String,
    default: '',
  },
  activeDate: {
    type: String,
    default: '',
  },
});

const getStyle = () => {
  return {
    height: props.height,
    ...props.customStyle,
  };
};

const today = dayjs().format('YYYY-MM-DD');

function getLunar(ymd) {
  const [y, m, d] = ymd.split('-');
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const festivals = [...solar.getFestivals(), ...lunar.getFestivals()];
  // const festival = festivals[0]
  return [solar.getLunar().getDayInChinese(), festivals];
}

const dataList = computed(() => {
  const arr = [];
  const month = props.item.month;
  const start = `${month}-01`;
  const daysInMonth = dayjs(month).daysInMonth();
  for (let i = 0; i < daysInMonth; i++) {
    arr.push(dayjs(start).add(i, 'day').format('YYYY-MM-DD'));
  }
  const list = arr.map((item) => {
    const [lunarDateLabel, festivals] = getLunar(item);
    const holiday = props.holidays.find((h) => h.date === item);
    const f = festivals && festivals[0];
    return {
      date: item,
      dateLabel: dayjs(item).format('DD'),
      lunarDateLabel,
      festivals,
      showLabel: f && f.length < 3 ? f : lunarDateLabel,
      isHoliday: !!holiday,
      isWork: holiday && holiday.isWork,
      holiday: holiday,
    };
  });

  const unshiftList = [];
  const pushList = [];

  const _startDate = list[0].date;
  let _startDay = dayjs(_startDate).day();
  _startDay = _startDay === 0 ? 7 : _startDay - 1;
  for (let index = 0; index < _startDay; index++) {
    const date = dayjs(_startDate)
      .subtract(index + 1, 'day')
      .format('YYYY-MM-DD');
    const holiday = props.holidays.find((h) => h.date === date);
    const [lunarDateLabel, festivals] = getLunar(date);
    const f = festivals && festivals[0];
    unshiftList.unshift({
      date,
      dateLabel: dayjs(date).format('DD'),
      lunarDateLabel,
      festivals,
      showLabel: f && f.length < 3 ? f : lunarDateLabel,
      prev: true,
      isHoliday: !!holiday,
      isWork: holiday && holiday.isWork,
      holiday: holiday,
    });
  }
  const _endDate = list[list.length - 1].date;
  // let _endDay = dayjs(_endDate).day();
  // _endDay = _endDay === 0 ? 7 : _endDay - 1;
  for (let index = 0; index < 42 - list.length - unshiftList.length; index++) {
    const date = dayjs(_endDate)
      .add(index + 1, 'day')
      .format('YYYY-MM-DD');
    const holiday = props.holidays.find((h) => h.date === date);
    const [lunarDateLabel, festivals] = getLunar(date);
    const f = festivals && festivals[0];
    pushList.push({
      date,
      dateLabel: dayjs(date).format('DD'),
      lunarDateLabel,
      festivals,
      showLabel: f && f.length < 3 ? f : lunarDateLabel,
      next: true,
      isHoliday: !!holiday,
      isWork: holiday && holiday.isWork,
      holiday: holiday,
    });
  }
  return [...unshiftList, ...list, ...pushList];
});
const handleGridClick = (e) => {
  const { index } = e.detail;
  const item = dataList.value[index];
  if (!item.prev && !item.next) {
    emits('change', item);
  }
};

const emits = defineEmits(['change']);

defineExpose({
  dataList,
});
</script>

<style lang="scss" scoped>
.month-panel {
  height: fit-content;
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
  border-radius: 4rpx;
  box-sizing: border-box;
  &.active:not(.out-month):not(.current) {
    border: 1px solid $danger;
  }
  &.current {
    background: $primary;
    color: #fff;
  }
  &.out-month {
    opacity: 0.3;
  }
  .grid-dot {
    position: absolute;
    top: -8px;
    right: -8px;
  }
  &.holiday {
    background: rgba(235, 51, 51, 0.05);
    color: $danger;
  }
  &.current {
    border: 2rpx solid $primary;
  }
}

.text {
  font-family: Helvetica;
  font-size: 34rpx;
  font-weight: 600;
  pointer-events: none;
}
.lunar-text {
  font-size: 22rpx;
  font-weight: 500;
}
</style>
