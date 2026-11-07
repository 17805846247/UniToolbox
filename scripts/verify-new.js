/* 新增核心库单元测试：format-extra.js / net-config.js / net.js */
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
const load = async p => import('data:text/javascript;base64,' + Buffer.from(read(p)).toString('base64'))

let pass = 0, fail = 0
const eq = (name, got, want) => {
	if (JSON.stringify(got) === JSON.stringify(want)) pass++
	else { fail++; console.log('  FAIL ' + name + ': got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)) }
}
const ok = (name, cond) => eq(name, !!cond, true)
const thr = (name, fn) => { try { fn(); fail++; console.log('  FAIL ' + name + ': 应抛异常') } catch (e) { pass++ } }

// 模拟 uni 环境
const store = {}
let mockHandler = null, calls = []
globalThis.uni = {
	getStorageSync: k => store[k],
	setStorageSync: (k, v) => { store[k] = v },
	$emit: () => {},
	$on: () => {},
	getNetworkType: o => o.success({ networkType: 'wifi' }),
	request: o => { calls.push(o); if (mockHandler) mockHandler(o) }
}

;(async () => {
	const fx = await load('utils/format-extra.js')
	const cfg = read('utils/net-config.js').replace(/^export /gm, '')
	const netSrc = read('utils/net.js').replace(/import\s*\{[^}]*\}\s*from\s*'\.\/net-config\.js'\s*/, cfg + '\n')
	const net = await import('data:text/javascript;base64,' + Buffer.from(netSrc).toString('base64'))

	/* ---------- 正则 ---------- */
	const r1 = fx.regexRun('a', 'g', 'banana')
	eq('regex count', r1.count, 3)
	eq('regex segments hits', r1.segments.filter(s => s.hit).length, 3)
	eq('regex segments join', r1.segments.map(s => s.text).join(''), 'banana')
	const r2 = fx.regexRun('(\\d+)', 'g', 'a12b3', '[$1]')
	eq('regex replaced', r2.replaced, 'a[12]b[3]')
	eq('regex groups', r2.matches[0].groups, ['12'])
	eq('regex flags i', fx.regexRun('ABC', 'gi', 'abcABC').count, 2)
	thr('regex invalid', () => fx.regexRun('[', 'g', 'abc'))

	/* ---------- UUID ---------- */
	const u = fx.uuidV4(() => 0)
	eq('uuid format', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(u), true)
	eq('uuid zero', u, '00000000-0000-4000-8000-000000000000')
	eq('shortId len', fx.shortId(20, fx.NANO_ALPHABET, () => 0).length, 20)
	eq('shortId char', fx.shortId(5, fx.NANO_ALPHABET, () => 0), 'AAAAA')
	eq('generateIds count', fx.generateIds('uuid', 7, { rng: () => 0.5 }).length, 7)
	eq('generateIds num', fx.generateIds('num', 1, { size: 6, rng: () => 0 })[0], '000000')

	/* ---------- Diff ---------- */
	const d = fx.diffLines('a\nb\nc', 'a\nB\nc\nd')
	eq('diff stats', d.stats, { same: 2, add: 2, del: 1 })
	eq('diff first', d.rows[0], { type: 'same', text: 'a', noA: 1, noB: 1 })
	ok('diff has add', d.rows.some(r => r.type === 'add' && r.text === 'B'))
	eq('diff identical', fx.diffLines('x\ny', 'x\ny').stats, { same: 2, add: 0, del: 0 })
	thr('diff too long', () => fx.diffLines('x\n'.repeat(500), 'y', 400))

	/* ---------- URL ---------- */
	const p = fx.parseUrl('https://a.com/p?name=%E4%B8%AD%E6%96%87&x=1&x=2&flag#frag')
	eq('url base', p.base, 'https://a.com/p')
	eq('url count', p.count, 4)
	eq('url decode', p.pairs[0], { key: 'name', value: '中文' })
	eq('url plain query', fx.parseUrl('a=1&b=2').count, 2)
	eq('buildQuery', fx.buildQuery([{ key: 'q', value: '中 文' }, { key: 'n', value: 2 }]), 'q=%E4%B8%AD%20%E6%96%87&n=2')
	eq('query roundtrip', fx.parseUrl('?' + fx.buildQuery(p.pairs)).pairs, p.pairs)
	eq('queryToObject dup', fx.queryToObject([{ key: 'x', value: '1' }, { key: 'x', value: '2' }]), { x: ['1', '2'] })

	/* ---------- JWT ---------- */
	const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
	const token = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: '中文用户', exp: 1900000000 }) + '.sig'
	const jw = fx.decodeJwt(token)
	eq('jwt header', jw.header, { alg: 'HS256', typ: 'JWT' })
	eq('jwt payload utf8', jw.payload.sub, '中文用户')
	eq('jwt signature', jw.signature, 'sig')
	eq('jwt Bearer', fx.decodeJwt('Bearer ' + token).payload.exp, 1900000000)
	thr('jwt bad parts', () => fx.decodeJwt('abc'))
	thr('jwt bad json', () => fx.decodeJwt('bm90anNvbg.e30.sig'))

	/* ---------- 人民币大写 ---------- */
	const rmb = [
		['0', '零元整'], ['1', '壹元整'], ['10', '壹拾元整'], ['100.5', '壹佰元伍角'],
		['1234.56', '壹仟贰佰叁拾肆元伍角陆分'], ['10001', '壹万零壹元整'],
		['100000000', '壹亿元整'], ['100000001', '壹亿零壹元整'],
		['-12.3', '负壹拾贰元叁角'], ['0.07', '零元零柒分'], ['20.05', '贰拾元零伍分']
	]
	for (const [n, want] of rmb) eq('rmb ' + n, fx.rmbUpper(n), want)
	thr('rmb invalid', () => fx.rmbUpper('abc'))
	thr('rmb huge', () => fx.rmbUpper('99999999999999999'))

	/* ---------- Markdown ---------- */
	const md = fx.markdownToHtml('# 标题\n\n**粗体** 和 `code`\n\n- 甲\n- 乙\n\n> 引用\n\n---')
	ok('md h1', md.includes('<h1>标题</h1>'))
	ok('md strong', md.includes('<strong>粗体</strong>'))
	ok('md code', md.includes('<code>code</code>'))
	ok('md list', md.includes('<ul>') && md.includes('<li>甲</li>'))
	ok('md quote', md.includes('<blockquote>引用</blockquote>'))
	ok('md hr', md.includes('<hr/>'))
	ok('md xss', !fx.markdownToHtml('<script>alert(1)</script>').includes('<script>'))
	ok('md fence', fx.markdownToHtml('```\n<a>\n```').includes('&lt;a&gt;'))

	/* ---------- net-config ---------- */
	const ncfg = await load('utils/net-config.js')
	eq('ver greater', ncfg.compareVersion('1.2.0', '1.1.9'), 1)
	eq('ver equal', ncfg.compareVersion('v1.1', '1.1.0'), 0)
	eq('ver less', ncfg.compareVersion('1.0.9', '1.1.0'), -1)
	eq('url valid', ncfg.isValidHttpUrl('https://a.com/x?y=1'), true)
	eq('url invalid', ncfg.isValidHttpUrl('ftp://a.com'), false)
	ok('sources ip', ncfg.API_SOURCES.ip.length >= 2)

	/* ---------- net：默认关闭 ---------- */
	eq('net default off', net.isNetEnabled(), false)
	let sent = 0
	net.setRequestAdapter(o => { sent++; o.success({ statusCode: 200, data: '{}' }) })
	await net.request({ url: 'https://example.com' }).then(() => { fail++; console.log('  FAIL 关闭时不应成功') }, e => { pass++; ok('off error msg', e.message.includes('未开启')) })
	eq('net no request when off', sent, 0)

	/* ---------- net：开启后请求 ---------- */
	net.setNetEnabled(true)
	eq('net on', net.isNetEnabled(), true)
	mockHandler = null
	net.setRequestAdapter(o => { calls.push(o); o.success({ statusCode: 200, header: { 'Content-Type': 'application/json' }, data: '{"a":1}' }) })
	const r = await net.request({ url: 'https://example.com/api', method: 'POST' })
	eq('req status', r.status, 200)
	eq('req body', r.text, '{"a":1}')
	ok('req elapsed', typeof r.elapsed === 'number')
	eq('normalize obj data', net.normalizeResponse({ statusCode: 201, data: { x: 1 } }).text, '{"x":1}')
	await net.request({ url: 'javascript:alert(1)' }).then(() => { fail++; console.log('  FAIL 非法 URL 应拒绝') }, () => pass++)

	/* ---------- net：解析各类数据 ---------- */
	eq('parse ipapi', net.parsePayload('ipapi', '{"ip":"1.2.3.4","city":"杭州","country_name":"中国"}').city, '杭州')
	eq('parse ipwho', net.parsePayload('ipwho', '{"ip":"5.6.7.8","connection":{"isp":"CMCC"}}').org, 'CMCC')
	eq('parse erapi', net.parsePayload('erapi', '{"rates":{"USD":0.14,"CNY":1}}').rates.USD, 0.14)
	eq('parse fawaz', net.parsePayload('fawaz', '{"date":"2026-11-07","cny":{"usd":0.14}}').rates.USD, 0.14)
	eq('parse hitokoto', net.parsePayload('hitokoto', '{"hitokoto":"你好","from":"佚名"}').text, '你好')
	eq('parse worldtime', net.parsePayload('worldtime', '{"datetime":"2026-11-07T18:00:00+08:00"}').source, 'worldtimeapi')
	eq('parse update', net.parsePayload('update', '{"versionName":"1.2.0","note":"新功能"}').version, '1.2.0')
	thr('parse bad json', () => net.parsePayload('ipapi', 'not json'))

	/* ---------- net：失败降级 ---------- */
	let attempt = 0
	net.setRequestAdapter(o => {
		attempt++
		if (o.url.includes('ipapi.co')) return o.fail({ errMsg: '模拟超时' })
		o.success({ statusCode: 200, data: JSON.stringify({ ip: '9.9.9.9', city: '北京', country: '中国' }) })
	})
	const fb = await net.fetchSource('ip')
	eq('fallback attempts', attempt, 2)
	eq('fallback source', fb.source, 'ipwho.is')
	eq('fallback data', fb.data.ip, '9.9.9.9')

	net.setRequestAdapter(o => o.fail({ errMsg: '全部超时' }))
	await net.fetchSource('quote').then(() => { fail++; console.log('  FAIL 全失败应报错') }, e => { pass++; ok('all fail msg', e.message.includes('全部数据源不可用')) })

	/* ---------- net：HTTP 调试 / 网络信息 / 更新 ---------- */
	net.setRequestAdapter(o => o.success({ statusCode: 404, header: { Server: 'mock' }, data: '{"err":"no"}' }))
	const dbg = await net.httpDebug({ url: 'https://example.com/missing' })
	eq('debug status', dbg.status, 404)
	ok('debug pretty', dbg.text.includes('\n'))

	net.setRequestAdapter(o => {
		if (o.url.includes('ipapi.co')) return o.success({ statusCode: 200, data: JSON.stringify({ ip: '1.1.1.1', city: '上海', country_name: '中国' }) })
		return o.success({ statusCode: 200, data: JSON.stringify({ datetime: '2026-11-07T18:00' }) })
	})
	const info = await net.fetchNetworkInfo()
	eq('info net type', info.networkType, 'wifi')
	eq('info ip', info.ip.data.ip, '1.1.1.1')
	ok('info time', !!info.time)

	await net.checkUpdate('1.1.0').then(() => { fail++; console.log('  FAIL 未配置地址应报错') }, () => pass++)
	store['tb_update_url'] = 'https://example.com/version.json'
	net.setRequestAdapter(o => o.success({ statusCode: 200, data: JSON.stringify({ versionName: '1.2.0', note: '新增工具' }) }))
	const up = await net.checkUpdate('1.1.0')
	eq('update version', up.version, '1.2.0')
	eq('update hasUpdate', up.hasUpdate, true)

	console.log('\n新库单元测试：' + pass + ' 通过 / ' + fail + ' 失败')
	process.exit(fail ? 1 : 0)
})().catch(e => { console.error(e); process.exit(1) })
