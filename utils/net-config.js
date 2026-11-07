/**
 * 联网数据源配置。全部为免 Key 的公开接口，可自行替换。
 * 数组顺序 = 优先级，net.js 会逐个尝试直到成功（失败自动降级）。
 * 注意：H5 端受浏览器 CORS 限制；App 端无此限制。数据源不可用时工具会给出明确提示，
 * 不会影响任何离线工具。
 */
export const REQUEST_TIMEOUT = 8000

export const API_SOURCES = {
	ip: [
		{ name: 'ipapi.co', url: 'https://ipapi.co/json/', kind: 'ipapi' },
		{ name: 'ipwho.is', url: 'https://ipwho.is/', kind: 'ipwho' }
	],
	rate: [
		{ name: 'exchangerate-api', url: 'https://open.er-api.com/v6/latest/CNY', kind: 'erapi' },
		{ name: 'currency-api', url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/cny.json', kind: 'fawaz' }
	],
	quote: [
		{ name: 'hitokoto', url: 'https://v1.hitokoto.cn/?encode=json', kind: 'hitokoto' }
	],
	time: [
		{ name: 'worldtimeapi', url: 'https://worldtimeapi.org/api/timezone/Asia/Shanghai', kind: 'worldtime' },
		{ name: 'timeapi.io', url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Shanghai', kind: 'timeapi' }
	],
	update: []
}

const UPDATE_KEY = 'tb_update_url'
const CLOUD_KEY = 'tb_cloud_endpoint'

export function getUpdateUrl() {
	try { return typeof uni !== 'undefined' && uni.getStorageSync ? (uni.getStorageSync(UPDATE_KEY) || '') : '' } catch (e) { return '' }
}
export function setUpdateUrl(v) {
	try { if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync(UPDATE_KEY, String(v || '').trim()) } catch (e) {}
}

/** 云端备份端点：接收 POST JSON {name, content, owner, time} 的服务地址。 */
export function getCloudEndpoint() {
	try { return typeof uni !== 'undefined' && uni.getStorageSync ? (uni.getStorageSync(CLOUD_KEY) || '') : '' } catch (e) { return '' }
}
export function setCloudEndpoint(v) {
	try { if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync(CLOUD_KEY, String(v || '').trim()) } catch (e) {}
}

export function isValidHttpUrl(u) {
	return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(String(u == null ? '' : u).trim())
}

/** 版本号比较：a > b 返回 1，相等 0，小于 -1。忽略前导 v 与空白。 */
export function compareVersion(a, b) {
	const pa = String(a || '').trim().replace(/^[vV]/, '').split('.')
	const pb = String(b || '').trim().replace(/^[vV]/, '').split('.')
	const n = Math.max(pa.length, pb.length)
	for (let i = 0; i < n; i++) {
		const x = parseInt(pa[i] || '0', 10) || 0
		const y = parseInt(pb[i] || '0', 10) || 0
		if (x > y) return 1
		if (x < y) return -1
	}
	return 0
}
