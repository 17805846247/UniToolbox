/*
 * v2.2.1 回归套件：中文输入法（IME）+ 页面白屏
 *
 * 与 verify-5 的字符串契约不同，这里直接加载 .vue 里的 <script> 并执行，
 * 用真实组件代码模拟「拼音组合 → 上屏 → v-model 回传 → 外部改值」全流程，
 * 断言输入全程 :value 与 :key 都不变（即不回写、不重建），从行为上锁死根因。
 *
 * 另含一个纯静态扫描：模板中调用、但由 import 引入且未挂到组件实例的
 * 函数，会在渲染时抛 "xxx is not a function" 并导致整页白屏。
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')

let pass = 0, fail = 0
const ok = (name, cond, extra) => {
	if (cond) pass++
	else { fail++; console.log('  FAIL ' + name + (extra ? ' | ' + extra : '')) }
}
const eq = (name, got, want) => ok(name + ' (got ' + JSON.stringify(got) + ')', JSON.stringify(got) === JSON.stringify(want))

/* ========== 1. 真实组件行为模拟 ========== */
function loadOptions(file) {
	const src = read(file)
	const m = src.match(/<script>([\s\S]*?)<\/script>/)
	if (!m) throw new Error('no <script> in ' + file)
	// 三个 ui 组件 <script> 内无 import，可直接求值
	const code = m[1].replace(/export\s+default\s*/, 'return ')
	return new Function(code)()
}

function makeInstance(file, initial) {
	const o = loadOptions(file)
	const ctx = { modelValue: initial, value: undefined }
	Object.assign(ctx, o.data.call(ctx), o.methods)
	Object.assign(ctx, o.watch)
	const emitted = []
	ctx.$emit = (name, val) => emitted.push([name, val])
	return {
		ctx, o, emitted,
		input(v) { o.methods.onInput.call(ctx, { detail: { value: v } }) },
		// 模拟父组件 v-model 把组件 emit 出去的值原样传回
		echo(v) { o.watch.modelValue.call(ctx, v) }
	}
}

const COMPONENTS = [
	'components/ui/tb-input.vue',
	'components/ui/tb-textarea.vue',
	'components/ui/tb-field.vue'
]

for (const file of COMPONENTS) {
	const tag = path.basename(file, '.vue')
	const I = makeInstance(file, '255')
	const { ctx, emitted } = I

	eq(tag + ' 初始值渲染正确', ctx.initialValue, '255')
	eq(tag + ' 初始 inner 对齐', ctx.inner, '255')
	eq(tag + ' 初始不重建', ctx.key, 0)

	// 模拟中文输入法：拼音组合期间逐字派发 input，最后上屏为中文。
	// uni-app 默认 ignoreCompositionEvent=true，合成期不派发 input，
	// 上屏后派发一次；这里两种都模拟，确保都不被打断。
	const seq = ['n', 'ni', 'ni ', 'ni h', '你好']
	for (const v of seq) {
		I.input(v)
		eq(tag + ' 输入 "' + v + '" 时 :value 不回写', ctx.initialValue, '255')
		eq(tag + ' 输入 "' + v + '" 时不重建输入框', ctx.key, 0)
		eq(tag + ' 输入 "' + v + '" 时 inner 跟随', ctx.inner, v)
		// v-model 回传：若误判为外部改值会 key++，直接打断 IME
		I.echo(v)
		eq(tag + ' 回传 "' + v + '" 时不重建', ctx.key, 0)
		eq(tag + ' 回传 "' + v + '" 时 :value 仍不回写', ctx.initialValue, '255')
	}

	// emit 契约：v-model / 老式 input / value.sync 三种都要能收到
	const names = emitted.map(e => e[0])
	ok(tag + ' emit update:modelValue', names.includes('update:modelValue'))
	ok(tag + ' emit input', names.includes('input'))
	ok(tag + ' emit 的值等于最终输入', emitted.filter(e => e[0] === 'update:modelValue').pop()[1] === '你好')

	// 外部主动改值（重置按钮 / 随机颜色 / 载入文件）必须真正刷新输入框
	I.echo('#4F6EF7')
	eq(tag + ' 外部改值后 :value 更新', ctx.initialValue, '#4F6EF7')
	eq(tag + ' 外部改值后重建一次', ctx.key, 1)
	eq(tag + ' 外部改值后 inner 对齐', ctx.inner, '#4F6EF7')
	// 连续两次相同外部值不应重复重建
	I.echo('#4F6EF7')
	eq(tag + ' 重复外部值不重复重建', ctx.key, 1)

	// 数字类型的 v-model（很多工具传 number）
	const N = makeInstance(file, 0)
	eq(tag + ' number 初始值转字符串', N.ctx.initialValue, '0')
	N.input('42')
	N.echo('42')
	eq(tag + ' number 输入不回写', N.ctx.initialValue, '0')
	eq(tag + ' number 输入不重建', N.ctx.key, 0)
}

/* ========== 2. tb-searchbar 保持已验证的非受控范式 ========== */
const bar = read('components/ui/tb-searchbar.vue')
ok('tb-searchbar :value 绑定稳定初始值', bar.includes(':value="initialValue"'))
ok('tb-searchbar 回传守卫保留', bar.includes('if (v === this.inner) return'))
ok('tb-searchbar 不绑定 composition 事件', !bar.includes('@compositionstart') && !bar.includes('@compositionend'))

/* ========== 3. 全量白屏扫描 ========== */
// 取 methods/computed/data/props/setup 的顶层键（纯静态，不执行代码）
function blockAfter(src, key) {
	const re = new RegExp('\\b' + key + '\\s*(?:\\([^)]*\\)\\s*)?:?\\s*\\{')
	const m = re.exec(src)
	if (!m) return null
	const start = m.index + m[0].length - 1
	let depth = 0, i = start, quote = null
	for (; i < src.length; i++) {
		const c = src[i]
		if (quote) {
			if (c === '\\') { i++; continue }
			if (c === quote) quote = null
			continue
		}
		if (c === '"' || c === "'" || c === '`') { quote = c; continue }
		if (c === '{' || c === '(' || c === '[') depth++
		else if (c === '}' || c === ')' || c === ']') { depth--; if (depth === 0) return src.slice(start + 1, i) }
	}
	return null
}

function topLevelKeys(block) {
	if (!block) return []
	const keys = []
	let depth = 0, i = 0, quote = null
	while (i < block.length) {
		const c = block[i]
		if (quote) {
			if (c === '\\') { i += 2; continue }
			if (c === quote) quote = null
			i++; continue
		}
		if (c === '"' || c === "'" || c === '`') { quote = c; i++; continue }
		if (c === '{' || c === '(' || c === '[') { depth++; i++; continue }
		if (c === '}' || c === ')' || c === ']') { depth--; i++; continue }
		if (depth === 0 && /[A-Za-z_$]/.test(c)) {
			const m = /^[A-Za-z_$][\w$]*/.exec(block.slice(i))
			if (m) {
				let j = i + m[0].length
				while (j < block.length && /\s/.test(block[j])) j++
				// 后面跟 ( : , 是常规定义；跟 } 或已到块尾是 ES6 简写属性
				// （blockAfter 已剥掉外层花括号，故 methods: { copyText } 的块内容是 " copyText "）
				if ((['(', ':', ',', '}'].includes(block[j]) || j >= block.length) && validKey(m[0])) keys.push(m[0])
				i = j; continue
			}
		}
		i++
	}
	return keys
}

const RESERVED = new Set([
	'false', 'true', 'null', 'undefined', 'if', 'else', 'for', 'while', 'return',
	'var', 'let', 'const', 'function', 'new', 'typeof', 'switch', 'case', 'break',
	'continue', 'try', 'catch', 'throw', 'async', 'await', 'this', 'delete', 'in', 'of'
])
const validKey = n => /^[A-Za-z_$][\w$]*$/.test(n) && !RESERVED.has(n)

// data() { return { ... } } 的键。同时支持多行与单行写法。
// 按顶层逗号切分对象内容，只认 `key:` 或纯 `key` 简写，避免把值里的
// false / TOOLS.filter(...) 之类误当成实例键。
function dataKeys(script) {
	const b = blockAfter(script, 'data')
	if (!b) return []
	const st = b.indexOf('{')
	if (st < 0) return []
	// 从第一个 { 起做括号配对，取对象内容
	let depth = 0, quote = null, end = -1
	for (let i = st; i < b.length; i++) {
		const c = b[i]
		if (quote) {
			if (c === '\\') { i++; continue }
			if (c === quote) quote = null
			continue
		}
		if (c === '"' || c === "'" || c === '`') { quote = c; continue }
		if (c === '{' || c === '(' || c === '[') depth++
		else if (c === '}' || c === ')' || c === ']') { depth--; if (depth === 0) { end = i; break } }
	}
	const body = b.slice(st + 1, end < 0 ? b.length : end)
	// 按顶层逗号分段
	const segs = []
	let d = 0, q = null, last = 0
	for (let i = 0; i < body.length; i++) {
		const c = body[i]
		if (q) { if (c === '\\') { i++; continue } if (c === q) q = null; continue }
		if (c === '"' || c === "'" || c === '`') { q = c; continue }
		if (c === '{' || c === '(' || c === '[') d++
		else if (c === '}' || c === ')' || c === ']') d--
		else if (c === ',' && d === 0) { segs.push(body.slice(last, i)); last = i + 1 }
	}
	segs.push(body.slice(last))
	const keys = []
	for (const seg of segs) {
		const m = /^\s*([A-Za-z_$][\w$]*)\s*(?::|,|$)/.exec(seg)
		if (m && validKey(m[1])) keys.push(m[1])
	}
	return keys
}

function walk(dir, acc = []) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name)
		if (e.isDirectory()) { if (!/node_modules|unpackage|\.git|static/.test(e.name)) walk(p, acc) }
		else if (e.name.endsWith('.vue')) acc.push(p)
	}
	return acc
}

// mixin 注入到实例的键 + JS 全局 / 数组方法 / Vue 实例方法白名单
const MIXIN_KEYS = new Set(['themeClass', 'isDark', 'tbDark'])
const GLOBALS = new Set([
	'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'await', 'new', 'function',
	'String', 'Number', 'Boolean', 'Array', 'Object', 'JSON', 'Math', 'Date', 'Promise', 'RegExp',
	'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent', 'decodeURIComponent', 'setTimeout',
	'clearTimeout', 'setInterval', 'console', 'uni', 'plus', '$emit', '$nextTick', '$set', '$refs',
	'map', 'filter', 'join', 'split', 'slice', 'replace', 'includes', 'toFixed', 'toString',
	'trim', 'find', 'some', 'every', 'reduce', 'sort', 'push', 'indexOf', 'charAt', 'test',
	'match', 'concat', 'padStart', 'padEnd', 'startsWith', 'endsWith', 'toUpperCase',
	'toLowerCase', 'forEach', 'keys', 'values', 'entries', 'splice',
	// 模板里的 CSS 函数 / 静态文案（如 "uni-app (Vue 3)"）
	'var', 'rgb', 'rgba', 'hsl', 'rotate', 'translate', 'scale', 'calc', 'app'
])

// dataKeys 自检：单行 / 多行 / 值里含函数调用，都不能误判
ok('[自检] dataKeys 多行写法',
	JSON.stringify(dataKeys("data() {\n return {\n  a: 1,\n  account: { name: 'x' },\n  netOn: false\n }\n}")) === JSON.stringify(['a', 'account', 'netOn']))
ok('[自检] dataKeys 单行写法',
	JSON.stringify(dataKeys("data() { return { result: '', history: [] } }")) === JSON.stringify(['result', 'history']))
ok('[自检] dataKeys 不把值里的函数当键',
	JSON.stringify(dataKeys('data() { return { offline: TOOLS.filter(t => !t.net).length, a: 1 } }')) === JSON.stringify(['offline', 'a']))

// 对单份 .vue 源码做白屏检测，返回 { bad, unknown }
function detect(src) {
	const tpl = (src.match(/<template>([\s\S]*?)<\/template>/) || [, ''])[1]
	const script = (src.match(/<script[^>]*>([\s\S]*?)<\/script>/) || [, ''])[1]

	// 逐行提取：本项目 import 均为单行且末尾无分号，跨行正则会吞并相邻语句
	const imports = new Set()
	for (const line of script.split('\n')) {
		if (!/^\s*import\b/.test(line)) continue
		const named = line.match(/\{([^}]*)\}/)
		if (named) {
			for (const x of named[1].split(',')) {
				const n = x.trim().split(/\s+as\s+/).pop().trim()
				if (n) imports.add(n)
			}
		}
		const dflt = line.match(/import\s+([A-Za-z_$][\w$]*)\s*(?:,|from)/)
		if (dflt) imports.add(dflt[1])
	}

	const inst = new Set(MIXIN_KEYS)
	for (const key of ['methods', 'computed', 'data', 'props', 'setup'])
		for (const k of topLevelKeys(blockAfter(script, key))) inst.add(k)
	for (const k of dataKeys(script)) inst.add(k)

	const calls = [...new Set([...tpl.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]))]
	return {
		bad: calls.filter(n => imports.has(n) && !inst.has(n)),
		unknown: calls.filter(n => !inst.has(n) && !GLOBALS.has(n) && !imports.has(n) && !n.startsWith('$'))
	}
}

// 自检：故意构造一个「模板调用未暴露 import 函数」的坏文件，扫描器必须报出来。
// 否则扫描器退化成假阴性时，上面的白屏断言会毫无意义地一直通过。
const FAKE_BAD = `<template><view>{{ isGuest(account) ? 'a' : 'b' }}</view></template>
<script>
import { getAccount, isGuest } from '../../utils/account.js'
export default {
  data() { return { account: {} } },
  methods: { changeTheme(k) { return k } }
}
</script>`
const fakeBad = detect(FAKE_BAD)
ok('[自检] 扫描器能检出未暴露的 import 函数', fakeBad.bad.includes('isGuest'))
const FAKE_GOOD = FAKE_BAD.replace('methods: { changeTheme(k)', 'methods: { isGuest, changeTheme(k)')
ok('[自检] 挂到 methods 后不再误报', detect(FAKE_GOOD).bad.length === 0)

let whiteScreen = 0, unknownCalls = []
for (const file of walk(path.join(ROOT, 'components')).concat(walk(path.join(ROOT, 'pages')))) {
	const r = detect(fs.readFileSync(file, 'utf8'))
	if (r.bad.length) {
		whiteScreen++
		console.log('  白屏风险 ' + path.relative(ROOT, file).replace(/\\/g, '/') + ' => ' + r.bad.join(', '))
	}
	unknownCalls.push(...r.unknown)
}
ok('无「模板调用未暴露 import 函数」的白屏风险', whiteScreen === 0)
// 仅提示，不作为失败（模板里可能有内联箭头函数等合法写法）
if (unknownCalls.length) console.log('  [提示] 模板中未在实例/白名单找到的调用名：' + [...new Set(unknownCalls)].join(', '))

/* ========== 4. 我的页白屏专项（渲染级） ========== */
const mine = read('pages/mine/mine.vue')
const mineTpl = (mine.match(/<template>([\s\S]*?)<\/template>/) || [, ''])[1]
const mineScript = (mine.match(/<script[^>]*>([\s\S]*?)<\/script>/) || [, ''])[1]
ok('我的页 isGuest 挂到 methods', /methods\s*:\s*\{[\s\S]{0,300}?\bisGuest\b\s*,/.test(mine))
ok('我的页模板 5 处 isGuest 调用保持可用', (mineTpl.match(/isGuest\(account\)/g) || []).length === 5)

// 从真实组件定义提取实例键（data / computed / methods + mixin），构造渲染上下文，
// 再把模板里所有插值与指令表达式逐条求值。任何未暴露的标识符都会抛
// ReferenceError —— 这正是白屏的运行时表现，比字符串匹配更贴近真机。
const instanceKeys = new Set(MIXIN_KEYS)
for (const key of ['methods', 'computed', 'props', 'setup'])
	for (const k of topLevelKeys(blockAfter(mineScript, key))) instanceKeys.add(k)
for (const k of dataKeys(mineScript)) instanceKeys.add(k)
// v-for 别名（如 t in themeOptions 的 t）不是实例属性，但要参与表达式求值
for (const m of mineTpl.matchAll(/v-for="\s*\(?\s*([A-Za-z_$][\w$]*)/g)) instanceKeys.add(m[1])

const ctxNames = [...instanceKeys]
// noop 函数既可调用、又可取属性、又可参与比较，能满足模板表达式的所有用法
const ctxValues = ctxNames.map(() => function () { return true })
const exprs = []
for (const m of mineTpl.matchAll(/\{\{([\s\S]*?)\}\}/g)) exprs.push(m[1].trim())
for (const m of mineTpl.matchAll(/(?:v-if|v-else-if|v-show|:class|:style|:checked|@click|@change)="([^"]*)"/g)) exprs.push(m[1].trim())
let renderFail = 0
for (const e of exprs) {
	try { new Function(...ctxNames, 'return (' + e + ')')(...ctxValues) }
	catch (err) { renderFail++; console.log('  渲染失败表达式：' + e.slice(0, 60) + ' | ' + err.message) }
}
ok('我的页 ' + exprs.length + ' 条模板表达式全部可渲染', renderFail === 0)
// 反向自检：把 isGuest 从实例键里拿掉，渲染必须失败，否则断言本身无效
const withoutIsGuest = ctxNames.filter(n => n !== 'isGuest')
const wValues = withoutIsGuest.map(() => function () { return true })
const guestExpr = "isGuest(account) ? 'a' : 'b'"
let caught = false
try { new Function(...withoutIsGuest, 'return (' + guestExpr + ')')(...wValues) }
	catch (e) { caught = true }
ok('[自检] 未暴露 isGuest 时渲染确实报错（断言有效）', caught)

console.log('\nv2.2.1 IME + 白屏回归：' + pass + ' 通过 / ' + fail + ' 失败')
if (fail) process.exit(1)
