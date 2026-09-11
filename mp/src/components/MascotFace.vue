<template>
  <view class="face">
    <view class="sprout" />
    <view class="leaf" />
    <view class="eye left" />
    <view class="eye right" />
  </view>
</template>

<style scoped>
.face {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #f7f4ee;
  position: relative;
  flex-shrink: 0;
}

.sprout {
  position: absolute;
  left: 25px;
  top: -10px;
  width: 3px;
  height: 14px;
  border-radius: 3px;
  background: #5d8a4a;
}

.leaf {
  position: absolute;
  left: 26px;
  top: -12px;
  width: 12px;
  height: 8px;
  border-radius: 0 10px 0 10px;
  background: #7fad5c;
}

.eye {
  position: absolute;
  top: 22px;
  width: 5px;
  height: 6px;
  border-radius: 50%;
  background: #2b2a26;
}

.left {
  left: 15px;
}

.right {
  right: 15px;
}
</style>
