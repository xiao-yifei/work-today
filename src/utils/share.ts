export const shareConfig = {
  title: '小荧上班 · 看看距离下班还有多久',
  path: '/pages/home/index',
  imageUrl: '/static/xiaoying-avatar.png',
}

export function onShareAppMessage() {
  return {
    title: shareConfig.title,
    path: shareConfig.path,
    imageUrl: shareConfig.imageUrl,
  }
}

export function onShareTimeline() {
  return {
    title: shareConfig.title,
    query: '',
    imageUrl: shareConfig.imageUrl,
  }
}

export function showShareMenu() {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
  })
}
