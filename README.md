# 小荧上班

上班倒计时 + 实时算薪 + 购买力换算。数据只存在本机，没有账号，也不上传服务器。

仓库里有两套实现：

| 端 | 目录 | 技术栈 |
| --- | --- | --- |
| H5 | 仓库根目录 | Vue 3 + Vite + Vue Router + Pinia |
| 微信小程序 | `mp/` | uni-app Vue 3 + Vite + Pinia |

吉祥物是「小荧」。一期四个 Tab：今日 / 换算 / 日历 / 我的。

## 功能

- **今日**：工作状态、下班倒计时、今日已赚、本月估算、进度条、时/分/秒薪、购买力（默认咖啡 ¥15、午餐 ¥35）
- **换算**：按今日已赚换算能买多少件商品
- **日历**：一期先按工作日估算本月累计（按天回看、加班、休息日放到二期）
- **我的**：月薪、每月工作日、上下班时间、午休、备忘、商品单价；改完会写回本地存储

工作状态有四种：上班前 / 工作中 / 午休 / 已下班。

## 计算规则

```
日薪     = 月薪 / 每月工作日
有效工时 = 下班 − 上班 − 午休
秒薪     = 日薪 / 有效秒数
今日已赚 = 已工作秒数 × 秒薪
```

默认配置：月薪 `12223`，每月 `22` 个工作日，`09:00`–`19:00`，午休 `12:00`–`13:00`。

两套实现共用同一套算法。改根目录的 `src/utils/work.ts` 后，请同步到 `mp/src/utils/work.ts`。

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

分享到好友走页面级 `onShareAppMessage`。分享到朋友圈需要小程序发布后才会亮起。

## 目录

```
├── src/                 H5
│   ├── views/           今日 / 换算 / 日历 / 我的
│   ├── stores/profile.ts
│   └── utils/work.ts    工时与算薪
└── mp/                  微信小程序
    └── src/
        ├── pages/
        ├── stores/profile.ts
        └── utils/work.ts
```

设置保存在本地，键名都是 `work-today-profile-v1`：

- H5：`localStorage`
- 小程序：`uni.setStorageSync`
