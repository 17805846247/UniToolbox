/**
 * 新增工具的纯函数层：不依赖 uni / DOM，可在 Node 中直接单测。
 * 包含：正则测试、UUID、文本 Diff、URL 参数、JWT 解码、人民币大写、Markdown 渲染。
 */

/* ==================== 正则测试 ==================== */
export function buildRegex(pattern, flags) {
	const f = String(flags || '').replace(/[^dgimsuvy]/g, '')
	return new RegExp(pattern, f)
}

export function regexRun(pattern, flags, text, replacement = '') {
	const src = String(text == null ? '' : text)
	if (!pattern) throw new Error('请输入正则表达式')
	const re = buildRegex(pattern, flags)
	const matches = []
	if (re.global) {
		let m, guard = 0
		re.lastIndex = 0
		while ((m = re.exec(src)) !== null) {
			matches.push({ index: m.index, text: m[0], groups: m.slice(1) })
			if (m[0] === '') re.lastIndex++
			if (++guard > 1000) break
		}
	} else {
		const m = re.exec(src)
		if (m) matches.push({ index: m.index, text: m[0], groups: m.slice(1) })
	}

	let replaced = ''
	try {
		const rf = String(flags || '').indexOf('g') >= 0 ? String(flags || '') : String(flags || '') + 'g'
		replaced = src.replace(buildRegex(pattern, rf), replacement)
	} catch (e) {
		replaced = '替换失败：' + e.message
	}

	// 生成可直接用 <text> 渲染的片段，避免依赖 rich-text 对 <mark> 的支持
	const segments = []
	let pos = 0
	for (const hit of matches) {
		if (!hit.text || hit.index < pos) continue
		if (hit.index > pos) segments.push({ text: src.slice(pos, hit.index), hit: false })
		segments.push({ text: hit.text, hit: true })
		pos = hit.index + hit.text.length
	}
	if (pos < src.length) segments.push({ text: src.slice(pos), hit: false })

	return { count: matches.length, matches, segments, replaced }
}

/* ==================== 随机 ID ==================== */
export function uuidV4(rng = Math.random) {
	const b = []
	for (let i = 0; i < 16; i++) b.push(Math.floor(rng() * 256) & 255)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	const h = b.map(v => ('0' + v.toString(16)).slice(-2)).join('')
	return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20)
}

export const NANO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

export function shortId(size = 12, alphabet = NANO_ALPHABET, rng = Math.random) {
	const n = Math.max(1, Math.min(128, Number(size) || 12))
	let s = ''
	for (let i = 0; i < n; i++) s += alphabet.charAt(Math.floor(rng() * alphabet.length))
	return s
}

export function generateIds(kind = 'uuid', count = 5, opts = {}) {
	const rng = opts.rng || Math.random
	const n = Math.max(1, Math.min(50, Number(count) || 1))
	const size = Math.max(1, Math.min(128, Number(opts.size) || 12))
	const out = []
	for (let i = 0; i < n; i++) {
		if (kind === 'nano') out.push(shortId(size, NANO_ALPHABET, rng))
		else if (kind === 'hex') {
			let s = ''
			for (let j = 0; j < Math.min(size, 64); j++) s += Math.floor(rng() * 16).toString(16)
			out.push(s)
		} else if (kind === 'num') {
			let s = ''
			for (let j = 0; j < Math.min(size, 32); j++) s += Math.floor(rng() * 10)
			out.push(s)
		} else out.push(uuidV4(rng))
	}
	return out
}

/* ==================== 文本 Diff（LCS） ==================== */
export function diffLines(a, b, maxLines = 400) {
	const A = String(a == null ? '' : a).replace(/\r\n?/g, '\n').split('\n')
	const B = String(b == null ? '' : b).replace(/\r\n?/g, '\n').split('\n')
	if (A.length > maxLines || B.length > maxLines) throw new Error('单次最多对比 ' + maxLines + ' 行')
	const n = A.length, m = B.length
	const dp = []
	for (let i = 0; i <= n; i++) dp.push(new Uint16Array(m + 1))
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
		}
	}
	const rows = []
	let i = 0, j = 0, la = 1, lb = 1
	while (i < n && j < m) {
		if (A[i] === B[j]) {
			rows.push({ type: 'same', text: A[i], noA: la++, noB: lb++ }); i++; j++
		} else if (dp[i + 1][j] >= dp[i][j + 1]) {
			rows.push({ type: 'del', text: A[i++], noA: la++, noB: 0 })
		} else {
			rows.push({ type: 'add', text: B[j++], noA: 0, noB: lb++ })
		}
	}
	while (i < n) rows.push({ type: 'del', text: A[i++], noA: la++, noB: 0 })
	while (j < m) rows.push({ type: 'add', text: B[j++], noA: 0, noB: lb++ })
	return {
		rows,
		stats: {
			same: rows.filter(r => r.type === 'same').length,
			add: rows.filter(r => r.type === 'add').length,
			del: rows.filter(r => r.type === 'del').length
		}
	}
}

/* ==================== URL 参数 ==================== */
function safeDecode(s) {
	try { return decodeURIComponent(String(s).replace(/\+/g, ' ')) } catch (e) { return String(s) }
}

export function parseUrl(input) {
	const raw = String(input == null ? '' : input).trim()
	const q = raw.indexOf('?')
	const base = q >= 0 ? raw.slice(0, q) : ''
	const query = q >= 0 ? raw.slice(q + 1).split('#')[0] : raw.split('#')[0]
	const pairs = []
	if (query) {
		for (const part of query.split('&')) {
			if (!part) continue
			const eq = part.indexOf('=')
			const k = eq >= 0 ? part.slice(0, eq) : part
			const v = eq >= 0 ? part.slice(eq + 1) : ''
			pairs.push({ key: safeDecode(k), value: safeDecode(v) })
		}
	}
	return { base, pairs, count: pairs.length }
}

export function buildQuery(pairs, encode = true) {
	return (pairs || [])
		.filter(p => p && String(p.key == null ? '' : p.key).length > 0)
		.map(p => {
			const k = String(p.key), v = String(p.value == null ? '' : p.value)
			return (encode ? encodeURIComponent(k) : k) + '=' + (encode ? encodeURIComponent(v) : v)
		})
		.join('&')
}

export function queryToObject(pairs) {
	const o = {}
	for (const p of pairs || []) {
		const k = String(p.key)
		if (k in o) o[k] = Array.isArray(o[k]) ? o[k].concat([p.value]) : [o[k], p.value]
		else o[k] = p.value
	}
	return o
}

/* ==================== JWT 解码（本地，不验签） ==================== */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function b64urlToBytes(s) {
	let str = String(s || '').replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
	while (str.length % 4) str += '='
	const out = []
	for (let i = 0; i < str.length; i += 4) {
		const c0 = B64.indexOf(str[i]), c1 = B64.indexOf(str[i + 1])
		const c2 = str[i + 2] === '=' ? -1 : B64.indexOf(str[i + 2])
		const c3 = str[i + 3] === '=' ? -1 : B64.indexOf(str[i + 3])
		if (c0 < 0 || c1 < 0 || c2 === -2 || c3 === -2) throw new Error('Base64Url 含非法字符')
		const n = (c0 << 18) | (c1 << 12) | ((c2 < 0 ? 0 : c2) << 6) | (c3 < 0 ? 0 : c3)
		out.push((n >>> 16) & 255)
		if (c2 >= 0) out.push((n >>> 8) & 255)
		if (c3 >= 0) out.push(n & 255)
	}
	return out
}

function bytesToUtf8(bytes) {
	let s = ''
	for (const b of bytes) s += '%' + ('0' + b.toString(16)).slice(-2)
	try { return decodeURIComponent(s) } catch (e) { return bytes.map(b => String.fromCharCode(b)).join('') }
}

export function decodeJwt(token) {
	const parts = String(token == null ? '' : token).trim().replace(/^Bearer\s+/i, '').split('.')
	if (parts.length < 2 || parts.length > 3) throw new Error('JWT 应为 header.payload.signature 三段')
	const parse = seg => {
		const txt = bytesToUtf8(b64urlToBytes(seg))
		try { return JSON.parse(txt) } catch (e) { throw new Error('分段不是合法 JSON：' + e.message) }
	}
	return { header: parse(parts[0]), payload: parse(parts[1]), signature: parts[2] || '' }
}

/* ==================== 人民币大写 ==================== */
const CN_NUM = '零壹贰叁肆伍陆柒捌玖'
const CN_UNIT = ['', '拾', '佰', '仟']
const CN_SEC = ['', '万', '亿', '兆']

function sectionToCn(n) {
	const str = String(n)
	let s = '', zero = false
	for (let i = 0; i < str.length; i++) {
		const d = Number(str[i]), pos = str.length - i - 1
		if (d === 0) { zero = true }
		else {
			if (zero && s) s += '零'
			zero = false
			s += CN_NUM[d] + CN_UNIT[pos]
		}
	}
	return s
}

export function rmbUpper(input) {
	const raw = String(input == null ? '' : input).trim().replace(/[,，\s¥￥]/g, '')
	if (!/^-?\d+(\.\d+)?$/.test(raw)) throw new Error('请输入有效金额，如 1234.56')
	const n = Number(raw)
	if (!isFinite(n)) throw new Error('金额超出可计算范围')
	if (Math.abs(n) >= 1e16) throw new Error('金额过大（支持到千万亿）')
	const neg = n < 0
	let v = Math.round(Math.abs(n) * 100) / 100
	let intPart = Math.floor(v)
	const cents = Math.round((v - intPart) * 100)
	const jiao = Math.floor(cents / 10), fen = cents % 10

	let intCn
	if (intPart === 0) intCn = '零'
	else {
		const secs = []
		let t = intPart
		while (t > 0) { secs.push(t % 10000); t = Math.floor(t / 10000) }
		const parts = []
		for (let i = secs.length - 1; i >= 0; i--) {
			const sec = secs[i]
			if (sec === 0) {
				if (parts.length && parts[parts.length - 1] !== '零') parts.push('零')
				continue
			}
			let seg = sectionToCn(sec)
			if (i < secs.length - 1 && sec < 1000 && parts.length) seg = '零' + seg
			parts.push(seg + CN_SEC[i])
		}
		intCn = parts.join('').replace(/零{2,}/g, '零').replace(/零+$/, '')
	}

	let s = (neg ? '负' : '') + intCn + '元'
	if (jiao === 0 && fen === 0) s += '整'
	else {
		if (jiao > 0) s += CN_NUM[jiao] + '角'
		else s += '零'
		if (fen > 0) s += CN_NUM[fen] + '分'
	}
	return s
}

/* ==================== Markdown ==================== */
export function escapeHtml(s) {
	return String(s == null ? '' : s)
		.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function markdownToHtml(md) {
	const lines = String(md == null ? '' : md).replace(/\r\n?/g, '\n').split('\n')
	const out = []
	let inCode = false, codeBuf = [], listType = ''
	const inline = t => {
		let s = escapeHtml(t)
		s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
		s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>')
		s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
		s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
		return s
	}
	const closeList = () => { if (listType) { out.push('</' + listType + '>'); listType = '' } }
	for (const ln of lines) {
		if (/^```/.test(ln)) {
			closeList()
			if (inCode) { out.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>'); codeBuf = [] }
			inCode = !inCode
			continue
		}
		if (inCode) { codeBuf.push(ln); continue }
		if (/^\s*$/.test(ln)) { closeList(); continue }
		let m
		if ((m = ln.match(/^(#{1,6})\s+(.*)$/))) {
			closeList(); const l = m[1].length
			out.push('<h' + l + '>' + inline(m[2]) + '</h' + l + '>'); continue
		}
		if (/^\s*([-*_])\1{2,}\s*$/.test(ln)) { closeList(); out.push('<hr/>'); continue }
		if ((m = ln.match(/^>\s?(.*)$/))) { closeList(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue }
		if ((m = ln.match(/^\s*[-*+]\s+(.*)$/))) {
			if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul' }
			out.push('<li>' + inline(m[1]) + '</li>'); continue
		}
		if ((m = ln.match(/^\s*\d+[.)]\s+(.*)$/))) {
			if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol' }
			out.push('<li>' + inline(m[1]) + '</li>'); continue
		}
		closeList()
		out.push('<p>' + inline(ln) + '</p>')
	}
	if (inCode) out.push('<pre><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>')
	closeList()
	return out.join('\n')
}
