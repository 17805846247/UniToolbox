/* 项目静态校验 + 纯函数单元测试（不改动项目文件） */
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const crypto = require('crypto')
const ROOT = path.join(__dirname, '..')
const errors = []
const warnings = []
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
const exists = p => fs.existsSync(path.join(ROOT, p))

/* ---------- 1. 结构 ---------- */
const pages = JSON.parse(read('pages.json'))
for (const p of pages.pages) {
	const f = p.path + '.vue'
	if (!exists(f)) errors.push('缺少页面：' + f)
}
const toolsAll = read('utils/tools.js')
const tools = toolsAll.slice(toolsAll.indexOf('export const TOOLS'))
const keys = [...tools.matchAll(/\{ key: '([a-z0-9]+)', name:/g)].map(m => m[1])
const declared = [...tools.matchAll(/\{\s*key:\s*'([a-z0-9]+)'/g)].map(m => m[1])
if (declared.length !== keys.length) errors.push('注册表有未被校验的 key：' + declared.filter(k => !keys.includes(k)).join(','))
const comps = fs.readdirSync(path.join(ROOT, 'components/tools')).filter(f => f.endsWith('.vue')).map(f => f.replace('tool-', '').replace('.vue', ''))
for (const c of comps) if (!keys.includes(c)) errors.push('存在未注册的组件：tool-' + c + '.vue')
for (const k of keys) {
	if (k === 'files' || k === 'editor') continue
	if (!exists('components/tools/tool-' + k + '.vue')) errors.push('缺少组件：tool-' + k + '.vue')
}
const toolPage = read('pages/tool/tool.vue')
for (const k of keys) {
	if (k === 'files' || k === 'editor') continue
	if (!toolPage.includes('key === \'' + k + '\'')) errors.push('tool.vue 未挂载：' + k)
	if (!toolPage.includes('components/tools/tool-' + k + '.vue')) errors.push('tool.vue 未引入：' + k)
}
console.log('结构检查：' + pages.pages.length + ' 个页面 / ' + keys.length + ' 个工具')

/* ---------- 2. 所有 .vue 的 script 语法 + 模板配对 ---------- */
function walk(dir, out = []) {
	for (const f of fs.readdirSync(path.join(ROOT, dir))) {
		const p = path.join(dir, f)
		if (fs.statSync(path.join(ROOT, p)).isDirectory()) walk(p, out)
		else if (f.endsWith('.vue')) out.push(p)
	}
	return out
}
const vueFiles = walk('pages').concat(walk('components'))
let checkedScripts = 0
for (const f of vueFiles) {
	const src = read(f)
	const m = src.match(/<script[^>]*>([\s\S]*?)<\/script>/)
	if (!m) { errors.push(f + '：缺少 <script>'); continue }
	let code = m[1]
		.replace(/^\s*import\s+[^;]*?\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
		.replace(/export\s+default\s*/, 'const __component = ')
	try { new vm.Script(code, { filename: f }); checkedScripts++ }
	catch (e) { errors.push(f + ' script 语法错误：' + e.message) }

	const tpl = src.match(/<template>([\s\S]*?)<\/template>/)
	if (!tpl) { errors.push(f + '：缺少 <template>'); continue }
	const stack = []
	const voidTags = new Set(['input', 'image', 'slider', 'icon', 'br', 'hr', 'img'])
	for (const tag of tpl[1].matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
		const [, close, name, attrs, self] = tag
		if (close) {
			if (stack.length && stack[stack.length - 1] === name) stack.pop()
			else errors.push(f + ' 模板标签不匹配，遇到 </' + name + '>，栈顶=' + (stack[stack.length - 1] || '空'))
		} else if (!self && !voidTags.has(name) && !attrs.trim().endsWith('/')) {
			stack.push(name)
		}
	}
	if (stack.length) errors.push(f + ' 模板标签未闭合：' + stack.join(','))

	// 模板中 @事件 调用的方法必须在 script 中出现
	for (const ev of tpl[1].matchAll(/@(?:click|change|input)="([a-zA-Z_$][\w$]*)\s*(?:\(|=|\.|,|'|"|$)/g)) {
		const name = ev[1]
		if (!['uni', 'Math', 'String', 'Number', 'copyText'].includes(name) && !m[1].includes(name)) {
			warnings.push(f + ' 事件方法可能未定义：' + name)
		}
	}
}
console.log('Vue 文件：' + vueFiles.length + ' 个，script 语法通过 ' + checkedScripts + ' 个')

/* ---------- 3. 纯函数单元测试 ---------- */
async function load(p) {
	return import('data:text/javascript;base64,' + Buffer.from(read(p)).toString('base64'))
}
;(async () => {
	const c = await load('utils/convert.js')
	const h = await load('utils/crypto.js')
	const q = await load('utils/qrcode.js')
	let pass = 0, fail = 0
	const eq = (name, got, want) => {
		if (JSON.stringify(got) === JSON.stringify(want)) pass++
		else { fail++; console.log('  FAIL ' + name + ': got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)) }
	}
	const thr = (name, fn) => { try { fn(); fail++; console.log('  FAIL ' + name + ': 应抛异常') } catch (e) { pass++ } }

	// Base64 / 编码
	for (const s of ['', 'abc', '中文测试', '😀 Emoji', 'a\nb\tc', 'JSON: {"a":1}']) {
		eq('base64 roundtrip ' + JSON.stringify(s), c.b64decode(c.b64encode(s)), s)
		eq('url roundtrip', c.urlDecode(c.urlEncode(s)), s)
	}
	eq('base64 abc', c.b64encode('abc'), 'YWJj')
	eq('base64 中文', c.b64encode('中'), '5Lit')
	eq('unicode', c.unicodeEncode('A中'), 'A\\u4E2D')
	eq('unicode decode', c.unicodeDecode('A\\u4E2D'), 'A中')
	eq('html escape', c.htmlEscape('<a href="x">&'), '&lt;a href=&quot;x&quot;&gt;&amp;')
	eq('html unescape', c.htmlUnescape('&lt;b&gt;'), '<b>')
	thr('bad base64', () => c.b64decode('@@@'))

	// JSON / CSV / YAML
	const obj = [{ 名称: '图片转换', 次数: 12 }, { 名称: '二维码', 次数: 8 }]
	eq('json format', c.jsonFormat('{"a":1}'), '{\n  "a": 1\n}')
	eq('json minify', c.jsonMinify('{ "a" : 1 }'), '{"a":1}')
	eq('json escape', c.jsonEscape('a"b'), 'a\\"b')
	eq('csv->json', c.csvToJson('name,age\n张三,18\n李四,20'), [{ name: '张三', age: 18 }, { name: '李四', age: 20 }])
	eq('json->csv', c.jsonToCsv([{ a: 'x,y', b: 2 }]), 'a,b\n"x,y",2')
	eq('csv quoted', c.csvToJson('a,b\n"x,y","he said ""hi"""'), [{ a: 'x,y', b: 'he said "hi"' }])
	const yaml = c.jsonToYaml({ name: '工具箱', tools: ['a', 'b'], count: 18, ok: true })
	eq('yaml roundtrip', c.yamlToJson(yaml), { name: '工具箱', tools: ['a', 'b'], count: 18, ok: true })
	eq('yaml parse', c.yamlToJson('a: 1\nb: hello\nlist:\n  - x\n  - y'), { a: 1, b: 'hello', list: ['x', 'y'] })

	// 进制 / 颜色
	eq('radix 255->16', c.radixConvert('255', 10, 16), 'FF')
	eq('radix 2->10', c.radixConvert('101101', 2, 10), '45')
	eq('radix FF->2', c.radixConvert('FF', 16, 2), '11111111')
	eq('radix big', c.radixConvert('123456789012345678901234567890', 10, 16), BigInt('123456789012345678901234567890').toString(16).toUpperCase())
	thr('radix invalid', () => c.radixConvert('2', 2, 16))
	eq('color hex', c.colorInfo('#4F6EF7').rgb, 'rgb(79, 110, 247)')
	eq('color short', c.colorInfo('#f00').hex, '#FF0000')
	eq('color rgb input', c.colorInfo('rgb(0, 255, 0)').hex, '#00FF00')
	eq('color hsl', c.colorInfo('#FF0000').hsl, 'hsl(0, 100%, 50%)')
	thr('color invalid', () => c.colorInfo('nope'))

	// 日期 / 单位 / 文本 / 表达式
	eq('ts->date', c.tsToDate(0).seconds, 0)
	eq('date->ts', c.dateToTs('1970-01-01 08:00:00').seconds >= 0, true)
	eq('daysBetween', c.daysBetween('2026-01-01', '2026-01-31'), 30)
	eq('dateAdd', c.dateAdd('2026-01-01', 40), '2026-02-10')
	eq('unit km->m', c.convertUnit(2, 'length', 'km', 'm'), 2000)
	eq('unit C->F', c.convertUnit(100, 'temperature', '°C', '°F'), 212)
	eq('unit 斤->kg', c.convertUnit(2, 'weight', '斤', 'kg'), 1)
	eq('unit GB->MB', c.convertUnit(1, 'storage', 'GB', 'MB'), 1024)
	eq('text upper', c.textTransform('ab C', 'upper'), 'AB C')
	eq('text dedupe', c.textTransform('a\nb\na', 'dedupe'), 'a\nb')
	eq('text empty', c.textTransform('a\n\nb\n', 'empty'), 'a\nb')
	eq('text stats', c.textStats('中文 a\n').chinese, 2)
	eq('calc 1', c.calcExpression('(12+8)*3/4'), 15)
	eq('calc 2', c.calcExpression('2^10'), 1024)
	eq('calc 3', c.calcExpression('10%3+1.5'), 2.5)
	thr('calc div0', () => c.calcExpression('1/0'))
	thr('calc bad', () => c.calcExpression('1++'))
	eq('formatBytes', c.formatBytes(2048), '2.00 KB')

	// 哈希（与 node:crypto 对比）
	for (const s of ['', 'abc', '中文😀', 'x'.repeat(100)]) {
		for (const a of ['md5', 'sha1', 'sha256']) {
			eq(a + ' ' + JSON.stringify(s.slice(0, 8)), h[a](s), crypto.createHash(a).update(Buffer.from(s)).digest('hex'))
		}
	}

	// 二维码
	for (const [text, level] of [['HELLO', 'M'], ['https://dcloud.io', 'Q'], ['中文二维码', 'H']]) {
		const m = q.createQrMatrix(text, level)
		eq('qr size ' + level, m.length % 4 === 1 && m.length >= 21, true)
		eq('qr finder ' + level, m[0][0] && m[0][6] && m[6][0], true)
	}

	console.log('单元测试：' + pass + ' 通过 / ' + fail + ' 失败')
	if (fail) errors.push(fail + ' 个单元测试失败')
	if (warnings.length) { console.log('\n提示（需人工确认）：'); warnings.forEach(w => console.log('  ' + w)) }
	if (errors.length) { console.log('\n错误：'); errors.forEach(e => console.log('  ' + e)); process.exit(1) }
	console.log('\n全部检查通过')
})().catch(e => { console.error(e); process.exit(1) })
