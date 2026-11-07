/* v1.2 新增能力单元测试：生活计算 / 农历 / 身份证 / 世界时钟 / 网络工具 / 检索内核 */
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')

async function loadModule(src) {
	return import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))
}

;(async () => {
	// life.js 依赖相对导入，测试时把 lunar-data 内联进去（运行时工程内仍是标准 ESM）
	const lunarSrc = read('utils/lunar-data.js').replace(/^export /gm, '')
	const lifeSrc = read('utils/life.js').replace(/^import \{[^}]*\} from '\.\/lunar-data\.js'\s*$/m, '')
	const life = await loadModule(lunarSrc + '\n' + lifeSrc)
	const dev = await loadModule(read('utils/devkit.js'))
	const search = await loadModule(read('utils/search.js'))

	let pass = 0, fail = 0
	const eq = (name, got, want) => {
		if (JSON.stringify(got) === JSON.stringify(want)) pass++
		else { fail++; console.log('  FAIL ' + name + ': got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want)) }
	}
	const ok = (name, cond) => eq(name, !!cond, true)
	const near = (name, got, want, tol = 0.02) => ok(name + ' (' + got + '≈' + want + ')', Math.abs(got - want) <= tol)
	const thr = (name, fn) => { try { fn(); fail++; console.log('  FAIL ' + name + ': 应抛异常') } catch (e) { pass++ } }

	/* ---------- 贷款 ---------- */
	const loan = life.calcLoan(1000000, 4.2, 360, 'equal')
	const r = 0.042 / 12, expectMonthly = 1000000 * r * Math.pow(1 + r, 360) / (Math.pow(1 + r, 360) - 1)
	near('等额本息月供', loan.first, expectMonthly, 0.01)
	eq('等额本息首尾相同', loan.first, loan.last)
	near('总利息=总还款-本金', loan.totalInterest, loan.totalPayment - 1000000, 0.5)
	eq('等额本息期数', loan.schedule.length, 360)
	eq('最后一期余额归零', loan.schedule[359].balance, 0)
	const zero = life.calcLoan(120000, 0, 12, 'equal')
	eq('零利率月供', zero.first, 10000)
	eq('零利率总利息', zero.totalInterest, 0)
	const eqp = life.calcLoan(120000, 6, 12, 'principal')
	eq('等额本金首期', eqp.first, 10600)
	eq('等额本金递减额', eqp.monthlyDecrease, 50)
	ok('等额本金总利息更少', eqp.totalInterest < life.calcLoan(120000, 6, 12, 'equal').totalInterest)
	thr('贷款金额非法', () => life.calcLoan(-1, 4, 12, 'equal'))
	thr('期数非法', () => life.calcLoan(1000, 4, 0, 'equal'))

	/* ---------- 个税 ---------- */
	eq('税率档 36000', life.taxOfTaxable(36000).tax, 1080)
	eq('税率档 36001', life.taxOfTaxable(36001).tax, 1080.1)
	eq('税率档 144000', life.taxOfTaxable(144000).tax, 11880)
	eq('税率档 960000', life.taxOfTaxable(960000).tax, 250080)
	const annual = life.calcAnnualTax(200000)
	eq('年度应纳税所得额', annual.taxable, 140000)
	eq('年度税额', annual.tax, 11480)
	eq('低收入免税', life.calcAnnualTax(50000).tax, 0)
	const monthly = life.calcMonthlyWithholding(10000, 1000, 1000, 12)
	eq('累计预扣月份数', monthly.rows.length, 12)
	ok('月度税额合计非负', monthly.totalTax >= 0)
	near('月度税额合计≈年度税额', monthly.totalTax, life.calcAnnualTax(120000, 12000, 12000).tax, 1)

	/* ---------- BMI ---------- */
	const bmi = life.calcBmi(170, 65, 30, 'male', 'medium')
	eq('BMI 值', bmi.bmi, 22.49)
	eq('BMI 分类', bmi.category, '正常')
	eq('BMR', bmi.bmr, 1567.5)
	eq('TDEE', bmi.tdee, 2429.63)
	eq('理想体重下限', bmi.idealMin, 53.47)
	eq('偏瘦', life.calcBmi(180, 50).category, '偏瘦')
	eq('肥胖', life.calcBmi(170, 90).category, '肥胖')
	thr('身高非法', () => life.calcBmi(10, 60))

	/* ---------- 百分比 ---------- */
	eq('求百分比', life.percentCalc('of', 200, 15).value, 30)
	eq('占比', life.percentCalc('ratio', 50, 200).value, 25)
	eq('增加', life.percentCalc('add', 100, 10).value, 110)
	eq('减少', life.percentCalc('sub', 100, 10).value, 90)
	eq('增长率', life.percentCalc('growth', 100, 120).value, 20)
	eq('负增长', life.percentCalc('growth', 100, 80).value, -20)
	eq('折扣', life.percentCalc('discount', 100, 8).value, 80)
	eq('反推原价', life.percentCalc('original', 80, 8).value, 100)
	thr('占比分母为 0', () => life.percentCalc('ratio', 1, 0))

	/* ---------- 农历（与 ICU 交叉验证） ---------- */
	const spring = life.solarToLunar(2024, 2, 10)
	eq('2024 春节农历', spring.text, '正月初一')
	eq('2024 干支', spring.ganzhi, '甲辰')
	eq('2024 生肖', spring.zodiac, '龙')
	eq('2024 节日', spring.festival, '春节')
	eq('2026-11-07 农历', life.solarToLunar(2026, 11, 7).text, '九月廿九')
	eq('2025 闰六月初一', life.solarToLunar(2025, 7, 25).text, '闰六月初一')
	eq('2024 中秋', life.solarToLunar(2024, 9, 17).festival, '中秋节')
	eq('农历→公历 春节', life.lunarToSolar(2024, 1, 1), '2024-02-10')
	eq('农历→公历 闰月', life.lunarToSolar(2025, 6, 1, true), '2025-07-25')
	eq('农历→公历 腊月', life.lunarToSolar(2026, 12, 8), '2027-01-15')
	eq('干支 1984', life.ganzhiOf(1984), '甲子')
	eq('生肖 2026', life.zodiacOf(2026), '马')
	thr('农历越界', () => life.solarToLunar(2200, 1, 1))
	thr('不存在的闰月', () => life.lunarToSolar(2024, 6, 1, true))

	const fmt = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric' })
	const spanStart = Date.UTC(1900, 1, 1)
	const span = Date.UTC(2100, 10, 30) - spanStart
	let cross = 0
	for (let i = 0; i < 240; i++) {
		const ts = spanStart + ((i * 7919 * 86400000) % span)
		const dt = new Date(ts)
		const p = {}
		for (const part of fmt.formatToParts(new Date(ts + 12 * 3600 * 1000))) if (part.type !== 'literal') p[part.type] = part.value
		const mine = life.solarToLunar(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
		const stdMonth = parseInt(p.month, 10)
		if (mine.month === stdMonth && mine.day === Number(p.day) && mine.leap === /bis$/.test(p.month)) cross++
		else console.log('  FAIL 农历交叉验证 ' + dt.toISOString().slice(0, 10) + ' mine=' + JSON.stringify([mine.month, mine.day, mine.leap]) + ' std=' + JSON.stringify(p))
	}
	eq('农历与 ICU 逐日一致（240 个日期）', cross, 240)

	/* ---------- 身份证 ---------- */
	const id = life.parseIdCard('11010519491231002X', '2026-11-07')
	eq('身份证校验通过', id.valid, true)
	eq('身份证生日', id.birth, '1949-12-31')
	eq('身份证性别', id.gender, '女')
	eq('身份证地区', id.province, '北京')
	eq('身份证年龄', id.age, 76)
	eq('身份证星座', id.constellation, '摩羯座')
	eq('校验码计算', life.calcIdChecksum('11010519491231002'), 'X')
	eq('校验失败', life.parseIdCard('110105194912310020', '2026-11-07').valid, false)
	eq('15→18 位', life.id15to18('110105491231002'), '11010519491231002X')
	thr('身份证位数非法', () => life.parseIdCard('123'))
	thr('身份证生日非法', () => life.parseIdCard('11010519491331002X'))

	/* ---------- 世界时钟 ---------- */
	eq('UTC+8 格式化', life.formatAtOffset(0, 480).time, '08:00:00')
	eq('UTC-5 日期回退', life.formatAtOffset(0, -300).date, '1969-12-31')
	eq('UTC+8 偏移文案', life.formatAtOffset(0, 480).offsetText, '+8')
	eq('UTC+5:30 偏移文案', life.formatAtOffset(0, 330).offsetText, '+5:30')
	eq('上海时区偏移', life.zoneOffsetAt('Asia/Shanghai', Date.UTC(2026, 6, 1), 0), 480)
	eq('UTC 偏移', life.zoneOffsetAt('UTC', Date.UTC(2026, 6, 1), 999), 0)
	eq('纽约 1 月 -5', life.zoneOffsetAt('America/New_York', Date.UTC(2026, 0, 15), 0), -300)
	eq('纽约 7 月夏令时 -4', life.zoneOffsetAt('America/New_York', Date.UTC(2026, 6, 15), 0), -240)

	/* ---------- IP / CIDR ---------- */
	const c = dev.parseCidr('192.168.1.10/24')
	eq('网络地址', c.network, '192.168.1.0')
	eq('广播地址', c.broadcast, '192.168.1.255')
	eq('子网掩码', c.mask, '255.255.255.0')
	eq('反掩码', c.wildcard, '0.0.0.255')
	eq('可用首地址', c.firstHost, '192.168.1.1')
	eq('可用末地址', c.lastHost, '192.168.1.254')
	eq('可用主机数', c.hostCount, 254)
	eq('私有地址', c.isPrivate, true)
	eq('CIDR 归一化', c.cidr, '192.168.1.0/24')
	eq('掩码点分写法', dev.parseCidr('192.168.1.10/255.255.255.0').prefix, 24)
	eq('A 类私网 /8', dev.parseCidr('10.1.2.3/8').network, '10.0.0.0')
	eq('/30 主机数', dev.parseCidr('192.0.2.0/30').hostCount, 2)
	eq('/31 主机数', dev.parseCidr('192.0.2.0/31').hostCount, 2)
	eq('/32 主机数', dev.parseCidr('192.0.2.1/32').hostCount, 1)
	eq('默认 /32', dev.parseCidr('8.8.8.8').prefix, 32)
	eq('回环地址', dev.parseCidr('127.0.0.1/8').kind, '回环地址')
	eq('二进制长度', c.binary[0].replace(/ /g, '').length, 32)
	eq('ipToInt/intToIp', dev.intToIp(dev.ipToInt('255.255.255.255')), '255.255.255.255')
	thr('IP 段越界', () => dev.parseCidr('256.1.1.1/24'))
	thr('掩码位越界', () => dev.parseCidr('192.168.1.1/33'))
	thr('非法掩码', () => dev.parseCidr('192.168.1.1/255.0.255.0'))

	/* ---------- EAN-13 ---------- */
	const ean = dev.ean13Encode('4006381333931')
	eq('EAN13 校验位', ean.checkDigit, 1)
	eq('EAN13 有效', ean.valid, true)
	eq('EAN13 模块数', ean.modules, 95)
	eq('EAN13 起始符', ean.bits.slice(0, 3), '101')
	eq('EAN13 终止符', ean.bits.slice(-3), '101')
	eq('EAN13 中间分隔', ean.bits.slice(45, 50), '01010')
	eq('EAN13 自动补校验位', dev.ean13Encode('400638133393').digits, '4006381333931')
	eq('EAN13 校验位错误', dev.ean13Encode('4006381333932').valid, false)
	eq('EAN13 编码可复现', dev.ean13Encode('4006381333931').bits, ean.bits)
	thr('EAN13 位数非法', () => dev.ean13Encode('123'))

	/* ---------- 速查 / 传感器 ---------- */
	eq('速查 404', dev.searchCheats('404').length, 1)
	eq('速查 404 内容', dev.searchCheats('404')[0].items[0][1], 'Not Found 资源不存在')
	eq('速查 空查询分组数', dev.searchCheats('').length, 6)
	eq('速查 无结果', dev.searchCheats('zzzz-not-exist').length, 0)
	eq('水平仪 平放', dev.tiltFromAcceleration(0, 0, 9.8).level, true)
	eq('水平仪 倾角', dev.tiltFromAcceleration(9.8, 0, 0).angle, 90)
	eq('方位 东', dev.directionName(90), '东')
	eq('方位 北', dev.directionName(0), '北')
	eq('方位 归一化', dev.directionName(-90), '西')

	/* ---------- 检索内核 ---------- */
	const S = [
		{ key: 'qrcode', name: '二维码生成', desc: '文字网址生成二维码', cat: 'utility', tags: 'qrcode 二维码', abbr: 'ewmsc ewm', alias: 'qr 扫码名片' },
		{ key: 'loan', name: '贷款计算器', desc: '等额本息与等额本金', cat: 'life', tags: '房贷 月供', abbr: 'dkjsq dk', alias: '房贷 按揭' },
		{ key: 'scan', name: '扫码识别', desc: '相机识别二维码', cat: 'utility', tags: '扫码 相机', abbr: 'smsb sm', alias: '扫一扫' }
	]
	eq('拼音全拼首字母', search.smartSearch('ewm', S)[0].key, 'qrcode')
	eq('拼音首字母简写', search.smartSearch('dk', S)[0].key, 'loan')
	eq('中文名', search.smartSearch('贷款', S)[0].key, 'loan')
	eq('别名', search.smartSearch('按揭', S)[0].key, 'loan')
	eq('英文 key', search.smartSearch('qrcode', S)[0].key, 'qrcode')
	eq('描述命中', search.smartSearch('等额本金', S)[0].key, 'loan')
	eq('多关键词 AND', search.smartSearch('贷款 月供', S).map(x => x.key), ['loan'])
	eq('多关键词无结果', search.smartSearch('贷款 二维码', S).length, 0)
	eq('分类过滤 #life', search.smartSearch('#life 贷款', S).map(x => x.key), ['loan'])
	eq('分类参数', search.smartSearch('二维码', S, { cat: 'life' }).length, 0)
	eq('收藏加权', search.smartSearch('扫', S, { favs: ['scan'] })[0].key, 'scan')
	eq('最近使用加权', search.smartSearch('码', S, { recent: ['qrcode'] })[0].key, 'qrcode')
	eq('空查询返回全部', search.smartSearch('', S).length, 3)
	eq('全角归一化', search.normalize('ＱＲ　Ａ'), 'qr a')
	eq('高亮分段', search.highlight('二维码生成', '二维'), [{ t: '二维', hit: true }, { t: '码生成', hit: false }])
	eq('多词高亮', search.highlight('贷款计算器', '贷款 计算'), [{ t: '贷款计算', hit: true }, { t: '器', hit: false }])
	eq('解析查询', search.parseQuery('#life 贷款 月供'), { terms: ['贷款', '月供'], cat: 'life' })
	eq('热门词', search.HOT_WORDS.includes('二维码'), true)
	eq('兼容旧接口', search.legacySearch('ewm', S, []).map(x => x.key), ['qrcode'])

	/* ---------- 真实工具注册表检索 ---------- */
	const searchFlat = read('utils/search.js').replace(/^export /gm, '')
	const toolsFlat = read('utils/tools.js')
		.replace(/^import \{[^}]*\} from '\.\/search\.js'\s*$/m, '')
		.replace(/^export /gm, '')
		.replace(/^\{ smartSearch \}\s*$/m, '')
	const reg = await loadModule(searchFlat + '\n' + toolsFlat +
		'\nexport { TOOLS, CATEGORIES, SEARCH_INDEX, searchTools, catName, smartSearch }\n')
	// 数量随版本增长，这里改为「不退化 + 索引与注册表同步」，避免每次加工具都要改脚本
	ok('注册表工具数不退化', reg.TOOLS.length >= 44)
	eq('分类数', reg.CATEGORIES.length, 5)
	eq('检索索引数与注册表一致', reg.SEARCH_INDEX.length, reg.TOOLS.length)
	ok('所有工具均带检索元数据', reg.TOOLS.every(t => t.abbr && t.alias && t.desc && t.tags))
	eq('注册表 拼音 ewm', reg.smartSearch('ewm', reg.SEARCH_INDEX)[0].key, 'qrcode')
	eq('注册表 拼音 dk', reg.smartSearch('dk', reg.SEARCH_INDEX)[0].key, 'loan')
	eq('注册表 别名 房贷', reg.smartSearch('房贷', reg.SEARCH_INDEX)[0].key, 'loan')
	eq('注册表 别名 阴历', reg.smartSearch('阴历', reg.SEARCH_INDEX)[0].key, 'lunar')
	eq('注册表 分类过滤', reg.smartSearch('#life', reg.SEARCH_INDEX).every(t => t.cat === 'life'), true)
	eq('生活计算工具数', reg.smartSearch('#life', reg.SEARCH_INDEX).length, reg.TOOLS.filter(t => t.cat === 'life').length)
	eq('注册表 兼容搜索', reg.searchTools('汇率')[0].key, 'netrate')
	// 2.1 新增的 5 个工具必须能通过拼音 / key 检索到
	eq('新工具 智能识别 znsb', reg.smartSearch('znsb', reg.SEARCH_INDEX)[0].key, 'detect')
	eq('新工具 Cron cronbds', reg.smartSearch('cronbds', reg.SEARCH_INDEX)[0].key, 'cron')
	eq('新工具 分账 aafz', reg.smartSearch('aafz', reg.SEARCH_INDEX)[0].key, 'split')
	eq('新工具 密码强度 mmqdjc', reg.smartSearch('mmqdjc', reg.SEARCH_INDEX)[0].key, 'pwdstrength')
	eq('新工具 摩斯 msdm', reg.smartSearch('msdm', reg.SEARCH_INDEX)[0].key, 'morse')
	eq('每个 key 都能精确命中自己',
		reg.TOOLS.filter(t => !reg.smartSearch(t.key, reg.SEARCH_INDEX).length ||
			reg.smartSearch(t.key, reg.SEARCH_INDEX)[0].key !== t.key).map(t => t.key), [])

	console.log('\nv1.2 新增单元测试：' + pass + ' 通过 / ' + fail + ' 失败')
	if (fail) process.exit(1)
})().catch(e => { console.error('测试脚本异常：' + (e && e.message ? e.message : e)); process.exit(1) })
