/**
 * 统一网络层。
 * 铁律：联网开关默认关闭；开关关闭时任何请求都不会发出（assertNet 直接抛错）。
 * 只有用户在「我的」或联网工具里主动开启后才允许请求；所有离线工具完全不调用本模块。
 */
import { API_SOURCES, REQUEST_TIMEOUT, getUpdateUrl, isValidHttpUrl, compareVersion } from './net-config.js'

const NET_KEY = 'tb_net_enabled'
const NET_EVENT = 'tb-net-change'
let adapter = null

/** 供单元测试注入 mock 请求实现；不传则使用 uni.request */
export function setRequestAdapter(fn) { adapter = fn }

function storageGet(k) {
	try { return typeof uni !== 'undefined' && uni.getStorageSync ? uni.getStorageSync(k) : '' } catch (e) { return '' }
}
function storageSet(k, v) {
	try { if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync(k, v) } catch (e) {}
}

export function isNetEnabled() { return storageGet(NET_KEY) === true }
export function setNetEnabled(v) {
	const on = !!v
	storageSet(NET_KEY, on)
	if (typeof uni !== 'undefined' && uni.$emit) uni.$emit(NET_EVENT, on)
	return on
}
export function assertNet() {
	if (!isNetEnabled()) throw new Error('联网功能未开启，请先在「我的 - 联网功能」中开启')
}

function getAdapter() {
	if (adapter) return adapter
	if (typeof uni !== 'undefined' && uni.request) return opts => uni.request(opts)
	return null
}

/** 把 uni.request 的回调结果归一化，便于统一处理与测试 */
export function normalizeResponse(res) {
	const r = res || {}
	let text
	if (typeof r.data === 'string') text = r.data
	else if (r.data == null) text = ''
	else { try { text = JSON.stringify(r.data) } catch (e) { text = String(r.data) } }
	return {
		status: Number(r.statusCode || r.status || 0),
		headers: r.header || r.headers || {},
		text
	}
}

/** 单次请求。开关关闭 / URL 非法 / 环境不支持时直接拒绝，不发出请求。 */
export function request({ url, method = 'GET', data, header = {}, timeout = REQUEST_TIMEOUT } = {}) {
	try { assertNet() } catch (e) { return Promise.reject(e) }
	if (!isValidHttpUrl(url)) return Promise.reject(new Error('请填写合法的 http(s) 地址'))
	const fn = getAdapter()
	if (!fn) return Promise.reject(new Error('当前环境不支持网络请求'))
	const start = Date.now()
	return new Promise((resolve, reject) => {
		let done = false
		const finish = (ok, payload) => {
			if (done) return
			done = true
			ok ? resolve(Object.assign({}, payload, { elapsed: Date.now() - start })) : reject(payload)
		}
		try {
			fn({
				url: String(url).trim(),
				method: String(method || 'GET').toUpperCase(),
				data, header: header || {}, timeout: timeout || REQUEST_TIMEOUT,
				dataType: 'text',
				success: r => finish(true, normalizeResponse(r)),
				fail: e => finish(false, new Error('请求失败：' + ((e && e.errMsg) || '网络不可用或已超时')))
			})
		} catch (e) { finish(false, e instanceof Error ? e : new Error(String(e))) }
	})
}

/** 按数据源类型把响应文本解析成统一结构（纯函数，便于单测） */
export function parsePayload(kind, text, headers) {
	let d
	try { d = JSON.parse(text) } catch (e) { throw new Error('数据源返回的不是合法 JSON') }
	switch (kind) {
		case 'ipapi':
			return { ip: d.ip || '', city: d.city || '', region: d.region || '', country: d.country_name || d.country || '', org: d.org || '' }
		case 'ipwho':
			return { ip: d.ip || '', city: d.city || '', region: d.region || '', country: d.country || '', org: (d.connection && d.connection.isp) || '' }
		case 'erapi':
			if (!d.rates) throw new Error('汇率数据缺少 rates 字段')
			return { base: 'CNY', rates: d.rates, updated: d.time_last_update_utc || '' }
		case 'fawaz': {
			const raw = d && d.cny
			if (!raw) throw new Error('汇率数据格式不符合预期')
			const rates = {}
			for (const k of Object.keys(raw)) rates[k.toUpperCase()] = raw[k]
			return { base: 'CNY', rates, updated: d.date || '' }
		}
		case 'hitokoto':
			return { text: d.hitokoto || '', from: d.from_who || d.from || '' }
		case 'worldtime':
			return { datetime: d.datetime || '', timezone: d.timezone || 'Asia/Shanghai', source: 'worldtimeapi' }
		case 'timeapi':
			return { datetime: d.dateTime || d.date || '', timezone: d.timeZone || 'Asia/Shanghai', source: 'timeapi.io' }
		case 'update':
			return {
				version: d.versionName || d.version || '',
				note: d.note || d.notes || d.description || '',
				url: d.url || d.downloadUrl || ''
			}
		case 'raw':
		default:
			return d
	}
}

/** 依次尝试数据源，全部失败才报错；返回首个成功结果 */
export async function fetchSource(kind, overrideUrl) {
	assertNet()
	let list
	if (overrideUrl) {
		const def = (API_SOURCES[kind] || [])[0]
		list = [{ name: '自定义地址', url: overrideUrl, kind: def ? def.kind : (kind === 'update' ? 'update' : 'raw') }]
	} else {
		list = API_SOURCES[kind] || []
	}
	if (!list.length) throw new Error('没有配置可用的数据源')
	const errors = []
	for (const s of list) {
		try {
			const r = await request({ url: s.url, method: 'GET' })
			if (r.status && (r.status < 200 || r.status >= 300)) throw new Error('HTTP ' + r.status)
			const data = parsePayload(s.kind, r.text, r.headers)
			return { source: s.name, elapsed: r.elapsed, data }
		} catch (e) {
			errors.push(s.name + '：' + e.message)
		}
	}
	throw new Error('全部数据源不可用 · ' + errors.join('；'))
}

function safe(p) {
	return p.then(v => ({ ok: true, value: v })).catch(e => ({ ok: false, error: e.message }))
}

/** 网络信息：网络类型 + 公网 IP + 网络时间，任一项失败不影响其他项 */
export async function fetchNetworkInfo() {
	const [ip, time] = await Promise.all([safe(fetchSource('ip')), safe(fetchSource('time'))])
	let networkType = '未知'
	try {
		if (typeof uni !== 'undefined' && uni.getNetworkType) {
			networkType = await new Promise(res => {
				uni.getNetworkType({ success: r => res(r.networkType || '未知'), fail: () => res('未知') })
			})
		}
	} catch (e) {}
	return {
		networkType,
		ip: ip.ok ? ip.value : null,
		time: time.ok ? time.value : null,
		errors: [ip.ok ? '' : ip.error, time.ok ? '' : time.error].filter(Boolean)
	}
}

/** HTTP 调试：返回状态码、响应头、美化后的正文、耗时与大小 */
export async function httpDebug(opts) {
	const r = await request(opts)
	let pretty = r.text
	try { pretty = JSON.stringify(JSON.parse(r.text), null, 2) } catch (e) {}
	return {
		status: r.status,
		headers: r.headers,
		elapsed: r.elapsed,
		size: r.text.length,
		text: pretty
	}
}

/** 检查更新：需要用户先在「我的」里配置版本 JSON 地址 */
export async function checkUpdate(currentVersion) {
	const url = getUpdateUrl()
	if (!url) throw new Error('尚未配置版本地址，请在「我的 - 版本地址」中填写')
	const r = await fetchSource('update', url)
	if (!r.data.version) throw new Error('版本文件里缺少 version / versionName 字段')
	return {
		version: r.data.version,
		note: r.data.note,
		url: r.data.url,
		current: currentVersion,
		hasUpdate: compareVersion(r.data.version, currentVersion) > 0,
		source: r.source
	}
}
