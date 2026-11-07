/**
 * 2.1 新增工具的纯函数层（零依赖、可离线、可单测）。
 *
 * 灵感来自 GitHub 上的同类离线工具箱：
 *  - DevDeck 的「Command Playground」粘贴即识别 → detectText / 智能识别
 *  - Kit、DevDeck 的 Cron 解析器                → parseCron
 *  - DevDeck 的密码强度与破解时间估算           → passwordStrength
 *  - 经典离线工具箱的摩斯电码                   → morseEncode / morseDecode
 *  - Toolbox-Android 的 Tip / Bill Split         → splitBill
 *
 * 本文件不引用 uni / DOM / 任何第三方库，可直接在 Node 里跑单元测试。
 */

/* ============================================================
   1. 智能识别：粘贴任意文本，判断它是什么，并给出该用哪个工具
   ============================================================ */

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function b64ToBytes(s) {
	const out = []
	for (let i = 0; i < s.length; i += 4) {
		const c0 = B64_CHARS.indexOf(s[i])
		const c1 = B64_CHARS.indexOf(s[i + 1])
		const c2 = s[i + 2] === '=' ? -1 : B64_CHARS.indexOf(s[i + 2])
		const c3 = s[i + 3] === '=' ? -1 : B64_CHARS.indexOf(s[i + 3])
		if (c0 < 0 || c1 < 0 || c2 === -2 || c3 === -2) return null
		out.push(((c0 << 2) | (c1 >> 4)) & 255)
		if (c2 >= 0) out.push((((c1 & 15) << 4) | (c2 >> 2)) & 255)
		if (c3 >= 0) out.push((((c2 & 3) << 6) | c3) & 255)
	}
	return out
}

/** 手工 UTF-8 解码：不依赖 TextDecoder（部分 App WebView 没有） */
function utf8Decode(bytes) {
	let s = ''
	for (let i = 0; i < bytes.length;) {
		const b = bytes[i]
		if (b < 0x80) { s += String.fromCharCode(b); i++; continue }
		let n = 0, cp = 0
		if (b >= 0xc2 && b <= 0xdf) { n = 2; cp = b & 0x1f }
		else if (b >= 0xe0 && b <= 0xef) { n = 3; cp = b & 0x0f }
		else if (b >= 0xf0 && b <= 0xf4) { n = 4; cp = b & 0x07 }
		else return null
		if (i + n > bytes.length) return null
		for (let j = 1; j < n; j++) {
			const c = bytes[i + j]
			if ((c & 0xc0) !== 0x80) return null
			cp = (cp << 6) | (c & 0x3f)
		}
		if (cp > 0x10ffff) return null
		s += cp > 0xffff
			? String.fromCharCode(0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff))
			: String.fromCharCode(cp)
		i += n
	}
	return s
}

export function base64DecodeText(s) {
	const v = String(s || '')
	if (!v || v.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(v)) return null
	const bytes = b64ToBytes(v)
	if (!bytes) return null
	return utf8Decode(bytes)
}

function jsonDepth(v, d = 1) {
	if (!v || typeof v !== 'object') return d
	let max = d
	for (const k of Object.keys(v)) {
		const c = jsonDepth(v[k], d + 1)
		if (c > max) max = c
		if (max > 12) break
	}
	return max
}

function utf8Len(s) {
	let n = 0
	for (const ch of s) {
		const c = ch.codePointAt(0)
		n += c <= 0x7f ? 1 : c <= 0x7ff ? 2 : c <= 0xffff ? 3 : 4
	}
	return n
}

function textStats(s) {
	const lines = s ? s.split(/\r\n|\r|\n/).length : 0
	const cn = (s.match(/[\u3400-\u9fff]/g) || []).length
	const words = s ? (s.match(/[A-Za-z0-9_]+|[\u3400-\u9fff]/g) || []).length : 0
	return {
		chars: s.length,
		charsNoSpace: s.replace(/\s/g, '').length,
		lines, words, chinese: cn,
		bytes: utf8Len(s)
	}
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/

/**
 * 识别一段文本。返回：
 * { empty, type, label, summary, toolKey, confidence, facts, candidates, stats }
 * candidates 为全部候选（按置信度降序），facts 为主类型的解读明细。
 */
export function detectText(raw) {
	const s = String(raw === undefined || raw === null ? '' : raw).trim()
	const stats = textStats(s)
	const empty = s.length === 0
	const cands = []
	const add = (o) => cands.push(Object.assign({ facts: [] }, o))

	if (empty) {
		return { empty: true, type: 'empty', label: '等待输入', summary: '粘贴或输入任意内容即可自动识别', toolKey: '', confidence: 0, facts: [], candidates: [], stats }
	}

	// --- 高辨识度格式优先 ---
	if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s)) {
		const parts = s.split('.')
		add({ type: 'jwt', label: 'JWT 令牌', confidence: 99, toolKey: 'jwt',
			summary: '三段式 JWT，可本地查看 Header 与 Payload（不验签、不上传）',
			facts: [{ k: '段数', v: '3 段 · Header / Payload / Signature' }, { k: 'Header 长度', v: parts[0].length + ' 字符' }, { k: '载荷长度', v: parts[1].length + ' 字符' }, { k: '总长度', v: s.length + ' 字符' }] })
	}

	if (/^[{\[][\s\S]*[}\]]$/.test(s)) {
		try {
			const v = JSON.parse(s)
			const isArr = Array.isArray(v)
			const n = isArr ? v.length : Object.keys(v || {}).length
			add({ type: 'json', label: 'JSON 数据', confidence: 97, toolKey: 'json',
				summary: (isArr ? '数组' : '对象') + '，' + n + ' 个' + (isArr ? '元素' : '顶层字段') + '，可直接格式化或转 CSV/YAML',
				facts: [{ k: '类型', v: isArr ? 'Array' : typeof v }, { k: isArr ? '元素数' : '顶层字段', v: String(n) }, { k: '最大嵌套深度', v: String(jsonDepth(v)) }, { k: '长度', v: s.length + ' 字符' }] })
		} catch (e) {
			add({ type: 'json-invalid', label: '疑似 JSON（格式有误）', confidence: 55, toolKey: 'json',
				summary: '看起来像 JSON 但解析失败，可用 JSON 格式化工具定位问题',
				facts: [{ k: '提示', v: '检查引号、尾逗号与括号是否配对' }] })
		}
	}

	const dataUrl = s.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i)
	if (dataUrl) {
		add({ type: 'dataurl', label: '图片 DataURL', confidence: 98, toolKey: 'imagebase64',
			summary: '内嵌的 ' + dataUrl[1] + ' 图片，可还原成图片预览',
			facts: [{ k: 'MIME', v: dataUrl[1] }, { k: 'Base64 长度', v: dataUrl[2].replace(/\s/g, '').length + ' 字符' }] })
	}

	if (/^https?:\/\/\S+$/i.test(s)) {
		let q = 0, host = '', path = ''
		try {
			// 不依赖 URL 类（H5 / App 都可用，但这里手工解析更可控）
			const m = s.match(/^https?:\/\/([^/?#]+)([^?#]*)(?:\?([^#]*))?/i)
			host = m ? m[1] : ''
			path = m ? m[2] : ''
			q = m && m[3] ? m[3].split('&').filter(Boolean).length : 0
		} catch (e) {}
		add({ type: 'url', label: '网址 / URL', confidence: 96, toolKey: 'url',
			summary: q ? '含 ' + q + ' 个查询参数，可拆解、编码或重新拼装' : '可直接解析域名、路径与查询参数',
			facts: [{ k: '域名', v: host || '—' }, { k: '路径', v: path || '/' }, { k: '查询参数', v: q + ' 个' }, { k: '协议', v: /^https/i.test(s) ? 'HTTPS' : 'HTTP' }] })
	}

	if (/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) {
		add({ type: 'color', label: 'HEX 颜色值', confidence: 95, toolKey: 'color',
			summary: '可转换为 RGB / HSL 并预览色块',
			facts: [{ k: '写法', v: s.replace('#', '').length + ' 位 HEX' }, { k: '建议', v: '去「颜色转换」查看 RGB / HSL' }] })
	}

	if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) {
		add({ type: 'uuid', label: 'UUID', confidence: 95, toolKey: 'uuid',
			summary: '标准 UUID，可校验版本并批量生成同类 ID',
			facts: [{ k: '版本', v: 'v' + s[14] }, { k: '长度', v: '36 字符' }] })
	}

	if (/^1[3-9]\d{9}$/.test(s)) {
		add({ type: 'phone', label: '中国大陆手机号', confidence: 92, toolKey: 'text',
			summary: '11 位手机号格式合法，可用文本工具做脱敏处理',
			facts: [{ k: '号段', v: s.slice(0, 3) }, { k: '脱敏', v: s.slice(0, 3) + '****' + s.slice(7) }] })
	}

	if (/^\d{17}[\dXx]$/.test(s) || /^\d{15}$/.test(s)) {
		add({ type: 'idcard', label: '身份证号码', confidence: 93, toolKey: 'idcard',
			summary: '可校验校验码，并解析出生日期、性别与地区',
			facts: [{ k: '位数', v: s.length + ' 位' }, { k: '出生日期', v: s.length === 18 ? s.slice(6, 14).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '19' + s.slice(6, 12).replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3') }] })
	}

	const cidr = s.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/)
	if (cidr && IPV4.test(cidr[1])) {
		const prefix = cidr[2] === undefined ? 32 : Number(cidr[2])
		add({ type: 'ip', label: prefix < 32 ? 'IPv4 / CIDR 网段' : 'IPv4 地址', confidence: 94, toolKey: 'ipcalc',
			summary: '可计算掩码、网络号、广播地址与可用主机数',
			facts: [{ k: '地址', v: cidr[1] }, { k: '前缀', v: '/' + prefix }, { k: '类型', v: /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(cidr[1]) ? '私有地址' : '公网地址' }] })
	}

	if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 80) {
		add({ type: 'email', label: '邮箱地址', confidence: 90, toolKey: 'text',
			summary: '格式合法的邮箱，可提取域名或做脱敏',
			facts: [{ k: '域名', v: s.split('@')[1] }, { k: '长度', v: s.length + ' 字符' }] })
	}

	if (/^\d{10}$|^\d{13}$/.test(s)) {
		const ms = s.length === 10 ? Number(s) * 1000 : Number(s)
		const d = new Date(ms)
		if (!isNaN(d.getTime()) && d.getFullYear() >= 1970 && d.getFullYear() <= 2200) {
			const p = n => String(n).padStart(2, '0')
			add({ type: 'timestamp', label: s.length === 10 ? 'Unix 时间戳（秒）' : 'Unix 时间戳（毫秒）', confidence: 94, toolKey: 'timestamp',
				summary: '对应 ' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '，可双向转换',
				facts: [{ k: '单位', v: s.length === 10 ? '秒' : '毫秒' }, { k: '本地时间', v: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) }, { k: '毫秒值', v: String(ms) }] })
		}
	}

	const cronParts = s.split(/\s+/)
	if (cronParts.length >= 5 && cronParts.length <= 6 && /^[0-9*,/\-?A-Za-z#]+$/.test(s.replace(/\s/g, ''))) {
		add({ type: 'cron', label: 'Cron 表达式', confidence: 84, toolKey: 'cron',
			summary: cronParts.length + ' 段定时任务表达式，可解析含义并推算下次执行时间',
			facts: [{ k: '字段数', v: cronParts.length + ' 段' }, { k: '表达式', v: s }] })
	}

	if (/^[.\-/\s]+$/.test(s) && /[.\-]/.test(s) && s.replace(/\s/g, '').length >= 2) {
		add({ type: 'morse', label: '摩斯电码', confidence: 88, toolKey: 'morse',
			summary: '只含点划与分隔符，可解码为文字',
			facts: [{ k: '符号数', v: String(s.replace(/[\s/]/g, '').length) }, { k: '建议', v: '去「摩斯电码」解码' }] })
	}

	if (s.length >= 8 && s.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s)) {
		const dec = base64DecodeText(s)
		if (dec && dec.length) {
			const printable = dec.split('').filter(ch => {
				const c = ch.charCodeAt(0)
				return c >= 0x20 || ch === '\n' || ch === '\t' || ch === '\r'
			}).length / dec.length
			if (printable > 0.85) {
				add({ type: 'base64', label: 'Base64 编码文本', confidence: 86, toolKey: 'encoding',
					summary: '解码后为「' + dec.slice(0, 24).replace(/\n/g, ' ') + (dec.length > 24 ? '…' : '') + '」',
					facts: [{ k: '原始长度', v: s.length + ' 字符' }, { k: '解码长度', v: dec.length + ' 字符' }, { k: '解码预览', v: dec.slice(0, 60) }] })
			}
		}
	}

	if (/\r|\n/.test(s) && /[,;\t]/.test(s) && s.split(/\r\n|\r|\n/).length >= 2) {
		const rows = s.split(/\r\n|\r|\n/).filter(Boolean)
		add({ type: 'csv', label: '表格 / CSV 文本', confidence: 78, toolKey: 'table',
			summary: rows.length + ' 行分隔数据，可转成 JSON 或 YAML',
			facts: [{ k: '行数', v: String(rows.length) }, { k: '首行', v: rows[0].slice(0, 50) }] })
	}

	if (/^-?\d+(\.\d{1,2})?$/.test(s) && Math.abs(Number(s)) < 1e12) {
		add({ type: 'amount', label: '金额数字', confidence: 70, toolKey: 'rmb',
			summary: '可转换成人民币中文大写（含角分）',
			facts: [{ k: '数值', v: s }, { k: '建议', v: '去「人民币大写」转换' }] })
	}

	// 兜底：纯文本，永远至少有一个结果
	add({ type: 'text', label: '普通文本', confidence: 30, toolKey: 'text',
		summary: '共 ' + stats.chars + ' 字符 / ' + stats.lines + ' 行，可做大小写、去重、排序与统计',
		facts: [{ k: '字符数', v: String(stats.chars) }, { k: '不含空格', v: String(stats.charsNoSpace) }, { k: '行数', v: String(stats.lines) }, { k: '中文字符', v: String(stats.chinese) }, { k: 'UTF-8 字节', v: String(stats.bytes) }] })

	cands.sort((a, b) => b.confidence - a.confidence)
	const top = cands[0]
	return {
		empty: false, type: top.type, label: top.label, summary: top.summary,
		toolKey: top.toolKey, confidence: top.confidence,
		facts: top.facts, candidates: cands, stats
	}
}

/* ============================================================
   2. Cron 表达式解析
   ============================================================ */

const CRON_FIELDS = [
	{ key: 'minute', name: '分钟', min: 0, max: 59, unit: '分' },
	{ key: 'hour', name: '小时', min: 0, max: 23, unit: '时' },
	{ key: 'day', name: '日', min: 1, max: 31, unit: '日' },
	{ key: 'month', name: '月', min: 1, max: 12, unit: '月' },
	{ key: 'week', name: '星期', min: 0, max: 7, unit: '周' }
]

const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

function parseCronField(part, def) {
	const all = part === '*' || part === '?'
	let values = []
	if (all) {
		const lo = def.key === 'week' ? 0 : def.min
		for (let i = lo; i <= def.max; i++) values.push(i)
	} else {
		for (const seg of part.split(',')) {
			let step = 1, range = seg
			if (seg.indexOf('/') >= 0) {
				const p = seg.split('/')
				range = p[0]
				step = Number(p[1])
				if (!Number.isFinite(step) || step < 1) throw new Error(def.name + '字段步长无效：' + seg)
			}
			let lo, hi
			if (range === '*' || range === '?') { lo = def.min; hi = def.max }
			else if (range.indexOf('-') > 0) {
				const p = range.split('-')
				lo = Number(p[0]); hi = Number(p[1])
			} else { lo = Number(range); hi = step > 1 || seg.indexOf('/') >= 0 ? def.max : lo }
			if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) throw new Error(def.name + '字段范围无效：' + seg)
			if (lo < def.min || hi > def.max) throw new Error(def.name + '字段超出范围（' + def.min + '-' + def.max + '）：' + seg)
			for (let i = lo; i <= hi; i += step) values.push(i)
		}
	}
	values = Array.from(new Set(values)).sort((a, b) => a - b)
	return { key: def.key, name: def.name, raw: part, isAll: all, values, unit: def.unit }
}

function describeCron(fields) {
	const [mi, hh, dd, mo, ww] = fields
	const time = (mi.isAll ? '每分钟' : '第 ' + mi.values.join('、') + ' 分')
	const hour = hh.isAll ? '' : ' ' + hh.values.join('、') + ' 点'
	const everyMin = mi.values.length === 1 && hh.isAll && dd.isAll && mo.isAll && ww.isAll
	if (mi.raw.indexOf('*/') === 0 && hh.isAll && dd.isAll && mo.isAll && ww.isAll) {
		return '每 ' + mi.raw.slice(2) + ' 分钟执行一次'
	}
	if (everyMin) return '每小时的第 ' + mi.values[0] + ' 分执行'
	if (mi.values.length === 1 && hh.values.length === 1 && dd.isAll && mo.isAll && ww.isAll) {
		const p = n => String(n).padStart(2, '0')
		return '每天 ' + p(hh.values[0]) + ':' + p(mi.values[0]) + ' 执行'
	}
	if (mi.values.length === 1 && hh.values.length === 1 && dd.isAll && mo.isAll && !ww.isAll) {
		const p = n => String(n).padStart(2, '0')
		const days = ww.values.map(v => WEEK_CN[v === 7 ? 0 : v]).join('、')
		return '每周' + days + ' ' + p(hh.values[0]) + ':' + p(mi.values[0]) + ' 执行'
	}
	let s = time + hour
	if (!dd.isAll) s += '，每月 ' + dd.values.join('、') + ' 日'
	if (!mo.isAll) s += '，仅限 ' + mo.values.join('、') + ' 月'
	if (!ww.isAll) s += '，周' + ww.values.map(v => WEEK_CN[v === 7 ? 0 : v]).join('、')
	return s + ' 执行'
}

function fmtDate(d) {
	const p = n => String(n).padStart(2, '0')
	return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
		' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ' 周' + WEEK_CN[d.getDay()]
}

/**
 * 解析 5 段 cron，推算未来 N 次执行时间。
 * opts: { count = 5, from = new Date(), maxDays = 366 }
 */
export function parseCron(expr, opts = {}) {
	const raw = String(expr || '').trim()
	const count = Math.max(1, Math.min(20, Number(opts.count) || 5))
	const maxDays = Math.max(1, Math.min(366, Number(opts.maxDays) || 366))
	const from = opts.from instanceof Date ? opts.from : new Date(opts.from === undefined ? Date.now() : opts.from)
	const parts = raw.split(/\s+/).filter(Boolean)
	if (parts.length !== 5) {
		return { valid: false, error: '需要 5 段表达式（分 时 日 月 周），当前 ' + parts.length + ' 段', expr: raw, fields: [], human: '', next: [] }
	}
	let fields
	try { fields = parts.map((p, i) => parseCronField(p, CRON_FIELDS[i])) }
	catch (e) { return { valid: false, error: e.message, expr: raw, fields: [], human: '', next: [] } }

	const [mi, hh, dd, mo, ww] = fields
	const miSet = new Set(mi.values), hhSet = new Set(hh.values)
	const ddSet = new Set(dd.values), moSet = new Set(mo.values)
	const wwSet = new Set(ww.values)
	if (wwSet.has(7)) wwSet.add(0)

	// 从下一分钟开始逐分钟扫描；day 与 week 采用标准 cron 的 OR 语义
	const start = Math.floor(from.getTime() / 60000) * 60000 + 60000
	const limit = start + maxDays * 24 * 60 * 60000
	const next = []
	let t = start
	while (t <= limit && next.length < count) {
		const d = new Date(t)
		if (!hhSet.has(d.getHours()) || !miSet.has(d.getMinutes()) || !moSet.has(d.getMonth() + 1)) { t += 60000; continue }
		const dayOk = dd.isAll ? true : ddSet.has(d.getDate())
		const weekOk = ww.isAll ? true : wwSet.has(d.getDay())
		const dateOk = (!dd.isAll && !ww.isAll) ? (dayOk || weekOk) : (dayOk && weekOk)
		if (!dateOk) { t += 60000; continue }
		next.push({ ts: t, text: fmtDate(d) })
		t += 60000
	}
	return {
		valid: true, error: '', expr: raw, fields,
		human: describeCron(fields), next,
		scanned: next.length ? '已推算未来 ' + next.length + ' 次' : '未来 ' + maxDays + ' 天内没有匹配的执行时间'
	}
}

export const CRON_PRESETS = [
	{ name: '每分钟', expr: '* * * * *' },
	{ name: '每 5 分钟', expr: '*/5 * * * *' },
	{ name: '每整点', expr: '0 * * * *' },
	{ name: '每天 9:00', expr: '0 9 * * *' },
	{ name: '工作日 9:30', expr: '30 9 * * 1-5' },
	{ name: '每周一 8:00', expr: '0 8 * * 1' },
	{ name: '每月 1 号', expr: '0 0 1 * *' },
	{ name: '每季首日', expr: '0 0 1 1,4,7,10 *' }
]

/* ============================================================
   3. 密码强度
   ============================================================ */

const WEAK_WORDS = [
	'123456', '123456789', '12345678', '123123', '111111', '000000', '654321',
	'password', 'passw0rd', 'p@ssw0rd', 'qwerty', 'qwerty123', 'abc123', 'admin',
	'admin123', 'iloveyou', 'letmein', 'welcome', 'monkey', 'dragon', '11111111',
	'woaini', '5201314', 'a123456', '123456a', 'qazwsx', '1q2w3e4r', 'root', 'test123'
]

function formatCrackTime(sec) {
	if (!isFinite(sec) || sec > 1e30) return '几乎不可能被暴力破解'
	const Y = 31557600
	if (sec < 1) return '瞬间'
	if (sec < 60) return Math.round(sec) + ' 秒'
	if (sec < 3600) return Math.round(sec / 60) + ' 分钟'
	if (sec < 86400) return Math.round(sec / 3600) + ' 小时'
	if (sec < Y) return Math.round(sec / 86400) + ' 天'
	if (sec < Y * 1000) return Math.round(sec / Y) + ' 年'
	if (sec < Y * 1e6) return (sec / Y / 1000).toFixed(1) + ' 千年'
	if (sec < Y * 1e9) return (sec / Y / 1e6).toFixed(1) + ' 百万年'
	return (sec / Y / 1e9).toFixed(1) + ' 十亿年'
}

/** 返回熵、评分、等级、破解时间估算与改进建议。纯本地计算，不上传密码。 */
export function passwordStrength(pwd) {
	const s = String(pwd || '')
	const len = [...s].length
	let pool = 0
	const classes = []
	if (/[a-z]/.test(s)) { pool += 26; classes.push('小写字母') }
	if (/[A-Z]/.test(s)) { pool += 26; classes.push('大写字母') }
	if (/[0-9]/.test(s)) { pool += 10; classes.push('数字') }
	if (/[^A-Za-z0-9]/.test(s)) { pool += 32; classes.push('符号') }
	if (pool === 0 && len) pool = 1
	const entropy = len * Math.log2(pool)
	const issues = [], suggestions = []
	if (len === 0) {
		return {
			length: 0, pool: 0, classes: [], entropy: 0, score: 0, level: '很弱',
			issues: ['尚未输入密码'], suggestions: ['请输入要检测的密码'],
			crackSec: 0, crackTime: '—', empty: true
		}
	}
	const low = s.toLowerCase()

	let penalty = 0
	const weak = WEAK_WORDS.find(w => low === w || (low.includes(w) && len <= w.length + 3))
	if (weak) { penalty += 40; issues.push('包含常见弱口令「' + weak + '」'); suggestions.push('避免使用常见单词、生日与连续数字') }
	if (/(.)\1{2,}/.test(s)) { penalty += 12; issues.push('存在连续重复字符'); suggestions.push('减少 aaa / 111 这类重复片段') }
	if (/(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf)/i.test(s)) {
		penalty += 10; issues.push('存在键盘顺序 / 连续序列'); suggestions.push('不要使用 1234、qwer 等顺序组合')
	}
	if (len < 8) { penalty += 18; issues.push('长度不足 8 位'); suggestions.push('长度建议至少 12 位') }
	else if (len < 12) { penalty += 6; issues.push('长度偏短'); suggestions.push('拉长到 12 位以上比堆符号更有效') }
	if (classes.length < 3) { penalty += 10; issues.push('字符种类偏少'); suggestions.push('混合大小写字母、数字与符号') }
	if (/^\d+$/.test(s)) { penalty += 14; issues.push('纯数字密码'); suggestions.push('纯数字极易被爆破，请加入字母') }
	if (!suggestions.length) suggestions.push('强度不错：请为每个站点使用不同密码，并妥善保管')

	const score = Math.max(0, Math.min(100, Math.round(entropy / 90 * 100) - penalty))
	const level = score < 20 ? '很弱' : score < 40 ? '弱' : score < 60 ? '一般' : score < 80 ? '强' : '极强'
	const crackSec = Math.pow(2, Math.max(0, entropy - 1)) / 1e10
	return {
		length: len, pool, classes, entropy: Math.round(entropy * 10) / 10,
		score, level, issues, suggestions,
		crackSec, crackTime: formatCrackTime(crackSec),
		empty: len === 0
	}
}

/* ============================================================
   4. 摩斯电码（ITU 标准：A-Z / 0-9 / 常用标点）
   ============================================================ */

const MORSE = {
	A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
	I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
	Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
	Y: '-.--', Z: '--..',
	0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
	6: '-....', 7: '--...', 8: '---..', 9: '----.',
	'.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
	'-': '-....-', '(': '-.--.', ')': '-.--.-', ':': '---...', '=': '-...-',
	'+': '.-.-.', '@': '.--.-.', "'": '.----.', '"': '.-..-.'
}
const MORSE_REV = Object.keys(MORSE).reduce((o, k) => { o[MORSE[k]] = k; return o }, {})

export function morseEncode(text) {
	const s = String(text || '').toUpperCase()
	const unsupported = []
	const words = s.split(/\s+/).filter(Boolean).map(w =>
		[...w].map(ch => {
			if (MORSE[ch]) return MORSE[ch]
			if (!unsupported.includes(ch)) unsupported.push(ch)
			return ''
		}).filter(Boolean).join(' ')
	).filter(Boolean)
	return { code: words.join(' / '), unsupported }
}

export function morseDecode(code) {
	const s = String(code || '').trim()
	const invalid = []
	const text = s.split(/\s*\/\s*/).map(word =>
		word.trim().split(/\s+/).filter(Boolean).map(sym => {
			const ch = MORSE_REV[sym]
			if (ch) return ch
			if (!invalid.includes(sym)) invalid.push(sym)
			return ''
		}).join('')
	).join(' ')
	return { text, invalid }
}

export const MORSE_TABLE = MORSE

/* ============================================================
   5. AA 分账 / 小费（整数「分」运算，避免浮点误差）
   ============================================================ */

/**
 * opts: { total, people, tipPercent = 0, round = 'cent' | 'yuan' }
 * round='cent' 精确到分，余下 1 分依次分给前几位；
 * round='yuan' 每人向上取整到整元，overpay 为多收的金额。
 */
export function splitBill(opts = {}) {
	const total = Number(opts.total)
	const people = Math.floor(Number(opts.people))
	const tipPercent = Math.max(0, Math.min(100, Number(opts.tipPercent) || 0))
	const round = opts.round === 'yuan' ? 'yuan' : 'cent'
	if (!isFinite(total) || total < 0) throw new Error('请输入有效的账单金额')
	if (!isFinite(people) || people < 1 || people > 999) throw new Error('人数需为 1-999 的整数')

	const totalCents = Math.round(total * 100)
	const tipCents = Math.round(totalCents * tipPercent / 100)
	const grandCents = totalCents + tipCents

	let shares, overpay = 0
	if (round === 'yuan') {
		const eachYuan = Math.ceil(grandCents / people / 100)
		shares = Array.from({ length: people }, () => eachYuan * 100)
		overpay = shares.reduce((a, b) => a + b, 0) - grandCents
	} else {
		const base = Math.floor(grandCents / people)
		const rest = grandCents - base * people
		shares = Array.from({ length: people }, (_, i) => base + (i < rest ? 1 : 0))
	}
	const yuan = c => (c / 100).toFixed(2)
	return {
		total: yuan(totalCents), tip: yuan(tipCents), grand: yuan(grandCents),
		tipPercent, people, round,
		each: yuan(shares[0]),
		shares: shares.map((c, i) => ({ index: i + 1, amount: yuan(c), cents: c })),
		overpay: yuan(overpay),
		remainderCents: round === 'cent' ? grandCents % people : 0,
		balanced: round === 'cent' ? shares.reduce((a, b) => a + b, 0) === grandCents : true
	}
}
