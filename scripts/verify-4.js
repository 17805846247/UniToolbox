/* 界面 2.0 契约校验：分类色调、主题变量、组件引用、版本号一致性 + 视觉映射单测 */
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')

let pass = 0, fail = 0
const eq = (name, got, want) => {
	if (JSON.stringify(got) === JSON.stringify(want)) pass++
	else { fail++; console.log('  FAIL ' + name + ': got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)) }
}
const ok = (name, cond) => eq(name, !!cond, true)

;(async () => {
	const load = async src => import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))
	const v = await load(read('utils/visual.js'))
	// tools.js 带相对 import，data URL 无法解析；本脚本只用注册表数组，用 stub 顶掉
	const toolsSrc = read('utils/tools.js')
		.replace(/^import\s+\{\s*smartSearch\s*\}\s+from\s+['"][^'"]+['"]\s*;?\s*$/m, 'const smartSearch = () => []')
	const t = await load(toolsSrc)

	// ---- 色调映射纯函数 ----
	eq('TONE_KEYS', v.TONE_KEYS, ['convert', 'file', 'life', 'utility', 'network'])
	for (const k of v.TONE_KEYS) eq('toneKey 字符串 ' + k, v.toneKey(k), k)
	eq('toneKey 分类条目', v.toneKey(t.CATEGORIES.find(c => c.key === 'life')), 'life')
	eq('toneKey 工具条目', v.toneKey(t.TOOLS.find(x => x.key === 'qrcode')), 'utility')
	eq('toneKey 未知回退', v.toneKey({ cat: 'unknown' }), 'utility')
	eq('toneKey 空值回退', v.toneKey(null), 'utility')
	eq('toneOf 变量引用', v.toneOf('network'), {
		tone: 'network', color: 'var(--tone-network)',
		bg: 'var(--tone-network-soft)', border: 'var(--tone-network-line)'
	})
	eq('badgeStyle', v.badgeStyle('file'), {
		color: 'var(--tone-file)', background: 'var(--tone-file-soft)'
	})
	eq('accentStyle', v.accentStyle('convert'), { background: 'var(--tone-convert)' })

	// 44 个工具的色调必须全部落在 5 个分类内，且与所属分类一致
	let toneBad = 0
	for (const tool of t.TOOLS) {
		if (v.toneKey(tool) !== (t.CATEGORIES.some(c => c.key === tool.cat) ? tool.cat : 'utility')) toneBad++
	}
	eq('全部工具色调与分类一致', toneBad, 0)

	// ---- 主题变量：浅色 / 深色都要有 5×3 个 tone 变量 ----
	const app = read('App.vue')
	const light = app.slice(app.indexOf('page {'), app.indexOf('.page-dark {'))
	const dark = app.slice(app.indexOf('.page-dark {'), app.indexOf('.page-dark .qr-box'))
	let varBad = 0
	for (const k of v.TONE_KEYS) {
		for (const suffix of ['', '-soft', '-line']) {
			const name = '--tone-' + k + suffix + ':'
			if (!light.includes(name)) { varBad++; console.log('  浅色缺变量', name) }
			if (!dark.includes(name)) { varBad++; console.log('  深色缺变量', name) }
		}
	}
	eq('浅/深色各 15 个 tone 变量齐全', varBad, 0)
	ok('间距令牌齐全', ['--sp-1:', '--sp-2:', '--sp-3:', '--sp-4:', '--sp-5:', '--sp-6:'].every(s => app.includes(s)))
	ok('圆角令牌齐全', ['--radius:', '--radius-sm:', '--radius-badge:', '--radius-pill:'].every(s => app.includes(s)))

	// ---- 2.0 公共组件存在且被主要页面引用 ----
	for (const f of ['components/ui/tb-badge.vue', 'components/ui/tb-searchbar.vue', 'utils/visual.js']) {
		ok('文件存在 ' + f, fs.existsSync(path.join(ROOT, f)))
	}
	const index = read('pages/index/index.vue')
	const category = read('pages/category/category.vue')
	const toolPage = read('pages/tool/tool.vue')
	const search = read('pages/search/search.vue')
	ok('首页用统一徽标', index.includes('<tb-badge'))
	ok('首页用统一搜索条', index.includes('<tb-searchbar'))
	ok('工具目录用统一搜索条', category.includes('<tb-searchbar'))
	ok('工具详情用统一徽标', toolPage.includes('<tb-badge'))
	ok('搜索页用统一徽标', search.includes('<tb-badge'))
	// 1.x 的随机色徽标写法应已彻底移除
	ok('不再有随机色徽标', !/background:\s*t\.color|background:\s*tool\.color/.test(index + category + search + toolPage))
	// 首页不再一次铺满 44 张卡片；完整目录仍在工具 tab
	ok('首页不再平铺全部工具', !index.includes('v-for="t in list"'))
	ok('工具目录仍保留完整分组', category.includes('v-for="g in groups"'))
	ok('工具目录保留收藏筛选', category.includes("active === 'fav'"))
	ok('工具目录保留页内筛选', category.includes('smartSearch'))

	// ---- 版本号一致性 ----
	const manifest = JSON.parse(read('manifest.json'))
	const about = read('pages/about/about.vue')
	const mine = read('pages/mine/mine.vue')
	const netupdate = read('components/tools/tool-netupdate.vue')
	const intro = read('pages/intro/intro.vue')
	eq('manifest versionName', manifest.versionName, '2.2.0')
	eq('manifest versionCode', manifest.versionCode, '220')
	ok('关于页版本', about.includes("const VERSION = '2.2.0'"))
	ok('我的页版本', mine.includes('v2.2.0'))
	ok('检查更新自动识别版本号', netupdate.includes('APP_VERSION') && !netupdate.includes("current: '2.1.0'"))
	ok('引导页提到 2.x', intro.includes('2.'))
	ok('关于页保留主开发署名', about.includes('WorkBuddy AI 助手'))
	ok('关于页保留协作开发署名', about.includes('Ezer Zheng'))
	ok('关于页保留联系方式', about.includes('17805846247@163.com'))

	// ---- v2.2 输入组件收口：原生 input/textarea 必须替换为非受控 tb-input/tb-textarea ----
	ok('存在 tb-input 组件', fs.existsSync(path.join(ROOT, 'components/ui/tb-input.vue')))
	ok('存在 tb-textarea 组件', fs.existsSync(path.join(ROOT, 'components/ui/tb-textarea.vue')))
	let rawInputBad = 0
	for (const f of fs.readdirSync(path.join(ROOT, 'components/tools'))) {
		if (!f.endsWith('.vue')) continue
		const s = read('components/tools/' + f)
		if (/<input\b/.test(s) || /<textarea\b/.test(s)) rawInputBad++
	}
	eq('工具组件无原生 input/textarea（已收口到 tb-*）', rawInputBad, 0)

	console.log('\n界面 2.0 契约校验：' + pass + ' 通过 / ' + fail + ' 失败')
	if (fail) process.exit(1)
})().catch(e => { console.error(e); process.exit(1) })
