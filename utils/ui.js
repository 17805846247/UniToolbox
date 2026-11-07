/** 组件共用的小交互 */
export function toast(msg) {
	uni.showToast({ title: String(msg), icon: 'none', duration: 2000 })
}
export function ok(msg) {
	uni.showToast({ title: String(msg), icon: 'success' })
}
export function copyText(text) {
	if (text === '' || text === undefined || text === null) return toast('没有可复制的内容')
	uni.setClipboardData({ data: String(text) })
	ok('已复制')
}
export function fail(msg) {
	uni.showModal({ title: '出错了', content: String(msg), showCancel: false })
}
export function confirm(content, title = '确认操作') {
	return new Promise(resolve => {
		uni.showModal({ title, content, success: r => resolve(!!r.confirm), fail: () => resolve(false) })
	})
}
