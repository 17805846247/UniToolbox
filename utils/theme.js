/**
 * 主题管理：浅色 / 深色 / 跟随系统
 * 三档持久化到本地；页面通过 themeMixin 拿到 themeClass 并加在根 view 上。
 * 所有颜色以 CSS 变量定义（见 App.vue），深色只需覆盖变量，无需改组件逻辑。
 */
const KEY = 'tb_theme_mode'
const DARK_EVENT = 'tb-theme-change'

export const THEME_OPTIONS = [
	{ key: 'light', name: '浅色', desc: '始终使用浅色界面' },
	{ key: 'dark', name: '深色', desc: '夜间使用更护眼' },
	{ key: 'system', name: '跟随系统', desc: '自动匹配系统外观' }
]

function storageGet(k) {
	try { return typeof uni !== 'undefined' && uni.getStorageSync ? uni.getStorageSync(k) : '' } catch (e) { return '' }
}
function storageSet(k, v) {
	try { if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync(k, v) } catch (e) {}
}

export function getThemeMode() {
	const v = storageGet(KEY)
	return v === 'dark' || v === 'system' || v === 'light' ? v : 'light'
}

export function setThemeMode(mode) {
	const m = mode === 'dark' || mode === 'system' ? mode : 'light'
	storageSet(KEY, m)
	if (typeof uni !== 'undefined' && uni.$emit) uni.$emit(DARK_EVENT, m)
	applyTheme()
	return m
}

/** 当前是否应显示深色。system 档优先取 uni.getSystemInfoSync().theme，H5 再退回 matchMedia。 */
export function isDarkMode() {
	const mode = getThemeMode()
	if (mode === 'dark') return true
	if (mode === 'light') return false
	try {
		if (typeof uni !== 'undefined' && uni.getSystemInfoSync) {
			const t = uni.getSystemInfoSync().theme
			if (t === 'dark' || t === 'light') return t === 'dark'
		}
	} catch (e) {}
	try {
		// #ifdef H5
		if (typeof window !== 'undefined' && window.matchMedia) {
			return window.matchMedia('(prefers-color-scheme: dark)').matches
		}
		// #endif
	} catch (e) {}
	return false
}

/**
 * 同步导航栏 / 状态栏 / 底部 tabBar 外观。App.vue 的 onLaunch / onShow 调用，
 * 各页面 themeMixin.onShow 也会调用，确保进入 tab 页时底部导航始终是正确配色。
 *
 * 关键点：onLaunch 时 tabBar 可能尚未就绪，setTabBarStyle 会静默失败，
 * 表现为「软件是深色、但首页/工具/文件/我的 菜单仍是白色」。这里用延迟重试兜底。
 */
export function applyTheme() {
	const dark = isDarkMode()
	const bg = dark ? '#11151f' : '#ffffff'
	const fg = dark ? '#ffffff' : '#000000'
	try {
		if (typeof uni !== 'undefined' && uni.setNavigationBarColor) {
			uni.setNavigationBarColor({ frontColor: fg, backgroundColor: bg })
		}
		applyTabBarStyle(dark)
		if (typeof plus !== 'undefined' && plus.navigator && plus.navigator.setStatusBarStyle) {
			plus.navigator.setStatusBarStyle(dark ? 'light' : 'dark')
		}
		// H5：pages.json 的 globalStyle 是静态白底，setNavigationBarColor 只改标题栏，
		// 用根标记让 App.vue 的 CSS 兜底同步页面底色 / 导航栏 / tabBar（App 端无 document）。
		if (typeof document !== 'undefined' && document.documentElement) {
			document.documentElement.setAttribute('data-tb-theme', dark ? 'dark' : 'light')
			if (document.body) document.body.style.backgroundColor = dark ? '#11151f' : '#f4f6fb'
		}
	} catch (e) {}
	return dark
}

/** 设置底部 tabBar 配色，带延迟重试（解决 onLaunch 时 tabBar 未就绪导致白边）。 */
export function applyTabBarStyle(dark) {
	const cfg = {
		color: dark ? '#7c879e' : '#98a0b3',
		selectedColor: dark ? '#7d95ff' : '#4f6ef7',
		backgroundColor: dark ? '#1a2130' : '#ffffff',
		borderStyle: dark ? 'black' : 'white'
	}
	const once = () => {
		try {
			if (typeof uni !== 'undefined' && uni.setTabBarStyle) uni.setTabBarStyle(cfg)
		} catch (e) {}
	}
	once()
	// 0ms（微任务后）/ 200ms / 600ms 三次重试，覆盖 tabBar 初始化时机
	if (typeof setTimeout !== 'undefined') {
		setTimeout(once, 200)
		setTimeout(once, 600)
	}
}

/** 页面 mixin：根 view 使用 :class="themeClass" 即可获得深色变量作用域 */
export const themeMixin = {
	data() {
		return { tbDark: false }
	},
	computed: {
		themeClass() { return this.tbDark ? 'page page-dark' : 'page' },
		isDark() { return this.tbDark }
	},
	created() {
		this.tbDark = isDarkMode()
		this._tbThemeHandler = () => { this.tbDark = isDarkMode() }
		if (typeof uni !== 'undefined' && uni.$on) uni.$on(DARK_EVENT, this._tbThemeHandler)
	},
	onShow() {
		this.tbDark = isDarkMode()
		// 进入页面时同步导航栏 / 底部 tabBar 配色（修复「浅色手机 + 深色 App」白边）
		applyTheme()
	},
	beforeUnmount() {
		if (typeof uni !== 'undefined' && uni.$off) uni.$off(DARK_EVENT, this._tbThemeHandler)
	}
}
