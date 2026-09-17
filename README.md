# 小荧上班

上班倒计时 + 实时算薪 + 购买力换算。微信小程序，数据只存在本机，没有账号，也不上传服务器。

技术栈：uni-app Vue 3 + Vite + Pinia。吉祥物是「小荧」。四个 Tab：今日 / 换算 / 日历 / 我的。

## 功能

- **今日**：工作状态、下班倒计时（下班或休息后改显示金额）、今日已赚、本月累计、已上班天数、进度条、时/分/秒薪、购买力（默认咖啡 ¥15、午餐 ¥35）、备忘、小荧陪你。先赚回不放这一页
- **换算**：三档「先赚回 / 今天能换 / 想买的」。先赚回按月固定支出摊到每个上班日，对照今日已赚看覆盖和净赚；今天能换按今日已赚换商品；想买的按日薪看要上几天班。要改先点编辑，点完成才保存
- **日历**：当月格子。休息制度（双休 / 单休 / 大小周）在这里改，观看时大小周会标出本周大/小周；法定节假日默认休息，调休补班默认上班；先点「编辑」再点日期才能改单日。累计卡只写本月累计和上班天数，不写今日已赚
- **我的**：月薪、上下班、午休。没保存过月薪时输入框空着。每月工作日不再手填，由日历算出

未保存过月薪时，倒计时和进度照常，金额显示「写月薪后就能看」。

工作状态五种：上班前 / 工作中 / 午休 / 已下班 / 今天休息。

## 计算规则

完整公式和休息日优先级见 [`docs/notes.md`](docs/notes.md)。实现在 `src/utils/work.ts`。节假日在 `src/utils/holidays.ts`。

今天休息时，倒计时停、今日已赚为 0。午休不计薪。

默认班次：`09:00`–`19:00`，午休 `12:00`–`13:00`。存储里月薪默认 `12223`，未保存前不展示、设置页也不预填。节假日按国务院 2025、2026 年通知。

`Profile.workDaysPerMonth` 是遗留字段，界面不再手填，算薪用当月日历上班天数。

金额格式化不要用 `toLocaleString`（部分安卓微信会出问题），请用 `formatMoney` / `formatWage`。

## 本地开发

需要 Node.js 18+。

```bash
npm install --legacy-peer-deps
npm run dev:mp-weixin
```

然后用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)导入编译目录，**不要**导入源码根目录：

```
dist/dev/mp-weixin
```

正式打包：

```bash
npm run build:mp-weixin
```

产物在 `dist/build/mp-weixin`。`src/manifest.json` 里已填写微信 AppID；换自己的小程序时改 `mp-weixin.appid`。

分享走页面级 `onShareAppMessage`（右上角「…」），没有首页分享按钮。分享到朋友圈需要小程序发布后才会亮起。

## 目录

```
├── docs/notes.md        产品结论
├── src/
│   ├── pages/
│   ├── stores/profile.ts
│   └── utils/           work.ts · holidays.ts
└── static/              tabBar 图标
```

设置保存在本地 `uni.setStorageSync`，键名 `work-today-profile-v1`。

产品决策见 [`docs/notes.md`](docs/notes.md)。
