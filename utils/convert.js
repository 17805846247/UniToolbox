/**
 * 纯函数工具库：编码 / 数据格式 / 进制 / 颜色 / 时间 / 单位 / 文本 / 表达式
 * 不依赖 uni、DOM 或任何第三方库，可直接在 H5、App 与 Node 中运行。
 */

/* ==================== UTF-8 与 Base64 ==================== */

export function utf8Bytes(str) {
	const s = String(str)
	const out = []
	for (let i = 0; i < s.length; i++) {
		let c = s.charCodeAt(i)
		if (c < 0x80) {
			out.push(c)
		} else if (c < 0x800) {
			out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
		} else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
			const c2 = s.charCodeAt(++i)
			const cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00)
			out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
		} else {
			out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
		}
	}
	return out
}

export function bytesToUtf8(bytes) {
	let s = ''
	for (let i = 0; i < bytes.length;) {
		const b = bytes[i++]
		if (b < 0x80) {
			s += String.fromCharCode(b)
		} else if (b < 0xe0) {
			s += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f))
		} else if (b < 0xf0) {
			s += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f))
		} else {
			const cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f)
			const v = cp - 0x10000
			s += String.fromCharCode(0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff))
		}
	}
	return s
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function bytesToBase64(bytes) {
	let out = ''
	for (let i = 0; i < bytes.length; i += 3) {
		const a = bytes[i]
		const b = i + 1 < bytes.length ? bytes[i + 1] : -1
		const c = i + 2 < bytes.length ? bytes[i + 2] : -1
		out += B64[a >> 2]
		out += B64[((a & 3) << 4) | (b < 0 ? 0 : b >> 4)]
		out += b < 0 ? '=' : B64[((b & 15) << 2) | (c < 0 ? 0 : c >> 6)]
		out += c < 0 ? '=' : B64[c & 63]
	}
	return out
}

export function base64ToBytes(str) {
	const s = String(str).replace(/[\s\r\n]/g, '').replace(/-/g, '+').replace(/_/g, '/')
	if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('Base64 格式不正确')
	const body = s.replace(/=+$/, '')
	const out = []
	for (let i = 0; i < body.length; i += 4) {
		const n = [0, 1, 2, 3].map(k => i + k < body.length ? B64.indexOf(body[i + k]) : -1)
		if (n[0] < 0 || n[1] < 0 || n[0] === -2) throw new Error('Base64 含非法字符')
		out.push((n[0] << 2) | (n[1] >> 4))
		if (n[2] >= 0) out.push(((n[1] & 15) << 4) | (n[2] >> 2))
		if (n[3] >= 0) out.push(((n[2] & 3) << 6) | n[3])
	}
	return out
}

export const b64encode = str => bytesToBase64(utf8Bytes(str))
export const b64decode = str => bytesToUtf8(base64ToBytes(str))
export const urlEncode = str => encodeURIComponent(String(str))
export const urlDecode = str => decodeURIComponent(String(str))

const hex4 = n => ('0000' + n.toString(16).toUpperCase()).slice(-4)

export function unicodeEncode(str) {
	let out = ''
	for (const ch of String(str)) {
		const c = ch.codePointAt(0)
		out += c > 127 ? (c > 0xffff ? '\\u' + hex4(0xd800 + ((c - 0x10000) >> 10)) + '\\u' + hex4(0xdc00 + ((c - 0x10000) & 0x3ff)) : '\\u' + hex4(c)) : ch
	}
	return out
}

export function unicodeDecode(str) {
	return String(str).replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

const HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export function htmlEscape(str) {
	return String(str).replace(/[&<>"']/g, c => HTML_MAP[c])
}
export function htmlUnescape(str) {
	return String(str).replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' }[k]))
}

/* ==================== JSON / CSV / YAML ==================== */

export function jsonFormat(text, indent = 2) {
	return JSON.stringify(JSON.parse(text), null, indent)
}
export function jsonMinify(text) {
	return JSON.stringify(JSON.parse(text))
}
export function jsonEscape(text) {
	return JSON.stringify(String(text)).slice(1, -1)
}
export function jsonUnescape(text) {
	return JSON.parse('"' + String(text).replace(/"/g, '\\"') + '"')
}

export function parseCsv(text, sep = ',') {
	const rows = []
	let row = [], cell = '', quoted = false
	const s = String(text).replace(/^\uFEFF/, '')
	for (let i = 0; i < s.length; i++) {
		const c = s[i]
		if (quoted) {
			if (c === '"' && s[i + 1] === '"') { cell += '"'; i++ }
			else if (c === '"') quoted = false
			else cell += c
		} else if (c === '"' && cell === '') {
			quoted = true
		} else if (c === sep) {
			row.push(cell); cell = ''
		} else if (c === '\n') {
			row.push(cell); rows.push(row); row = []; cell = ''
		} else if (c !== '\r') {
			cell += c
		}
	}
	if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
	return rows
}

export function csvToJson(text, hasHeader = true) {
	const rows = parseCsv(text).filter(r => r.some(c => c !== ''))
	if (!rows.length) return []
	const head = hasHeader ? rows[0].map((h, i) => h.trim() || ('字段' + (i + 1))) : rows[0].map((_, i) => '字段' + (i + 1))
	const body = hasHeader ? rows.slice(1) : rows
	return body.map(r => {
		const obj = {}
		head.forEach((k, i) => {
			const v = (r[i] === undefined ? '' : r[i])
			obj[k] = v !== '' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v
		})
		return obj
	})
}

function csvCell(v) {
	const s = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v))
	return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
export function jsonToCsv(arr) {
	const list = Array.isArray(arr) ? arr : [arr]
	if (!list.length) return ''
	const keys = []
	list.forEach(o => Object.keys(o || {}).forEach(k => { if (!keys.includes(k)) keys.push(k) }))
	const rows = [keys]
	list.forEach(o => rows.push(keys.map(k => csvCell(o ? o[k] : ''))))
	return rows.map(r => r.join(',')).join('\n')
}

function yamlScalar(s) {
	const v = String(s).trim()
	if (v === '' || v === 'null' || v === '~') return null
	if (v === 'true') return true
	if (v === 'false') return false
	if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
	if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) return v.slice(1, -1)
	return v
}

export function jsonToYaml(obj, indent = 0) {
	const pad = ' '.repeat(indent)
	if (obj === null) return pad + 'null\n'
	if (Array.isArray(obj)) {
		if (!obj.length) return pad + '[]\n'
		return obj.map(item => {
			if (item && typeof item === 'object') {
				const body = jsonToYaml(item, indent + 2)
				return pad + '- ' + body.slice(indent + 2).replace(/\n$/, '') + '\n'
			}
			return pad + '- ' + JSON.stringify(item) + '\n'
		}).join('')
	}
	if (typeof obj === 'object') {
		const keys = Object.keys(obj)
		if (!keys.length) return pad + '{}\n'
		return keys.map(k => {
			const v = obj[k]
			if (v && typeof v === 'object') return pad + k + ':\n' + jsonToYaml(v, indent + 2)
			return pad + k + ': ' + JSON.stringify(v) + '\n'
		}).join('')
	}
	return pad + JSON.stringify(obj) + '\n'
}

export function yamlToJson(text) {
	const lines = String(text).split(/\r?\n/)
		.filter(l => l.trim() && !/^\s*#/.test(l))
		.map(l => ({ indent: l.match(/^\s*/)[0].length, text: l.trim() }))
	function block(i, indent) {
		const isList = lines[i] && /^-\s/.test(lines[i].text)
		const result = isList ? [] : {}
		while (i < lines.length) {
			const line = lines[i]
			if (line.indent < indent) break
			if (line.indent > indent) { i++; continue }
			if (/^-\s/.test(line.text)) {
				const rest = line.text.slice(2).trim()
				const p = rest.indexOf(': ')
				if (p > 0 && Array.isArray(result)) {
					const obj = { [rest.slice(0, p)]: yamlScalar(rest.slice(p + 2)) }
					let j = i + 1
					if (lines[j] && lines[j].indent > indent) {
						const sub = block(j, lines[j].indent)
						Object.assign(obj, sub.value)
						j = sub.next
					}
					result.push(obj); i = j; continue
				}
				if (Array.isArray(result)) result.push(yamlScalar(rest))
				i++; continue
			}
			const p = line.text.indexOf(':')
			if (p < 0) { i++; continue }
			const key = line.text.slice(0, p).trim()
			const rest = line.text.slice(p + 1).trim()
			if (rest === '') {
				if (lines[i + 1] && lines[i + 1].indent > indent) {
					const sub = block(i + 1, lines[i + 1].indent)
					result[key] = sub.value; i = sub.next
				} else { result[key] = null; i++ }
			} else { result[key] = yamlScalar(rest); i++ }
		}
		return { value: result, next: i }
	}
	if (!lines.length) return {}
	return block(0, lines[0].indent).value
}

/* ==================== 进制 / 颜色 ==================== */

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function mulAdd(dec, mul, add) {
	let carry = add
	for (let i = dec.length - 1; i >= 0; i--) {
		const v = dec[i] * mul + carry
		dec[i] = v % 10
		carry = Math.floor(v / 10)
	}
	while (carry) { dec.unshift(carry % 10); carry = Math.floor(carry / 10) }
}
function divMod(dec, div) {
	let r = 0
	const q = []
	for (const d of dec) { const v = r * 10 + d; q.push(Math.floor(v / div)); r = v % div }
	while (q.length > 1 && q[0] === 0) q.shift()
	return { q, r }
}

/** 任意精度 2~36 进制互转（字符串实现，不受 2^53 精度限制） */
export function radixConvert(value, from, to) {
	const s = String(value).trim().toUpperCase().replace(/^0[XBO]/, '')
	if (!s) return ''
	if (from < 2 || from > 36 || to < 2 || to > 36) throw new Error('进制需在 2~36 之间')
	let dec = [0]
	for (const c of s) {
		const d = DIGITS.indexOf(c)
		if (d < 0 || d >= from) throw new Error('「' + c + '」不是 ' + from + ' 进制的有效数字')
		mulAdd(dec, from, d)
	}
	let out = ''
	do {
		const { q, r } = divMod(dec, to)
		out = DIGITS[r] + out
		dec = q
	} while (!(dec.length === 1 && dec[0] === 0))
	return out
}

export function hexToRgb(hex) {
	let s = String(hex).trim().replace(/^#/, '')
	if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(c => c + c).join('')
	if (!/^[0-9a-fA-F]{6}$/.test(s)) throw new Error('请输入 #RRGGBB 或 #RGB 格式的颜色')
	return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) }
}
export const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2)).join('').toUpperCase()

export function rgbToHsl(r, g, b) {
	r /= 255; g /= 255; b /= 255
	const max = Math.max(r, g, b), min = Math.min(r, g, b)
	let h = 0, s = 0
	const l = (max + min) / 2
	const d = max - min
	if (d) {
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
		if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
		else if (max === g) h = (b - r) / d + 2
		else h = (r - g) / d + 4
		h *= 60
	}
	return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function colorInfo(input) {
	const s = String(input).trim()
	let rgb
	const m = s.match(/^rgba?\(([^)]+)\)$/i)
	if (m) {
		const p = m[1].split(',').map(v => parseFloat(v))
		rgb = { r: p[0], g: p[1], b: p[2] }
	} else rgb = hexToRgb(s)
	const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
	const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
	return {
		hex,
		rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
		hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
		decimal: parseInt(hex.slice(1), 16),
		preview: hex
	}
}

/* ==================== 日期 / 时间 ==================== */

const pad2 = n => ('0' + n).slice(-2)
export function formatDate(d, withTime = true) {
	const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
	return withTime ? `${date} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` : date
}
export function tsToDate(ts) {
	const n = Number(String(ts).trim())
	if (!isFinite(n)) throw new Error('请输入数字时间戳')
	const d = new Date(n < 1e12 ? n * 1000 : n)
	if (isNaN(d.getTime())) throw new Error('时间戳超出范围')
	return { text: formatDate(d), seconds: Math.floor(d.getTime() / 1000), ms: d.getTime(), weekday: '星期' + '日一二三四五六'[d.getDay()] }
}
export function dateToTs(str) {
	const m = String(str).trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/)
	if (!m) throw new Error('日期格式应为 YYYY-MM-DD HH:mm:ss')
	const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0))
	return { seconds: Math.floor(d.getTime() / 1000), ms: d.getTime(), text: formatDate(d) }
}
export function daysBetween(a, b) {
	const p = s => { const m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (!m) throw new Error('日期格式应为 YYYY-MM-DD'); return Date.UTC(+m[1], +m[2] - 1, +m[3]) }
	return Math.round((p(b) - p(a)) / 86400000)
}
export function dateAdd(dateStr, days) {
	const m = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
	if (!m) throw new Error('日期格式应为 YYYY-MM-DD')
	return formatDate(new Date(+m[1], +m[2] - 1, +m[3] + Number(days)), false)
}

/* ==================== 单位换算 ==================== */

export const UNIT_GROUPS = {
	length: { name: '长度', units: { m: 1, km: 1000, dm: 0.1, cm: 0.01, mm: 0.001, um: 0.000001, '里': 500, '尺': 1 / 3, '寸': 1 / 30, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, '海里': 1852 } },
	weight: { name: '质量', units: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, '斤': 0.5, '两': 0.05, '钱': 0.005, lb: 0.45359237, oz: 0.0283495231 } },
	area: { name: '面积', units: { 'm²': 1, 'km²': 1000000, 'cm²': 0.0001, '公顷': 10000, '亩': 2000 / 3, 'ft²': 0.09290304 } },
	volume: { name: '体积', units: { L: 1, mL: 0.001, 'm³': 1000, 'cm³': 0.001, '加仑(美)': 3.785411784, '品脱(美)': 0.473176473 } },
	storage: { name: '存储', units: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, bit: 0.125 } },
	time: { name: '时间', units: { s: 1, ms: 0.001, min: 60, h: 3600, '天': 86400, '周': 604800 } },
	speed: { name: '速度', units: { 'm/s': 1, 'km/h': 1 / 3.6, 'mph': 0.44704, '节': 0.514444, 'ft/s': 0.3048 } },
	temperature: { name: '温度', units: { '°C': 1, '°F': 1, 'K': 1 } }
}

export function convertUnit(value, group, from, to) {
	const v = Number(value)
	if (!isFinite(v)) throw new Error('请输入有效数字')
	const g = UNIT_GROUPS[group]
	if (!g) throw new Error('未知单位类别')
	if (group === 'temperature') {
		let c
		if (from === '°C') c = v
		else if (from === '°F') c = (v - 32) * 5 / 9
		else if (from === 'K') c = v - 273.15
		else throw new Error('未知温度单位')
		if (to === '°C') return c
		if (to === '°F') return c * 9 / 5 + 32
		if (to === 'K') return c + 273.15
		throw new Error('未知温度单位')
	}
	if (!(from in g.units) || !(to in g.units)) throw new Error('未知单位')
	return v * g.units[from] / g.units[to]
}

/* ==================== 文本处理 ==================== */

export const TEXT_OPS = [
	{ key: 'upper', name: '转大写' }, { key: 'lower', name: '转小写' },
	{ key: 'trim', name: '去首尾空格' }, { key: 'spaces', name: '删除所有空格' },
	{ key: 'empty', name: '去空行' }, { key: 'dedupe', name: '行去重' },
	{ key: 'sort', name: '行排序' }, { key: 'reverse', name: '行倒序' },
	{ key: 'lines', name: '每行加序号' }, { key: 'full2half', name: '全角转半角' },
	{ key: 'half2full', name: '半角转全角' }, { key: 'revstr', name: '文字反转' }
]

export function textTransform(text, op) {
	const s = String(text)
	const lines = s.split(/\r?\n/)
	switch (op) {
		case 'upper': return s.toUpperCase()
		case 'lower': return s.toLowerCase()
		case 'trim': return lines.map(l => l.trim()).join('\n')
		case 'spaces': return s.replace(/[\s\u3000]/g, '')
		case 'empty': return lines.filter(l => l.trim()).join('\n')
		case 'dedupe': return lines.filter((l, i) => lines.indexOf(l) === i).join('\n')
		case 'sort': return lines.slice().sort().join('\n')
		case 'reverse': return lines.slice().reverse().join('\n')
		case 'lines': return lines.map((l, i) => `${i + 1}. ${l}`).join('\n')
		case 'full2half': return s.replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ')
		case 'half2full': return s.replace(/[!-~]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xfee0)).replace(/ /g, '\u3000')
		case 'revstr': return Array.from(s).reverse().join('')
		default: return s
	}
}

export function textStats(text) {
	const s = String(text)
	return {
		chars: Array.from(s).length,
		noSpace: s.replace(/\s/g, '').length,
		lines: s ? s.split(/\r?\n/).length : 0,
		words: (s.match(/[A-Za-z0-9_]+/g) || []).length,
		chinese: (s.match(/[\u4e00-\u9fa5]/g) || []).length,
		bytes: utf8Bytes(s).length
	}
}

/* ==================== 四则运算表达式（不使用 eval） ==================== */

export function calcExpression(expr) {
	const s = String(expr).replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**')
	let i = 0
	function factor() {
		if (s[i] === '+' || s[i] === '-') { const sign = s[i++] === '-' ? -1 : 1; return sign * factor() }
		if (s[i] === '(') {
			i++
			const v = expression()
			if (s[i++] !== ')') throw new Error('括号不匹配')
			return v
		}
		const m = s.slice(i).match(/^(\d+(\.\d+)?|\.\d+)/)
		if (!m) throw new Error('表达式格式有误：' + (s.slice(i) || '末尾'))
		i += m[0].length
		return parseFloat(m[0])
	}
	function power() {
		let v = factor()
		while (s.slice(i, i + 2) === '**') { i += 2; v = Math.pow(v, factor()) }
		return v
	}
	function term() {
		let v = power()
		while (s[i] === '*' || s[i] === '/' || s[i] === '%') {
			const op = s[i++], n = power()
			if (op === '*') v *= n
			else if (op === '/') { if (n === 0) throw new Error('除数不能为 0'); v /= n }
			else v %= n
		}
		return v
	}
	function expression() {
		let v = term()
		while (s[i] === '+' || s[i] === '-') { const op = s[i++], n = term(); v = op === '+' ? v + n : v - n }
		return v
	}
	const result = expression()
	if (i < s.length) throw new Error('无法识别的字符：' + s[i])
	if (!isFinite(result)) throw new Error('计算结果无效')
	return Math.round(result * 1e10) / 1e10
}

export function formatBytes(n) {
	if (!n && n !== 0) return '-'
	const u = ['B', 'KB', 'MB', 'GB', 'TB']
	let i = 0, v = Number(n)
	while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
	return (i === 0 ? v : v.toFixed(2)) + ' ' + u[i]
}
