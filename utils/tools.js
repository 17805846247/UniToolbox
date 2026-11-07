/**
 * 工具清单：首页、分类页、全局搜索、工具页共用。
 * 新增工具时：这里加一条 + 建 components/tools/tool-<key>.vue + 在 pages/tool/tool.vue 挂载。
 * abbr = 拼音首字母/简拼（空格分隔多个），alias = 中文别名/常见叫法，二者用于快速检索。
 */
import { smartSearch } from './search.js'

export const CATEGORIES = [
	{ key: 'convert', name: '格式转换', desc: '图片、编码、数据、进制、颜色、时间', color: '#4f6ef7', badge: '转' },
	{ key: 'file', name: '文件编辑', desc: '手机上的文件管理与文本编辑器', color: '#16a06a', badge: '档' },
	{ key: 'life', name: '生活计算', desc: '贷款、个税、健康、农历、分账与百分比', color: '#e0528a', badge: '生' },
	{ key: 'utility', name: '实用工具', desc: '文本、换算、加密、智能识别与计时', color: '#e8813a', badge: '用' },
	{ key: 'network', name: '联网功能', desc: '默认关闭，需要时手动开启', color: '#0ea5e9', badge: '网' }
]

export const TOOLS = [
	// 格式转换
	{ key: 'image', name: '图片格式转换', desc: 'PNG / JPG / WEBP 互转、缩放与压缩', cat: 'convert', badge: '图', color: '#f59e0b', abbr: 'tpbgzh tpgszh tpys', alias: '图片压缩 格式工厂 转换器 换格式', tags: '图片 png jpg webp 压缩 格式' },
	{ key: 'encoding', name: '编码转换', desc: 'Base64、URL、Unicode、HTML 实体', cat: 'convert', badge: '码', color: '#4f6ef7', abbr: 'bmzh', alias: 'base64 编码解码 转义 html实体', tags: 'base64 url unicode html 转义 编码' },
	{ key: 'json', name: 'JSON 格式化', desc: '格式化 / 压缩 / 校验 / 转义', cat: 'convert', badge: '{}', color: '#10b981', abbr: 'jsongsh json', alias: 'json美化 校验 压缩 缩进', tags: 'json 格式化 压缩 校验' },
	{ key: 'table', name: '数据格式互转', desc: 'JSON ↔ CSV ↔ YAML 表格互转', cat: 'convert', badge: '表', color: '#8b5cf6', abbr: 'sjgshz', alias: 'csv yaml excel 表格 数据', tags: 'csv yaml json 表格 数据' },
	{ key: 'radix', name: '进制转换', desc: '2~36 进制互转，支持大数', cat: 'convert', badge: '16', color: '#0ea5e9', abbr: 'jzzh', alias: '二进制 十六进制 八进制 2 8 16', tags: '二进制 八进制 十六进制 进制' },
	{ key: 'color', name: '颜色转换', desc: 'HEX / RGB / HSL 互转与预览（开发中）', cat: 'convert', badge: '色', color: '#ec4899', abbr: 'yszh ys', alias: '取色器 色值 rgb hex hsl', tags: '颜色 hex rgb hsl 取色', dev: true },
	{ key: 'timestamp', name: '时间戳转换', desc: 'Unix 时间戳与日期时间互转', cat: 'convert', badge: '钟', color: '#14b8a6', abbr: 'sjczh', alias: 'unix 时间戳 日期转时间戳', tags: '时间戳 unix 日期 时间' },
	{ key: 'markdown', name: 'Markdown 预览', desc: '本地解析渲染，无需联网', cat: 'convert', badge: 'M↓', color: '#6366f1', abbr: 'mdyl md', alias: 'md 渲染 文档 预览', tags: 'markdown md 预览 渲染 html' },
	{ key: 'url', name: 'URL 参数解析', desc: 'query ↔ 对象、编码解码与拼装', cat: 'convert', badge: '?&', color: '#0ea5e9', abbr: 'urlcsjx url', alias: '网址 参数 query 编解码 链接', tags: 'url 参数 query 编码 链接' },
	{ key: 'jwt', name: 'JWT 解码', desc: '本地查看 Header / Payload，不上传', cat: 'convert', badge: 'JWT', color: '#8b5cf6', abbr: 'jwtjm jwt', alias: 'token 令牌 解析', tags: 'jwt token 解码 base64 令牌' },
	{ key: 'watermark', name: '图片水印', desc: '给照片加文字水印，可调透明度', cat: 'convert', badge: '水', color: '#0891b2', abbr: 'tpsy sy', alias: '水印 加字 版权 打标 防盗图', tags: '图片 水印 文字 版权 导出' },
	{ key: 'imagebase64', name: '图片 Base64', desc: '图片 ↔ DataURL / Base64 互转', cat: 'convert', badge: 'B64', color: '#7c3aed', abbr: 'tpbase64 tp64', alias: 'dataurl 图片编码 图片转码 内嵌图片', tags: '图片 base64 dataurl 编码 前端' },
	{ key: 'morse', name: '摩斯电码', desc: '文字 ↔ 点划编码，附码表与节拍', cat: 'convert', badge: '·−', color: '#0ea5e9', abbr: 'msdm ms', alias: 'morse 摩斯密码 点划 电报 sos', tags: '摩斯 电码 点划 电报 编码' },

	// 文件编辑
	{ key: 'files', name: '文件管理器', desc: '新建、重命名、删除、导出文件', cat: 'file', badge: '夹', color: '#16a06a', page: '/pages/files/files', abbr: 'wjglq wj', alias: '文件夹 目录 导出 新建 文件', tags: '文件 管理 目录 导出' },
	{ key: 'editor', name: '文本编辑器', desc: '编辑、查找替换、字数统计、自动保存', cat: 'file', badge: '笔', color: '#0ea5e9', page: '/pages/editor/editor', abbr: 'wbbjq bjq', alias: '记事本 笔记 草稿 编辑', tags: '记事本 编辑 文本 查找 替换' },

	// 生活计算
	{ key: 'loan', name: '贷款计算器', desc: '等额本息 / 等额本金，月供与还款计划', cat: 'life', badge: '贷', color: '#e0528a', abbr: 'dkjsq dk fdjsq', alias: '房贷 按揭 月供 车贷 还款 利息', tags: '贷款 房贷 月供 等额本息 等额本金 利息' },
	{ key: 'tax', name: '个税计算器', desc: '年度汇算与月度累计预扣，含专项扣除', cat: 'life', badge: '税', color: '#d97706', abbr: 'gsjsq gs', alias: '个人所得税 工资 税后 汇算 起征点', tags: '个税 工资 税率 专项附加扣除 汇算' },
	{ key: 'bmi', name: 'BMI 健康计算', desc: 'BMI、理想体重、基础代谢与每日热量', cat: 'life', badge: '健', color: '#16a06a', abbr: 'bmi jkjs', alias: '体重 身高 肥胖 基础代谢 热量 减肥', tags: 'bmi 健康 体重 身高 热量 基础代谢' },
	{ key: 'percent', name: '百分比计算', desc: '占比、增减、增长率、折扣与反推原价', cat: 'life', badge: '%', color: '#4f6ef7', abbr: 'bfbjs bfb', alias: '折扣 增长率 占比 打折 百分数', tags: '百分比 折扣 增长率 占比 计算' },
	{ key: 'lunar', name: '农历生肖', desc: '公历农历互转、干支生肖与传统节日', cat: 'life', badge: '历', color: '#dc2626', abbr: 'nl sz nlrz', alias: '阴历 公历 春节 干支 黄历 生日 属相', tags: '农历 阴历 生肖 春节 干支 节日' },
	{ key: 'idcard', name: '身份证校验', desc: '校验码、生日、性别、地区与 15 位升级', cat: 'life', badge: '证', color: '#475569', abbr: 'sfzjy sfz', alias: '身份证号 校验码 出生日期 籍贯', tags: '身份证 校验 生日 性别 地区' },
	{ key: 'split', name: 'AA 分账', desc: '多人分摊、小费与取整到分 / 元', cat: 'life', badge: 'AA', color: '#0ea5e9', abbr: 'aafz fz', alias: '分账 小费 aa 聚餐 平摊 账单 人均', tags: 'aa 分账 小费 聚餐 平摊 账单' },

	// 实用工具
	{ key: 'text', name: '文本工具箱', desc: '大小写、去重、排序、字数统计', cat: 'utility', badge: '文', color: '#6366f1', abbr: 'wbgjx wb', alias: '大小写 去重 排序 字数', tags: '文本 大小写 去重 排序 统计' },
	{ key: 'unit', name: '单位换算', desc: '长度 / 质量 / 温度 / 存储等 8 类', cat: 'utility', badge: '量', color: '#22a06b', abbr: 'dwhs dw', alias: '长度 重量 温度 字节 换算器', tags: '单位 换算 长度 温度 字节' },
	{ key: 'hash', name: '哈希校验', desc: 'MD5 / SHA-1 / SHA-256 摘要计算', cat: 'utility', badge: '#', color: '#0891b2', abbr: 'xyjy hash', alias: 'md5 sha1 sha256 摘要 校验', tags: 'md5 sha1 sha256 哈希 校验' },
	{ key: 'password', name: '密码生成器', desc: '自定义长度与字符集的强密码', cat: 'utility', badge: '锁', color: '#db2777', abbr: 'mmscq mm', alias: '强密码 随机密码 口令', tags: '密码 随机 强度 生成' },
	{ key: 'qrcode', name: '二维码生成', desc: '文字 / 网址生成二维码，支持中文', cat: 'utility', badge: '方', color: '#7c3aed', abbr: 'ewmsc ewm', alias: 'qr 二维码 名片 网址', tags: '二维码 qrcode 生成' },
	{ key: 'random', name: '随机抽签', desc: '随机数、抽签、抛硬币、掷骰子', cat: 'utility', badge: '签', color: '#ea580c', abbr: 'sjcq cq', alias: '随机数 点名 骰子 硬币 抽奖', tags: '随机 抽签 点名 骰子 硬币' },
	{ key: 'timer', name: '计时器', desc: '倒计时、番茄钟、正计时秒表', cat: 'utility', badge: '时', color: '#2563eb', abbr: 'jsq dsj', alias: '倒计时 番茄钟 秒表 计时', tags: '计时 倒计时 番茄钟 秒表' },
	{ key: 'datecalc', name: '日期计算', desc: '天数差、倒数日、日期加减', cat: 'utility', badge: '日', color: '#0d9488', abbr: 'rqjs', alias: '天数 倒数日 纪念日 日期加减', tags: '日期 倒数日 天数 计算' },
	{ key: 'calc', name: '计算器', desc: '四则运算与括号表达式求值', cat: 'utility', badge: '=', color: '#475569', abbr: 'jsq', alias: '四则运算 表达式 算术', tags: '计算器 表达式 四则运算' },
	{ key: 'regex', name: '正则测试器', desc: '匹配高亮、分组与替换预览', cat: 'utility', badge: '.*', color: '#e05252', abbr: 'zzcsq zz', alias: 'regex 正则表达式 匹配 替换', tags: '正则 regex 匹配 替换 表达式' },
	{ key: 'uuid', name: 'UUID / 随机 ID', desc: 'UUID v4、NanoID、自定义短码', cat: 'utility', badge: 'ID', color: '#7c3aed', abbr: 'uuid id', alias: 'guid nanoid 唯一标识', tags: 'uuid guid nanoid 随机 id' },
	{ key: 'diff', name: '文本对比 Diff', desc: '行级差异对比，增删一目了然', cat: 'utility', badge: '≠', color: '#0ea5e9', abbr: 'wbdb diff', alias: '差异 比较 文本比对', tags: 'diff 对比 差异 文本 比较' },
	{ key: 'rmb', name: '人民币大写', desc: '数字金额转中文大写，含角分', cat: 'utility', badge: '¥', color: '#d97706', abbr: 'rmbdx dx', alias: '金额 大写 财务 中文数字', tags: '人民币 大写 金额 财务 中文' },
	{ key: 'scan', name: '扫码识别', desc: '调用相机识别二维码 / 条形码', cat: 'utility', badge: '扫', color: '#16a06a', abbr: 'smsb sm', alias: '扫一扫 相机 条形码 识别', tags: '扫码 识别 相机 条形码 二维码' },
	{ key: 'timezone', name: '世界时钟', desc: '21 个城市时间、时差与夏令时', cat: 'utility', badge: '🌐', color: '#0ea5e9', abbr: 'sjsz sj', alias: '时区 时差 国际时间 夏令时 各地时间', tags: '时区 世界时钟 时差 夏令时' },
	{ key: 'barcode', name: '条码生成', desc: 'EAN-13 商品条码，自动算校验位', cat: 'utility', badge: 'Ⅲ', color: '#334155', abbr: 'tmsc tm', alias: '条形码 ean13 商品条码 条码', tags: '条码 条形码 ean13 商品 绘制' },
	{ key: 'ipcalc', name: 'IP 子网计算', desc: 'CIDR、掩码、网段、广播与可用主机', cat: 'utility', badge: 'IP', color: '#4f6ef7', abbr: 'zwjs ip', alias: 'cidr 子网掩码 网段 广播地址 主机数', tags: 'ip cidr 子网 掩码 网段 网络' },
	{ key: 'cheatsheet', name: '开发者速查', desc: '状态码、MIME、端口、正则与 Git', cat: 'utility', badge: '⌘', color: '#7c3aed', abbr: 'kfzsc sc', alias: 'http状态码 mime 端口 git 正则 手册 速查表', tags: '开发者 速查 http mime 端口 git 正则' },
	{ key: 'compass', name: '指南针 / 水平仪', desc: '方向、方位角与手机水平检测', cat: 'utility', badge: '北', color: '#e8813a', abbr: 'znz spy', alias: '罗盘 方向 水平 气泡 传感器 找平', tags: '指南针 水平仪 方向 传感器 罗盘' },
	{ key: 'detect', name: '智能识别', desc: '粘贴任意文本，自动判断格式并推荐工具', cat: 'utility', badge: '?', color: '#4f6ef7', abbr: 'znsb sb', alias: '格式识别 自动识别 粘贴 判断类型 这是什么', tags: '智能 识别 格式 自动 粘贴 json jwt base64' },
	{ key: 'cron', name: 'Cron 表达式', desc: '字段释义、中文描述与未来执行时间', cat: 'utility', badge: '*', color: '#7c3aed', abbr: 'cronbds cron', alias: '定时任务 crontab 计划任务 表达式 定时', tags: 'cron crontab 定时 表达式 计划任务' },
	{ key: 'pwdstrength', name: '密码强度检测', desc: '熵值估算、破解时间与改进建议', cat: 'utility', badge: '强', color: '#db2777', abbr: 'mmqdjc mmqd', alias: '密码强度 弱口令 熵 破解时间 安全', tags: '密码 强度 熵 弱口令 破解时间' },

	// 联网功能（默认关闭，需用户主动开启）
	{ key: 'nethttp', name: 'HTTP 请求调试', desc: '自定义请求，查看状态码与响应', cat: 'network', badge: 'GET', color: '#0ea5e9', net: true, abbr: 'httpqq http', alias: '接口 api 调试 get post', tags: 'http 请求 api 调试 接口 状态码' },
	{ key: 'netinfo', name: '网络信息', desc: '网络类型、公网 IP、网络时间校准', cat: 'network', badge: 'IP', color: '#4f6ef7', net: true, abbr: 'wlxx', alias: '公网ip 归属地 网络类型 时间校准', tags: 'ip 网络 归属地 时间校准' },
	{ key: 'netrate', name: '实时汇率', desc: '免 Key 汇率查询，多源容错', cat: 'network', badge: '¥$', color: '#16a06a', net: true, abbr: 'sshl hl', alias: '汇率 美元 货币 换算 外币', tags: '汇率 换算 货币 美元 实时' },
	{ key: 'netquote', name: '每日一言', desc: '随机一句文案，支持收藏复制', cat: 'network', badge: '言', color: '#e8813a', net: true, abbr: 'mryy', alias: '文案 句子 随机 语录', tags: '一言 文案 随机 句子' },
	{ key: 'netupdate', name: '检查更新', desc: '从自定义地址读取版本信息', cat: 'network', badge: '↑', color: '#8b5cf6', net: true, abbr: 'jcgx gx', alias: '版本 升级 更新', tags: '更新 版本 升级 检查' }
]

/** tabBar 页面必须用 switchTab 打开 */
export const TAB_PAGES = [
	'/pages/index/index', '/pages/category/category', '/pages/files/files', '/pages/mine/mine'
]

export function isTabPage(url) {
	return TAB_PAGES.some(p => String(url || '').indexOf(p) === 0)
}

export function getTool(key) {
	return TOOLS.find(t => t.key === key) || null
}
export function toolsOf(cat) {
	return TOOLS.filter(t => t.cat === cat)
}
export function catName(key) {
	const c = CATEGORIES.find(x => x.key === key)
	return c ? c.name : ''
}

/** 带分类名的检索数据源（分类名也参与匹配） */
export const SEARCH_INDEX = TOOLS.map(t => Object.assign({}, t, { _catName: catName(t.cat) }))

/** 兼容旧调用：按注册表原顺序返回过滤结果；实际排序请用 smartSearch */
export function searchTools(kw) {
	return smartSearch(kw, SEARCH_INDEX)
		.map(t => TOOLS.find(x => x.key === t.key))
		.filter(Boolean)
}

export { smartSearch }
