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
    <view class="body" />
    <view class="shadow" />
    <view class="desk">
      <view class="cup">
        <view class="coffee" />
      </view>
      <view class="top" />
      <view class="edge" />
      <view class="leg left" />
      <view class="leg right" />
    </view>
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
  top: 4px;
  z-index: 5;
  width: 4px;
  height: 20px;
  border-radius: 4px;
  background: #5d8a4a;
}

.leaf {
  position: absolute;
  left: 70px;
  top: 2px;
  z-index: 5;
  width: 18px;
  height: 12px;
  border-radius: 0 12px 0 12px;
  background: #7fad5c;
}

.head {
  position: absolute;
  left: 36px;
  top: 22px;
  z-index: 4;
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

.body {
  position: absolute;
  left: 54px;
  top: 82px;
  z-index: 2;
  width: 32px;
  height: 26px;
  border-radius: 16px 16px 8px 8px;
  background: #efe8db;
}

.shadow {
  position: absolute;
  left: 24px;
  bottom: 4px;
  z-index: 0;
  width: 92px;
  height: 10px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
}

.desk {
  position: absolute;
  left: 12px;
  bottom: 8px;
  z-index: 3;
  width: 116px;
  height: 34px;
}

.top {
  position: absolute;
  left: 0;
  top: 0;
  width: 116px;
  height: 12px;
  border-radius: 7px 7px 2px 2px;
  background: #d2b48c;
}

.edge {
  position: absolute;
  left: 0;
  top: 11px;
  width: 116px;
  height: 7px;
  border-radius: 0 0 3px 3px;
  background: #8b6d48;
}

.leg {
  position: absolute;
  top: 17px;
  width: 6px;
  height: 15px;
  border-radius: 0 0 3px 3px;
  background: #6f563a;
}

.leg.left {
  left: 18px;
}

.leg.right {
  right: 18px;
}

.cup {
  position: absolute;
  right: 16px;
  top: -9px;
  z-index: 4;
  width: 10px;
  height: 11px;
  border-radius: 2px 2px 3px 3px;
  background: #f6f1e8;
  overflow: hidden;
}

.coffee {
  position: absolute;
  left: 1px;
  top: 1px;
  width: 8px;
  height: 3px;
  border-radius: 1px;
  background: #7c6246;
}
</style>
