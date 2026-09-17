<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';

onLaunch(() => {
  uni.setStorageSync('work-today-booted', 1)
})
</script>

<style>
page {
  background-color: #f4efe6;
  color: #1c1b18;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue',
    'Microsoft YaHei', sans-serif;
}

.eyebrow,
.eyebrow text {
  display: block;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
  letter-spacing: 2rpx;
  color: #8a8478;
}
</style>
