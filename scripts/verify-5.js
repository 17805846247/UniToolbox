/* 2.1 新增工具纯函数单测 + 三处 bug 修复的界面契约校验 */
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
const near = (name, got, want, tol = 1e-6) => ok(name + ' (' + got + ' ≈ ' + want + ')', Math.abs(got - want) <= tol)

;(async () => {
	const g = await import('data:text/javascript;base64,' + Buffer.from(read('utils/gadget.js')).toString('base64'))
	const { detectText, base64DecodeText, parseCron, CRON_PRESETS, passwordStrength,
		morseEncode, morseDecode, MORSE_TABLE, splitBill } = g

	/* ========== 1. 智能识别 ========== */
	const D = detectText
	ok('空输入', D('').empty && D('   ').empty)
	eq('空输入类型', D('').type, 'empty')
	ok('JWT 识别', D('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c').type === 'jwt')
	ok('JWT 指向 jwt 工具', D('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abc').toolKey === 'jwt')
	eq('JSON 对象识别', D('{"a":1,"b":{"c":2}}').type, 'json')
	ok('JSON 字段数', D('{"a":1,"b":2,"c":3}').facts.some(f => f.k === '顶层字段' && f.v === '3'))
	eq('JSON 数组识别', D('[1,2,3]').type, 'json')
	ok('JSON 数组元素数', D('[1,2,3]').facts.some(f => f.k === '元素数' && f.v === '3'))
	ok('非法 JSON 降级', D('{"a":1,}').label.indexOf('疑似 JSON') >= 0)
	eq('DataURL 识别', D('data:image/png;base64,iVBORw0KGgo=').type, 'dataurl')
	ok('URL 识别', D('https://example.com/path?a=1&b=2').type === 'url')
	ok('URL 参数计数', D('https://example.com/p?a=1&b=2&c=3').facts.some(f => f.k === '查询参数' && f.v === '3 个'))
	eq('HEX 颜色识别', D('#4f6ef7').type, 'color')
	eq('短 HEX 颜色识别', D('fff').type, 'color')
	eq('UUID 识别', D('550e8400-e29b-41d4-a716-446655440000').type, 'uuid')
	eq('手机号识别', D('13800138000').type, 'phone')
	ok('手机号脱敏', D('13800138000').facts.some(f => f.k === '脱敏' && f.v === '138****8000'))
	eq('身份证识别', D('11010519491231002X').type, 'idcard')
	eq('15 位身份证识别', D('110105491231002').type, 'idcard')
	eq('IP 识别', D('192.168.1.1').type, 'ip')
	eq('CIDR 识别', D('10.0.0.0/8').type, 'ip')
	ok('私有地址判断', D('192.168.1.1').facts.some(f => f.v === '私有地址'))
	ok('非法 IP 不误判', D('999.1.1.1').type !== 'ip')
	eq('邮箱识别', D('test@example.com').type, 'email')
	eq('秒级时间戳识别', D('1700000000').type, 'timestamp')
	eq('毫秒级时间戳识别', D('1700000000000').type, 'timestamp')
	ok('时间戳含本地时间', D('1700000000').facts.some(f => f.k === '本地时间'))
	eq('Cron 识别', D('*/5 * * * *').type, 'cron')
	eq('摩斯识别', D('... --- ...').type, 'morse')
	const b64 = Buffer.from('中文测试 hello', 'utf8').toString('base64')
	eq('Base64 解码', base64DecodeText(b64), '中文测试 hello')
	eq('Base64 识别', D(b64).type, 'base64')
	ok('Base64 解码预览', D(b64).facts.some(f => f.k === '解码预览' && f.v.indexOf('中文测试') >= 0))
	eq('CSV 识别', D('a,b\n1,2\n3,4').type, 'csv')
	eq('金额识别', D('1234.56').type, 'amount')
	eq('普通文本兜底', D('这是一段普通中文文字').type, 'text')
	ok('候选按置信度降序', (() => {
		const c = D('{"a":1}').candidates
		for (let i = 1; i < c.length; i++) if (c[i - 1].confidence < c[i].confidence) return false
		return true
	})())
	ok('始终有兜底候选', D('@@@@@').candidates.length >= 1)
	eq('统计：中文字符', D('中文abc').stats.chinese, 2)
	eq('统计：字符数', D('中文abc').stats.chars, 5)
	eq('统计：UTF-8 字节', D('中文abc').stats.bytes, 9)
	eq('统计：行数', D('a\nb\nc').stats.lines, 3)
	ok('null / undefined 安全', D(null).empty && D(undefined).empty)
	// 所有 toolKey 都必须是注册表里真实存在的工具
	const toolSrc = read('utils/tools.js')
	const keys = [...toolSrc.matchAll(/\{ key: '([a-z0-9]+)', name:/g)].map(m => m[1])
	let badKey = 0
	for (const s of ['{"a":1}', 'https://a.com/?x=1', '#fff', '13800138000', '10.0.0.0/8',
		'1700000000', '*/5 * * * *', '... --- ...', b64, 'a,b\n1,2', '1234.56', '普通文本']) {
		const k = D(s).toolKey
		if (k && !keys.includes(k)) { badKey++; console.log('  无效 toolKey', k, 'for', s.slice(0, 20)) }
	}
	eq('识别结果指向的工具均存在', badKey, 0)

	/* ========== 2. Cron ========== */
	const C = (expr, opts) => parseCron(expr, opts)
	ok('每 5 分钟合法', C('*/5 * * * *').valid)
	ok('每 5 分钟中文描述', C('*/5 * * * *').human.includes('每 5 分钟'))
	ok('每天 9 点描述', C('0 9 * * *').human.includes('每天 09:00'))
	ok('工作日描述', C('30 9 * * 1-5').human.includes('每周一、二、三、四、五'))
	ok('段数不足报错', !C('* * * *').valid)
	ok('段数过多报错', !C('* * * * * *').valid)
	ok('分钟越界报错', !C('60 * * * *').valid)
	ok('小时越界报错', !C('0 24 * * *').valid)
	ok('步长 0 报错', !C('*/0 * * * *').valid)
	ok('非数字报错', !C('abc * * * *').valid)
	eq('*/5 分钟取值数', C('*/5 * * * *').fields[0].values.length, 12)
	eq('*/5 首值', C('*/5 * * * *').fields[0].values[0], 0)
	eq('1-5 星期取值', C('0 9 * * 1-5').fields[4].values, [1, 2, 3, 4, 5])
	eq('1,4,7,10 月取值', C('0 0 1 1,4,7,10 *').fields[3].values, [1, 4, 7, 10])
	eq('星号字段 isAll', C('0 9 * * *').fields[2].isAll, true)
	// 以固定本地时间推算
	const from = new Date(2026, 0, 1, 0, 0, 0)
	const n1 = C('0 9 * * *', { from, count: 3 }).next
	eq('推算 3 次', n1.length, 3)
	ok('首次为 1/1 09:00', n1[0].text.startsWith('2026-01-01 09:00'))
	ok('第二次为 1/2 09:00', n1[1].text.startsWith('2026-01-02 09:00'))
	ok('时间严格递增', n1.every((x, i) => i === 0 || x.ts > n1[i - 1].ts))
	const n2 = C('*/5 * * * *', { from, count: 4 }).next
	ok('每 5 分钟间隔', n2[1].ts - n2[0].ts === 300000)
	const n3 = C('0 0 1 * *', { from, count: 2 }).next
	ok('每月 1 号', n3[0].text.startsWith('2026-02-01 00:00'))
	const n4 = C('0 8 * * 1', { from, count: 2 }).next
	ok('每周一 08:00', n4[0].text.includes('周一'))
	ok('count 上限收敛', C('* * * * *', { from, count: 99 }).next.length <= 20)
	let presetBad = 0
	for (const p of CRON_PRESETS) {
		const r = C(p.expr, { from, count: 2 })
		if (!r.valid || r.next.length < 2) { presetBad++; console.log('  预设失败', p.name, p.expr, r.error) }
	}
	eq('8 个常用预设全部可解析且有下次执行', presetBad, 0)
	ok('周 7 视为周日', C('0 0 * * 7', { from, count: 1 }).next[0].text.includes('周日'))

	/* ========== 3. 密码强度 ========== */
	const P = passwordStrength
	ok('空密码标记', P('').empty)
	eq('空密码分数 0', P('').score, 0)
	ok('123456 常见弱口令', P('123456').issues.some(x => x.includes('常见弱口令')))
	ok('123456 很弱', ['很弱', '弱'].includes(P('123456').level))
	ok('password 弱', P('password').score < 30)
	ok('纯数字被标记', P('987654321012').issues.some(x => x.includes('纯数字')))
	ok('连续序列被标记', P('abcd1234EFG!').issues.some(x => x.includes('顺序')))
	ok('重复字符被标记', P('aaaBBB111!!!').issues.some(x => x.includes('重复')))
	ok('短密码被标记', P('Ab1!').issues.some(x => x.includes('长度')))
	const strong = P('X7!mQ2@vL9#pR5t')
	ok('强密码分数高', strong.score >= 70)
	ok('强密码等级', ['强', '极强'].includes(strong.level))
	ok('字符类别齐全', strong.classes.length === 4)
	ok('熵为正', strong.entropy > 60)
	ok('破解时间有值', typeof strong.crackTime === 'string' && strong.crackTime.length > 0)
	ok('长密码熵更大', P('X7!mQ2@vL9#pR5tABCDEFGH').entropy > strong.entropy)
	ok('分数在 0-100', [P('a'), P('123456'), strong].every(x => x.score >= 0 && x.score <= 100))
	ok('总有建议', P('a').suggestions.length > 0 && strong.suggestions.length > 0)
	ok('中文密码不崩', P('密码测试ABC123!@#').score >= 0)

	/* ========== 4. 摩斯电码 ========== */
	eq('SOS 编码', morseEncode('SOS').code, '... --- ...')
	eq('SOS 解码', morseDecode('... --- ...').text, 'SOS')
	ok('单词分隔符', morseEncode('HELLO WORLD').code.includes(' / '))
	eq('往返一致', morseDecode(morseEncode('HELLO WORLD').code).text, 'HELLO WORLD')
	eq('数字编码', morseEncode('123').code, '.---- ..--- ...--')
	eq('标点编码', morseEncode('?').code, '..--..')
	ok('中文标记不支持', morseEncode('中文').unsupported.length > 0)
	ok('非法码标记', morseDecode('...... ......').invalid.length > 0)
	ok('空输入安全', morseEncode('').code === '' && morseDecode('').text === '')
	ok('码表含 26 字母 + 10 数字', Object.keys(MORSE_TABLE).length >= 36)
	let rt = 0
	for (const ch of Object.keys(MORSE_TABLE)) {
		const e = morseEncode(ch).code
		if (morseDecode(e).text !== ch.toUpperCase()) rt++
	}
	eq('全表编解码往返一致', rt, 0)

	/* ========== 5. AA 分账 ========== */
	const S = (o) => splitBill(o)
	eq('100 / 3 每人', S({ total: 100, people: 3 }).shares.map(x => x.amount), ['33.34', '33.33', '33.33'])
	eq('100 / 3 合计平衡', S({ total: 100, people: 3 }).balanced, true)
	eq('100 / 3 总额', S({ total: 100, people: 3 }).grand, '100.00')
	eq('10% 小费', S({ total: 100, people: 2, tipPercent: 10 }).tip, '10.00')
	eq('含小费总额', S({ total: 100, people: 2, tipPercent: 10 }).grand, '110.00')
	eq('含小费每人', S({ total: 100, people: 2, tipPercent: 10 }).each, '55.00')
	eq('非整除余数分配', S({ total: 10, people: 3 }).shares.map(x => x.amount), ['3.34', '3.33', '3.33'])
	eq('整元向上取整', S({ total: 100, people: 3, round: 'yuan' }).each, '34.00')
	ok('整元模式多收金额', Number(S({ total: 100, people: 3, round: 'yuan' }).overpay) > 0)
	eq('1 人独付', S({ total: 88.88, people: 1 }).each, '88.88')
	eq('0 元账单', S({ total: 0, people: 2 }).grand, '0.00')
	eq('小费上限钳制', S({ total: 100, people: 2, tipPercent: 500 }).tip, '100.00')
	ok('人数非法抛错', (() => { try { S({ total: 100, people: 0 }); return false } catch (e) { return true } })())
	ok('金额非法抛错', (() => { try { S({ total: -1, people: 2 }); return false } catch (e) { return true } })())
	ok('分摊总和等于总额（分）', (() => {
		for (const t of [0.01, 1.07, 99.99, 1234.56, 88888.88]) {
			for (const p of [1, 3, 7, 11]) {
				const r = S({ total: t, people: p })
				const sum = r.shares.reduce((a, b) => a + b.cents, 0)
				if (sum !== Math.round(r.grand * 100)) return false
			}
		}
		return true
	})())

	/* ========== 6. 三处 bug 修复的界面契约 ========== */
	const intro = read('pages/intro/intro.vue')
	const bar = read('components/ui/tb-searchbar.vue')
	const search = read('pages/search/search.vue')
	const app = read('App.vue')
	const theme = read('utils/theme.js')
	ok('引导页不再使用高度塌陷的 swiper', !intro.includes('<swiper'))
	ok('引导页使用确定高度', intro.includes('height: 100vh'))
	ok('引导页单页渲染', intro.includes('current.') && intro.includes(':key="cur"'))
	ok('引导页保留滑动手势', intro.includes('onTouchStart') && intro.includes('onTouchEnd'))
	ok('引导页接入深色', intro.includes('page-dark'))
	const tbInput = read('components/ui/tb-input.vue')
	ok('工具页搜索条非受控', bar.includes(':key="inputKey"') && bar.includes('initialValue'))
	ok('工具页搜索条不回写 value', !bar.includes(':value="value"'))
	ok('搜索页改用 tb-input 非受控封装', search.includes('<tb-input') && search.includes('v-model="kw"'))
	ok('搜索框补 min-width:0', bar.includes('min-width: 0') && tbInput.includes('min-width: 0'))
	ok('搜索框补文字填充色', bar.includes('-webkit-text-fill-color') && tbInput.includes('-webkit-text-fill-color'))
	// 中文 IME 契约（v2.2.1 根因修复）：
	// uni-app 的 ignoreCompositionEvent 默认 true，composition* 事件不触发，
	// 且 value 语义为「初始内容」——受控回写会打断拼音组合。必须完全非受控。
	const tbTextarea = read('components/ui/tb-textarea.vue')
	const tbField = read('components/ui/tb-field.vue')
	for (const [name, src] of [['tb-input', tbInput], ['tb-textarea', tbTextarea], ['tb-field', tbField]]) {
		ok(name + ' :value 绑定稳定初始值', src.includes(':value="initialValue"'))
		// 检测实际绑定语法，避免被说明性注释里的同名词干扰
		ok(name + ' 不绑定 composition 事件', !src.includes('@compositionstart') && !src.includes('@compositionend'))
		ok(name + ' 无 composing 状态字段/赋值', !/composing\s*:/.test(src) && !/composing\s*=/.test(src))
		ok(name + ' 无受控回写', !src.includes('this.view') && !src.includes(':value="view"'))
		ok(name + ' inner 影子值过滤 v-model 回传', src.includes('if (nv === this.inner) return'))
		ok(name + ' 仅外部改值时重建', src.includes('this.key++') && src.includes(':key="key"'))
	}
	const mine = read('pages/mine/mine.vue')
	ok('我的页 isGuest 已暴露到 methods（防白屏）', /methods\s*:\s*\{[\s\S]{0,300}?\bisGuest\b\s*,/.test(mine))
	ok('全局输入框继承兜底', app.includes('uni-input input'))
	ok('深色头图规则存在', app.includes('.page-dark .hero'))
	ok('深色头图改深色渐变', /\.page-dark \.hero \{[\s\S]{0,200}#222b45/.test(app))
	ok('H5 深色根标记', theme.includes("data-tb-theme"))
	ok('H5 导航栏兜底样式', app.includes('html[data-tb-theme="dark"] .uni-page-head'))

	console.log('\n2.1 新增工具 + 修复契约校验：' + pass + ' 通过 / ' + fail + ' 失败')
	if (fail) process.exit(1)
})().catch(e => { console.error(e); process.exit(1) })
