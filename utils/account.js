/**
 * 账号管理：游客模式优先，无需联网即可使用全部工具。
 *
 * 设计原则：
 *  - 默认游客（guest），不要求登录；游客也有本机唯一 id，可正常使用文件云端备份。
 *  - 登录（login）只是把本机身份从「游客」标记为「已登录（本机账号）」，并设置昵称/头像；
 *    不依赖任何远端服务器，因此离线可用、隐私可控。
 *  - 云端备份需要可访问的上传端点（在 net-config 配置），由用户主动触发且每次询问。
 */

const ACCOUNT_KEY = 'tb_account'
const DEVICE_KEY = 'tb_device_id'
const UPLOADS_KEY = 'tb_uploads'

export const AVATARS = ['🙂', '😎', '🤖', '🐱', '🌟', '🍀', '🔧', '📦', '🚀', '☕']

function deviceId() {
	try {
		let id = uni.getStorageSync(DEVICE_KEY)
		if (!id) {
			id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
			uni.setStorageSync(DEVICE_KEY, id)
		}
		return id
	} catch (e) {
		return 'd' + Date.now().toString(36)
	}
}

export function getAccount() {
	let a
	try { a = uni.getStorageSync(ACCOUNT_KEY) } catch (e) { a = null }
	if (!a || typeof a !== 'object') {
		a = { type: 'guest', id: deviceId(), name: '游客', avatar: '🙂', createdAt: Date.now() }
		setAccount(a)
	}
	return a
}

export function setAccount(a) {
	try { uni.setStorageSync(ACCOUNT_KEY, a) } catch (e) {}
	return a
}

export function isGuest(a) {
	a = a || getAccount()
	return a.type !== 'user'
}

/** 仅更新昵称 / 头像，保留 type 与 id。 */
export function updateProfile(patch) {
	const a = getAccount()
	if (patch && patch.name != null) a.name = String(patch.name).trim() || a.name
	if (patch && patch.avatar != null) a.avatar = patch.avatar
	return setAccount(a)
}

/** 标记为已登录（本机账号）。可选昵称，缺省沿用现有昵称。 */
export function login(name) {
	const a = getAccount()
	a.type = 'user'
	if (name != null && String(name).trim()) a.name = String(name).trim()
	if (!a.avatar) a.avatar = '🙂'
	return setAccount(a)
}

/** 退出登录：回到游客模式，保留 nickname/avatar 供下次使用。 */
export function logout() {
	const a = getAccount()
	a.type = 'guest'
	return setAccount(a)
}

/* ===================== 云端上传记录（本机） ===================== */

export function getUploads() {
	try {
		const u = uni.getStorageSync(UPLOADS_KEY)
		return Array.isArray(u) ? u : []
	} catch (e) { return [] }
}

export function addUpload(rec) {
	const list = getUploads()
	list.unshift(rec)
	try { uni.setStorageSync(UPLOADS_KEY, list.slice(0, 50)) } catch (e) {}
	return list
}
