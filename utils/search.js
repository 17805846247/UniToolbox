/**
 * 全局快速检索内核：纯函数，不依赖 uni / DOM，可直接单元测试。
 * 匹配维度：中文名、英文 key、描述、标签、分类名、别名(alias)、拼音首字母(abbr)。
 * 排序：字段权重 + 收藏 / 最近使用加权，离线工具优先。
 */
const HISTORY_KEY = 'tb_search_history'

/** 全角转半角、去多余空白、统一小写 */
export function normalize(s) {
	return String(s === undefined || s === null ? '' : s)
		.toLowerCase()
		.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
		.replace(/\u3000/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

export function splitTerms(query) {
	const q = normalize(query)
	if (!q) return []
	return q.split(' ').filter(Boolean)
}

/** 把查询词按 # 前缀解析出分类约束，例如 "#life 贷款" */
export function parseQuery(query) {
	const terms = []
	let cat = ''
	for (const part of splitTerms(query)) {
		if (part.charAt(0) === '#' && part.length > 1) cat = part.slice(1)
		else terms.push(part)
	}
	return { terms, cat }
}

function fieldScore(tool, term) {
	const name = normalize(tool.name)
	const key = normalize(tool.key)
	const abbr = normalize(tool.abbr || '')
	const alias = normalize(tool.alias || '')
	const tags = normalize(tool.tags || '')
	const desc = normalize(tool.desc || '')
	const catName = normalize(tool._catName || '')

	let best = 0
	const hit = v => { if (v > best) best = v }

	if (name === term) hit(120)
	else if (name.indexOf(term) === 0) hit(100)
	else if (name.indexOf(term) >= 0) hit(70)

	if (alias) {
		const parts = alias.split(' ')
		if (parts.indexOf(term) >= 0) hit(95)
		else if (alias.indexOf(term) >= 0) hit(62)
	}
	if (abbr) {
		const parts = abbr.split(' ')
		if (parts.indexOf(term) >= 0) hit(105)
		else if (parts.some(p => p.indexOf(term) === 0)) hit(88)
		else if (abbr.indexOf(term) >= 0) hit(56)
	}
	if (key === term) hit(92)
	else if (key.indexOf(term) >= 0) hit(54)
	if (tags.indexOf(term) >= 0) hit(40)
	if (desc.indexOf(term) >= 0) hit(24)
	if (catName && catName.indexOf(term) >= 0) hit(18)
	return best
}

/**
 * 检索并排序。
 * @param {string} query 支持空格分词(AND)、#分类 过滤
 * @param {Array} tools 工具注册表
 * @param {object} opt { categories, favs, recent, cat, limit }
 * @returns {Array} 工具对象（附带 _score / _hitField，不修改原对象）
 */
export function smartSearch(query, tools, opt) {
	const o = opt || {}
	const parsed = parseQuery(query)
	const catFilter = o.cat || parsed.cat || ''
	const list = (tools || []).filter(t => !catFilter || t.cat === catFilter)
	if (!parsed.terms.length) {
		return list.map((t, i) => Object.assign({}, t, { _score: 0, _order: i }))
			.sort((a, b) => rank(b, o) - rank(a, o) || a._order - b._order)
	}
	const out = []
	list.forEach((t, i) => {
		let total = 0
		for (const term of parsed.terms) {
			const s = fieldScore(t, term)
			if (!s) return
			total += s
		}
		out.push(Object.assign({}, t, { _score: total + rank(t, o), _order: i }))
	})
	return out.sort((a, b) => b._score - a._score || a._order - b._order)
		.slice(0, o.limit || 0 || undefined)
}

function rank(t, o) {
	let r = 0
	if (o.favs && o.favs.indexOf(t.key) >= 0) r += 12
	const ri = o.recent ? o.recent.indexOf(t.key) : -1
	if (ri >= 0) r += Math.max(1, 10 - ri)
	if (t.net) r -= 2
	return r
}

/** 命中分段：[{ t: '二维', hit: true }, ...]，供模板里高亮渲染 */
export function highlight(text, query) {
	const src = String(text === undefined || text === null ? '' : text)
	if (!src) return []
	const lower = src.toLowerCase()
	const terms = parseQuery(query).terms.filter(Boolean).sort((a, b) => b.length - a.length)
	if (!terms.length) return [{ t: src, hit: false }]
	const marks = new Array(src.length).fill(false)
	for (const term of terms) {
		let from = 0
		while (from <= lower.length - term.length) {
			const i = lower.indexOf(term, from)
			if (i < 0) break
			for (let j = i; j < i + term.length; j++) marks[j] = true
			from = i + term.length
		}
	}
	const segs = []
	for (let i = 0; i < src.length; i++) {
		const hit = marks[i]
		if (segs.length && segs[segs.length - 1].hit === hit) segs[segs.length - 1].t += src[i]
		else segs.push({ t: src[i], hit })
	}
	return segs
}

export const HOT_WORDS = ['二维码', '汇率', 'JSON', '密码', '贷款', '身份证', '水印', '农历', '正则', '图片压缩']

/* ---------- 搜索历史（本地存储，最多 10 条） ---------- */
function readStore(k) {
	try { return typeof uni !== 'undefined' && uni.getStorageSync ? uni.getStorageSync(k) : null } catch (e) { return null }
}
function writeStore(k, v) {
	try { if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync(k, v) } catch (e) {}
}

export function getHistory() {
	const v = readStore(HISTORY_KEY)
	return Array.isArray(v) ? v.slice(0, 10) : []
}
export function pushHistory(q) {
	const term = normalize(q)
	if (!term) return getHistory()
	const arr = [term].concat(getHistory().filter(x => x !== term)).slice(0, 10)
	writeStore(HISTORY_KEY, arr)
	return arr
}
export function removeHistory(q) {
	const arr = getHistory().filter(x => x !== normalize(q))
	writeStore(HISTORY_KEY, arr)
	return arr
}
export function clearHistory() {
	writeStore(HISTORY_KEY, [])
	return []
}

/** 兼容旧调用：返回按注册表原顺序的过滤结果 */
export function legacySearch(query, tools, categories) {
	const parsed = parseQuery(query)
	const withCat = (tools || []).map(t => Object.assign({}, t, {
		_catName: ((categories || []).find(c => c.key === t.cat) || {}).name || ''
	}))
	return smartSearch(query, withCat, {})
		.filter(t => !parsed.cat || t.cat === parsed.cat)
		.map(t => (tools || []).find(x => x.key === t.key))
		.filter(Boolean)
}
