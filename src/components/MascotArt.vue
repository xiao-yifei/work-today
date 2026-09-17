<template>
  <view class="mascot">
    <view class="sprout" />
    <view class="leaf" />
    <view class="head">
      <view class="eye left" />
      <view class="eye right" />
      <view class="blush left" />
      <view class="blush right" />
    </view>
    <view class="desk" />
  </view>
</template>

<style scoped>
.mascot {
  width: 140px;
  height: 140px;
  position: relative;
}

.sprout {
  position: absolute;
  left: 68px;
  top: 8px;
  width: 4px;
  height: 22px;
  border-radius: 4px;
  background: #5d8a4a;
}

.leaf {
  position: absolute;
  left: 70px;
  top: 6px;
  width: 18px;
  height: 12px;
  border-radius: 0 12px 0 12px;
  background: #7fad5c;
}

.head {
  position: absolute;
  left: 36px;
  top: 28px;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #f7f4ee;
}

.eye {
  position: absolute;
  top: 28px;
  width: 6px;
  height: 8px;
  border-radius: 50%;
  background: #2b2a26;
}

.eye.left {
  left: 20px;
}

.eye.right {
  right: 20px;
}

.blush {
  position: absolute;
  top: 36px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f0c6b4;
  opacity: 0.7;
}

.blush.left {
  left: 10px;
}

.blush.right {
  right: 10px;
}

.desk {
  position: absolute;
  left: 18px;
  bottom: 18px;
  width: 104px;
  height: 28px;
  border-radius: 8px;
  background: #3a3934;
}
</style>
