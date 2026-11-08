# 口袋工具箱（UniToolbox）

一个用 **uni-app（Vue 3）+ HBuilderX** 写的 Android 工具箱 App：**49 个工具**，其中 44 个完全离线运行，另有 5 个可选联网能力（默认关闭）。全局快速检索、浅色 / 深色主题、首次使用引导、关于我们、开发者信息与文件编辑一应俱全。

- 项目目录：`C:\Users\Administrator\Documents\HBuilderProjects\UniToolbox`
- 与本机已有项目「我的app」同目录、同 HBuilderX 版本（5.34 / uni-app Vue3），直接可用
- 应用名称：口袋工具箱 · 版本 **2.2.1**（versionCode 221）· AppID `__UNI__1E20DA8`
- **主开发：WorkBuddy AI 助手** · **协作开发：Ezer Zheng** · 联系邮箱：`17805846247@163.com`

## 2.2.1 修了什么（真机实测问题）

| 现象 | 根因 | 修复 |
| --- | --- | --- |
| **进制转换、颜色转换等单行输入框仍然打不了中文**（2.2.0 修过 3 次仍复现） | uni-app 的 `input` 组件 `ignoreCompositionEvent` 默认 `true` —— App/H5 端 `compositionstart`/`compositionend` **根本不触发**，2.2.0 的「组合守卫」里 `composing` 恒为 `false`，是死代码；于是 `onInput` 每次都把值写回 `:value`。而 uni-app `value` 的语义是「输入框的初始内容」，受控回写会重设原生输入框 → 打断拼音组合 | 彻底改为**完全非受控**：`:value` 绑定 `initialValue`，输入全程不回写、不重建；用 `inner` 影子值识别并忽略 `v-model` 自身回传（否则每次回传都会 `key++` 重建，同样打断 IME）；仅父组件主动改值（重置 / 随机 / 载入）时才更新 `initialValue` 并 `:key` 重建。`tb-input` / `tb-textarea` / `tb-field` 统一到与已验证可用的 `tb-searchbar` 同一范式 |
| **点开「我的」整页白屏** | `mine.vue` 模板 5 处调用 `isGuest(account)`，但 `isGuest` 只是从 `utils/account.js` import 的模块函数。Vue3 Options API 的模板只能访问组件实例属性，import 的函数不会自动暴露 → 渲染时抛 `isGuest is not a function`，整页渲染中断 | 把 `isGuest` 挂到 `methods`（简写属性），模板调用即可解析 |

新增 `scripts/verify-6.js` 行为级回归：
- 直接加载真实组件 `<script>`，模拟「拼音逐字 → 中文上屏 → `v-model` 回传 → 外部改值」全流程，断言输入期间 `:value` 与 `:key` **始终不变**；
- 把 `mine.vue` 全部 24 条模板表达式在模拟实例上逐条求值，任何未暴露标识符都会像真机一样抛 `ReferenceError`；
- 两个断言都带**反向自检**，防止验证脚本自身退化成假阴性（2.2.0 的 `verify-5` 曾把错误的组合守卫实现写成"必须包含 `compositionend`"，导致错误方案一直测试通过）。

## 2.2 修了什么、加了什么

### Bug 修复 + 体验升级

| 现象 | 根因 | 修复 |
| --- | --- | --- |
| **几乎所有文本输入框都打不了中文**（与搜索框同类） | 47 个工具组件 + 编辑器里的原生 `<input>`/`<textarea>` 用 `v-model` 受控回写，中文输入法组合期间被反复重置 DOM value | 新增通用组件 `components/ui/tb-input.vue`、`tb-textarea.vue`（**非受控**：只在外部程序化改值时用 `:key` 重建，正常打字不回写），脚本批量替换全部原生输入框；并在 `main.js` 全局注册 |
| **深色模式下，底部「首页/工具/文件/我的」菜单仍是白色**（浅色手机 + 深色 App） | `theme.js` 仅在 `onLaunch` 调用 `uni.setTabBarStyle`，彼时 tabBar 尚未就绪，调用静默失败 | `applyTabBarStyle` 增加 200ms / 600ms 延迟重试；`themeMixin.onShow` 每次进入页面都重应用导航栏与 tabBar 配色 |
| 检查更新不够直觉 | 版本号硬编码 `2.1.0`，且只有「已是最新 / 发现新版本」两种结果 | 版本号改为从 `utils/version.js` 自动读取；新增状态机（`检查中…` / `已是最新版本` / `发现新版本` / `检查失败`）、检查中按钮禁用、`上次检查` 时间 |

### 账号管理 + 云端备份

- **游客模式优先**：默认游客，不要求登录即可使用全部 49 个工具；游客也有本机唯一 id。
- **账号（本机）**：「我的」页可设置昵称 / 头像；「登录」只是把本机身份标记为「已登录」，不依赖任何服务器、不联网、隐私可控；可随时退回游客。
- **文件免费上传**：在「文件」页点每个文件的「上传」，会**先询问**再上传；需先在「我的」开启联网并设置一个接收 `{name, content, owner, time}` JSON 的云端端点（无后端时给出明确提示，不会静默失败）。上传记录保存在本机。

> 说明：云端上传需要一个你自己的、兼容的接收端点（本项目不内置服务器）；账号信息仅存本机。

## 2.1 修了什么、加了什么

### 三个 Bug 修复

| 现象 | 根因 | 修复 |
| --- | --- | --- |
| 「认识这个 App / 回看功能介绍」打开后一片空白，只剩底部按钮 | 引导页用 `<swiper>` + `flex:1` 拉伸，而 uni-app 的 swiper 必须有明确 `height`；父容器只有 `min-height`，flex 基准为 0，三屏内容被压没 | `pages/intro/intro.vue` 改为**确定高度 + 单页渲染 + 左右滑动手势 + 圆点可点**，内容必定可见；同时接入深色变量 |
| 搜索框打不了中文 / 中文不显示 | `tb-searchbar` 用 `:value` 受控回写，中文输入法组合期间反复重置 DOM value；输入框还缺 `min-width:0` 与显式文字色，内层原生 input 可能落到浏览器默认黑色 | 两个搜索框都改为**非受控输入**（`@input` 读值、`key` 重建清空），补 `min-width:0` / `color` / `-webkit-text-fill-color` / `placeholder-class`；`App.vue` 加全局 `uni-input input` 继承兜底 |
| 切深色后页面顶部介绍区依旧一片亮白 | `.hero` 只有一套亮紫渐变 + 白字，没有 `.page-dark` 覆盖；H5 的 `navigationBarBackgroundColor` 与页面底色是静态白 | `App.vue` 增加 `.page-dark .hero` 低饱和深色渐变与文字覆盖；`theme.js` 在 H5 给 `<html>` 写 `data-tb-theme` 标记，CSS 兜底同步 body / 导航栏 / tabBar 底色 |

### 5 个新工具（灵感来自 GitHub 开源工具箱）

参考了 **DevDeck**（all-in-one developer toolbox）、**Kit**（70+ 本地工具）、**Toolbox-Android**（离线优先 Android 工具集）等项目的功能组织方式，挑了 5 个能纯离线实现、且能复用现有视觉语言的点子：

| 工具 | 分类 | 灵感 / 能力 |
| --- | --- | --- |
| **智能识别** `detect` | 实用工具 | DevDeck 的 *Command Playground*：粘贴任意内容，自动判断是 JSON / JWT / DataURL / URL / HEX 颜色 / UUID / 手机号 / 身份证 / IP-CIDR / 邮箱 / 时间戳 / Cron / 摩斯 / Base64 / CSV / 金额，给出解读、置信度、文本统计，并**一键跳到对应工具**（自动复制原文） |
| **Cron 表达式** `cron` | 实用工具 | Kit / DevDeck 的 Cron parser：5 段字段拆解、中文语义、8 个常用预设、未来 5 次本地执行时间（标准 day/week OR 语义） |
| **密码强度检测** `pwdstrength` | 实用工具 | DevDeck 的 Password Tools：字符空间与熵估算、常见弱口令 / 顺序 / 重复检测、离线爆破时间估算与改进建议，全程本机计算 |
| **摩斯电码** `morse` | 格式转换 | 经典离线工具：文字 ↔ 点划双向转换、ITU 码表、不支持字符提示、可视化节拍播放（无声音与权限） |
| **AA 分账** `split` | 生活计算 | Toolbox-Android 的 Tip / Bill Split：多人分摊、小费比例、精确到分（余数依次分配）或每人取整到元、逐人明细 |

新增算法集中在 `utils/gadget.js`（纯函数、零依赖、可单测），界面沿用 2.0 的 `tb-badge`、分类色调与全局卡片样式，**没有引入新的视觉语言**。首页「常用工具」里放入了智能识别，方便第一时间试用。

## 全局快速检索

入口：首页顶部搜索条、工具页搜索条右侧「全局」、「我的 → 全局快速检索」；H5 浏览器里随时按 **Ctrl / ⌘ + K** 唤起，搜索页按 **Esc** 返回。

- **拼音首字母**：`ewm` → 二维码生成、`dk` → 贷款计算器、`znsb` → 智能识别、`aafz` → AA 分账
- **中文别名**：房贷、扫一扫、打折、阴历、子网掩码、分账 等口语叫法都能命中
- **多维匹配**：工具名、英文 key、描述、标签、分类名、别名、拼音简写，加权排序；收藏与最近使用自动靠前
- **多关键词**：空格分隔做 AND（如「图片 压缩」）；输入 `#life`、`#utility` 可只看某个分类
- **搜索页**：自动聚焦、命中高亮、搜索历史（可单条删除 / 清空）、热门词、分类筛选、最佳结果标记、回车一键直达
- 搜索历史只存本机（最多 10 条），「我的 → 清理使用记录」可一键清除

## 功能清单（49 个）

**格式转换（13）**：图片格式转换（PNG/JPG/WEBP + 缩放压缩）、编码转换（Base64/URL/Unicode/HTML）、JSON 格式化、数据格式互转（JSON/CSV/YAML）、进制转换（2~36 任意精度）、颜色转换（HEX/RGB/HSL）、时间戳转换、Markdown 预览、URL 参数解析、JWT 解码、图片水印、图片 ↔ Base64 / DataURL、**摩斯电码**。

**文件编辑（2）**：文件管理器（新建/改名/删除/导出/复制）、文本编辑器（查找替换、字数统计、自动存草稿）。

**生活计算（7）**：贷款计算器（等额本息 / 本金 + 还款计划）、个税计算器（年度汇算 + 月度累计预扣）、BMI 健康计算、百分比计算、农历生肖（1900~2100 离线表）、身份证校验（15 位升级）、**AA 分账 / 小费**。

**实用工具（22）**：文本工具箱、单位换算（8 类）、哈希校验、密码生成器、二维码生成、随机抽签、计时器、日期计算、计算器、正则测试器、UUID / 随机 ID、文本对比 Diff、人民币大写、扫码识别、世界时钟（21 城市）、EAN-13 条码、IP / CIDR 子网计算、开发者速查、指南针 · 水平仪、**智能识别**、**Cron 表达式**、**密码强度检测**。

**联网功能（5，默认关闭）**：HTTP 请求调试、网络信息、实时汇率、每日一言、检查更新。

## 界面与体验（延续 2.0）

- **2.0 的视觉决策全部保留**：5 个分类语义色（`--tone-*`）、统一 `tb-badge`、单一全局样式层、首页轻入口 + 工具 tab 完整目录、4 项 tabBar。
- **首页**：精简品牌头图、唯一主搜索条、最近使用、我的收藏、5 个分类快捷卡、8 个常用工具。
- **工具 tab**：统一搜索条（页内筛选 + 全局）、分类 chips（含「★ 收藏」）、按分类分组的完整 49 个工具列表。
- **主题**：浅色 / 深色 / 跟随系统三档；深色下头图、卡片、输入框、导航栏、tabBar 与页面底色一致变暗，二维码 / 条码画布仍强制白底保证可扫。
- **首次使用引导**：3 屏介绍（可滑动 / 点圆点 / 跳过），只弹一次；「我的 - 回看功能介绍」可再次打开。
- **关于我们**：应用介绍、按分类统计的功能概览、开发团队与开发者简介、联系邮箱（一键复制 / 发邮件）、隐私与联网说明、技术与致谢；数字从注册表动态读取。

## 联网与隐私（重要）

1. **联网开关默认关闭**。关闭时 `utils/net.js` 的 `assertNet()` 直接拒绝请求，应用不会发出任何网络请求；44 个离线工具完全不调用网络层。
2. 开启入口只有两处：「我的 - 允许联网」（带二次确认）和联网工具页的「开启联网」卡片。开启后，仍**只有你主动点击按钮时**才会发请求，没有后台轮询或自动上报。
3. 所有请求走统一网络层：8 秒超时、响应归一化、数据源白名单、多源失败自动降级、错误可读。
4. 数据源是可替换的免 Key 公开接口，集中在 `utils/net-config.js`。天气 / 翻译 / AI 等需要 API Key 的服务留了扩展位但默认不启用。
5. 不上传本地文件、编辑器草稿、剪贴板内容；**智能识别、密码强度检测全部在本机完成**，密码不会被保存或记录。
6. 无账号体系、无广告、无统计上报、无后台常驻服务；农历数据、检索索引、速查手册均为内置离线数据。
7. H5 端受浏览器 CORS 限制；App 端无此限制。「检查更新」只做版本比对，不自动下载或安装。

## 在 HBuilderX 里打开与运行

1. 打开 HBuilderX（桌面快捷方式「HBuilder X」），项目已在左侧项目管理器（`UniToolbox(UniApp_VUE)`）。若没看到：**文件 → 导入 → 从本地目录导入**，选 `UniToolbox` 目录。
2. `manifest.json` 已分配真实 AppID，可直接云打包；应用名称、版本号、Android 权限在这里改。

| 目标 | 操作 |
| --- | --- |
| 快速预览 | 右键项目 → **运行 → 运行到浏览器**。纯计算工具可完整试用；文件编辑用 localStorage 模拟；扫码、传感器、相册保存需真机。 |
| 真机调试 | 手机开 USB 调试连上电脑 → **运行 → 运行到 Android App 基座**。图片水印、条码、扫码、指南针建议在这一步实测。 |
| 生成 APK | **发行 → 原生 App 云打包**，平台 Android，选 DCloud 公共测试证书（仅测试）或自有证书。 |
| H5 发行 | `cli.exe publish web --project <项目路径> --webHosting false`，产物在 `unpackage/dist/build/web`，需 HTTP 服务访问。 |
| 命令行编译 | `D:\hbuilder\HBuilderX.5.34.2026102909\HBuilderX\cli.exe launch app-android --project <项目路径> --compile true` |

## 数据与权限

- App 端文件保存在应用私有目录 `_doc/toolbox/`，**不需要存储权限**；「导出」写到公共 `Documents`（Android 10+ 若失败请用「复制内容」）。
- 浏览器预览时文件保存在 localStorage。收藏、最近使用、搜索历史、扫码历史、一言收藏、主题与联网开关都存在 `uni.setStorageSync`；「我的 - 清理使用记录」可清除使用记录类数据，不会删文件与草稿。
- 已声明 `INTERNET`、`ACCESS_NETWORK_STATE`、`VIBRATE`、读写外部存储权限；二维码 / 条码 / 图片用 canvas 本地绘制。

## 目录结构

```
UniToolbox/
├─ pages/
│  ├─ index/index.vue       首页（搜索 / 最近 / 收藏 / 分类卡 / 常用工具）
│  ├─ search/search.vue     全屏快速检索页（非受控输入）
│  ├─ category/category.vue 工具总览（tabBar，完整 49 个 + 页内筛选 + 收藏）
│  ├─ tool/tool.vue         通用工具容器（按 key 加载 47 个组件）
│  ├─ files/files.vue       文件管理器（tabBar）
│  ├─ editor/editor.vue     文本编辑器
│  ├─ mine/mine.vue         我的：主题 / 联网 / 设置（tabBar）
│  ├─ intro/intro.vue       首次使用引导（2.1 修复空白，单页 + 手势）
│  └─ about/about.vue       关于我们
├─ components/
│  ├─ tools/                47 个工具组件 tool-xxx.vue
│  └─ ui/                   tb-card / tb-btn / tb-field / tb-section / tb-empty /
│                           tb-result / tb-net-gate / tb-badge / tb-searchbar
├─ utils/
│  ├─ gadget.js             2.1 新增：智能识别 / Cron / 密码强度 / 摩斯 / AA 分账
│  ├─ visual.js             分类语义色调映射（纯展示）
│  ├─ convert.js            编码/JSON/CSV/YAML/进制/颜色/时间/单位
│  ├─ format-extra.js       正则/UUID/Diff/URL/JWT/人民币大写/Markdown
│  ├─ life.js               贷款/个税/BMI/百分比/农历/身份证/世界时钟
│  ├─ lunar-data.js         1900-2100 农历离线表（构建期由 ICU 生成）
│  ├─ devkit.js             IP/CIDR、EAN-13、速查表、传感器角度
│  ├─ search.js             检索内核（加权评分 / 高亮 / 历史）
│  ├─ crypto.js             MD5 / SHA-1 / SHA-256
│  ├─ qrcode.js             二维码矩阵（ESM + UTF-8）
│  ├─ net.js / net-config.js 统一网络层与可替换数据源
│  ├─ theme.js              主题模式、页面 mixin、H5 根标记
│  ├─ fs.js                 文件存储层（App: plus.io / H5: localStorage）
│  ├─ tools.js              工具注册表（含 abbr / alias）+ tabBar 页面判断
│  └─ ui.js                 复制 / 提示 / 确认弹窗
├─ scripts/
│  ├─ gen-tab-icons.js      纯 Node 生成 8 张 tabBar PNG
│  ├─ gen-lunar-data.js     生成农历离线表（Node ICU，仅构建期）
│  ├─ verify.js             73 项原有回归 + 结构 / Vue 静态检查
│  ├─ verify-new.js         89 项单测（含网络层 mock）
│  ├─ verify-3.js           149 项单测（含真实注册表检索）
│  ├─ verify-4.js           39 项界面契约（色调 / 主题 / 组件 / 版本 / 署名）
│  └─ verify-5.js           127 项 2.1 新增工具单测 + 三处 bug 修复契约
├─ static/tab/              8 张 81×81 tabBar 图标
├─ manifest.json / pages.json / App.vue / uni.scss
```

### 想加一个新工具？

1. 在 `utils/tools.js` 的 `TOOLS` 数组加一条：`key`（小写字母/数字）、名称、`cat`、徽标 `badge`、描述、`tags`，**务必补 `abbr`（拼音首字母）与 `alias`（别名）**，联网工具加 `net: true`。`color` 是历史字段，徽标颜色由 `cat` 经 `utils/visual.js` 决定。
2. 纯计算逻辑放 `utils/` 下的模块，保持不依赖 uni 以便单测。
3. 新建 `components/tools/tool-你的key.vue`，用全局 `.card / .btn / .chip / .result` 或 `components/ui/` 组件写界面；徽标用 `<tb-badge :tool="tool" />`；联网工具用 `<tb-net-gate>` 包起来。
4. 在 `pages/tool/tool.vue` 顶部 import、注册，并加一行 `<tool-你的key v-else-if="key === '你的key'" />`。
5. 跑 `for f in scripts/verify*.js; do node "$f" || break; done`，校验脚本会自动检查组件、挂载、检索元数据、界面契约、版本号与 IME / 白屏回归。

## 已做的验证（v2.2.1）

- **67 个 `.vue` 文件**的 `<script>` 语法与模板标签配对检查通过；9 个页面、49 个工具、47 个工具组件注册与挂载一一对应（无缺组件 / 无未挂载 / 无多余组件）。
- **627 项校验全通过**：73 项原有零回归 + 89 项 v1.1 单测 + 149 项 v1.2 单测 + 43 项 2.0 界面契约 + 146 项 2.1/IME 契约 + **127 项 v2.2.1 IME 与白屏行为级回归**（智能识别 40+ 用例、Cron 未来时间推算与 8 个预设、密码强度、摩斯全表往返、AA 分账整数分校验）。
- 农历 **240 个日期与 Node ICU 逐日比对一致**；MD5/SHA-1/SHA-256 与 Node.js `crypto` 标准库逐例一致；二维码矩阵与 HBuilderX 自带 QRCode 原库逐像素一致。
- HBuilderX 5.34 实测编译：`publish web` 全量发行 + `launch app-android --compile` **双端编译通过**。
- 8 张 tabBar 图标为合法 81×81 PNG；`manifest.json` / `pages.json` JSON 校验通过。

## 已知限制

- 联网数据源是第三方公开接口，可能受地区网络、CORS 或服务商策略影响；失败时明确提示并自动尝试备用源，不影响离线功能。
- H5 预览没有相机、相册与方向 / 加速度传感器：扫码、保存图片、指南针与水平仪请真机运行；HTTP 调试跨域也受浏览器限制。
- **智能识别是启发式判断**，内容可能同时匹配多个候选（已按置信度排序，可手动切换）；**Cron 只支持标准 5 段**，不支持 `L` / `W` / `#` 与秒级 6 段；摩斯码表不含中文；密码强度与破解时间是理论估算，不是安全审计。
- 农历覆盖 1900-01-31 ~ 2100 年（含闰月），不含节气时刻；世界时钟在设备缺少完整时区库时回退到固定 UTC 偏移。
- 个税按 2019 年起综合所得七级税率计算，不含年终奖单独计税；贷款结果为估算；BMI 不替代医学诊断。
- Markdown 是轻量解析器；JWT 解码**不验签**；WEBP 导出依赖设备 WebView；YAML 只支持常见缩进结构；MD5/SHA-1 只适合做一致性校验。
