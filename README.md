# 小荧上班

上班倒计时 + 实时算薪 + 购买力换算。数据只存在本机，没有账号，也不上传服务器。

仓库里有两套实现：

| 端         | 目录       | 技术栈                            |
| ---------- | ---------- | --------------------------------- |
| H5         | 仓库根目录 | Vue 3 + Vite + Vue Router + Pinia |
| 微信小程序 | `mp/`      | uni-app Vue 3 + Vite + Pinia      |

吉祥物是「小荧」。四个 Tab：今日 / 换算 / 日历 / 我的。

## 功能

- **今日**：工作状态、下班倒计时、今日已赚、本月累计、已上班天数、进度条、时/分/秒薪、购买力（默认咖啡 ¥15、午餐 ¥35）
- **换算**：按今日已赚换算能买多少件商品，并显示一件要上班多久；单价在这里编辑，点完成才保存
- **日历**：当月格子。休息制度（双休 / 单休 / 大小周）在这里改；法定节假日默认休息，调休补班默认上班；先点「编辑」再点日期才能改单日。日薪按本月上班天数计算
- **我的**：月薪、上下班、午休、备忘。每月工作日不再手填，由日历算出

工作状态五种：上班前 / 工作中 / 午休 / 已下班 / 今天休息。

## 计算规则

完整公式和休息日优先级见 [`docs/notes.md`](docs/notes.md)。实现在 `src/utils/work.ts`，改完请同步 `mp/src/utils/work.ts`。`holidays.ts`、`types.ts` 同样两端各一份。

今天休息时，倒计时停、今日已赚为 0。午休不计薪。

默认班次：月薪 `12223`，`09:00`–`19:00`，午休 `12:00`–`13:00`。节假日按国务院 2025、2026 年通知写在 `src/utils/holidays.ts`。

`Profile.workDaysPerMonth` 是遗留字段，界面不再手填，算薪用当月日历上班天数。

金额格式化不要用 `toLocaleString`（部分安卓微信会出问题），请用 `formatMoney` / `formatWage`。

## 本地开发

需要 Node.js 18+。

### H5

```bash
npm install
npm run dev
```

浏览器打开 <http://localhost:5173/>。

```bash
npm run build    # 类型检查 + 打包
npm run preview  # 预览产物
```

### 微信小程序

```bash
cd mp
npm install --legacy-peer-deps
npm run dev:mp-weixin
```

然后用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)导入编译目录，**不要**导入 `mp` 源码根目录：

```
mp/dist/dev/mp-weixin
```

正式打包：

```bash
cd mp
npm run build:mp-weixin
```

产物在 `mp/dist/build/mp-weixin`。`mp/src/manifest.json` 里已填写微信 AppID；换自己的小程序时改 `mp-weixin.appid`。

分享走页面级 `onShareAppMessage`（右上角「…」），没有首页分享按钮。分享到朋友圈需要小程序发布后才会亮起。

## 目录

```
├── docs/notes.md        产品结论
├── src/                 H5
│   ├── views/
│   ├── stores/profile.ts
│   └── utils/           work.ts · holidays.ts
└── mp/                  微信小程序
    └── src/
        ├── pages/
        ├── stores/profile.ts
        └── utils/
```

设置保存在本地，键名都是 `work-today-profile-v1`：

- H5：`localStorage`
- 小程序：`uni.setStorageSync`

产品决策见 [`docs/notes.md`](docs/notes.md)。
