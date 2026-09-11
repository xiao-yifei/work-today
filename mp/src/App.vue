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
</style>
