/**
 * 生活计算纯函数：贷款、个税、BMI、百分比、农历、身份证、世界时钟。
 * 全部离线，不依赖 uni / DOM；可直接用 Node 单元测试。
 */
import { BASE_DAY, START_YEAR, LUNAR_YEARS } from './lunar-data.js'

const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100
const DAY = 86400000

/* ================= 贷款计算 ================= */
/**
 * @param {number} principal 本金（元）
 * @param {number} annualRatePct 年利率（%），如 4.2 表示 4.2%
 * @param {number} months 期数（月）
 * @param {string} type 'equal' 等额本息 | 'principal' 等额本金
 */
export function calcLoan(principal, annualRatePct, months, type) {
	const P = Number(principal)
	const n = Math.floor(Number(months))
	const r = Number(annualRatePct) / 100 / 12
	if (!isFinite(P) || P <= 0) throw new Error('请输入有效的贷款金额')
	if (!isFinite(n) || n < 1 || n > 600) throw new Error('期数需在 1~600 个月之间')
	if (!isFinite(r) || r < 0) throw new Error('请输入有效的年利率')
	const kind = type === 'principal' ? 'principal' : 'equal'
	const schedule = []
	let balance = P
	let totalPayment = 0
	let totalInterest = 0

	if (kind === 'equal') {
		const monthly = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
		for (let i = 1; i <= n; i++) {
			const interest = balance * r
			let principalPart = monthly - interest
			let payment = monthly
			if (i === n) { principalPart = balance; payment = principalPart + interest }
			balance = Math.max(0, balance - principalPart)
			schedule.push({ i, payment: r2(payment), interest: r2(interest), principal: r2(principalPart), balance: r2(balance) })
			totalPayment += payment
			totalInterest += interest
		}
	} else {
		const fixed = P / n
		for (let i = 1; i <= n; i++) {
			const interest = balance * r
			const principalPart = i === n ? balance : fixed
			const payment = principalPart + interest
			balance = Math.max(0, balance - principalPart)
			schedule.push({ i, payment: r2(payment), interest: r2(interest), principal: r2(principalPart), balance: r2(balance) })
			totalPayment += payment
			totalInterest += interest
		}
	}
	return {
		type: kind, principal: P, months: n, monthlyRate: r,
		first: schedule[0].payment, last: schedule[n - 1].payment,
		totalPayment: r2(totalPayment), totalInterest: r2(totalInterest),
		monthlyDecrease: kind === 'principal' ? r2(schedule[0].payment - (schedule[1] || schedule[0]).payment) : 0,
		schedule
	}
}

/* ================= 个人所得税 ================= */
/** 综合所得年度税率表（2019 年起，七级超额累进） */
export const TAX_BRACKETS = [
	{ cap: 36000, rate: 0.03, quick: 0 },
	{ cap: 144000, rate: 0.10, quick: 2520 },
	{ cap: 300000, rate: 0.20, quick: 16920 },
	{ cap: 420000, rate: 0.25, quick: 31920 },
	{ cap: 660000, rate: 0.30, quick: 52920 },
	{ cap: 960000, rate: 0.35, quick: 85920 },
	{ cap: Infinity, rate: 0.45, quick: 181920 }
]

export function taxOfTaxable(taxable) {
	const t = Math.max(0, Number(taxable) || 0)
	const b = TAX_BRACKETS.find(x => t <= x.cap) || TAX_BRACKETS[TAX_BRACKETS.length - 1]
	return { tax: r2(Math.max(0, t * b.rate - b.quick)), rate: b.rate, quick: b.quick, bracket: b.cap }
}

/** 年度汇算：年收入 - 6 万 - 三险一金 - 专项附加扣除 - 其他扣除 */
export function calcAnnualTax(annualIncome, socialAndFund = 0, specialDeduction = 0, otherDeduction = 0) {
	const income = Number(annualIncome) || 0
	if (income < 0) throw new Error('年收入不能为负')
	const deductions = (Number(socialAndFund) || 0) + (Number(specialDeduction) || 0) + (Number(otherDeduction) || 0) + 60000
	const taxable = Math.max(0, income - deductions)
	const t = taxOfTaxable(taxable)
	return {
		income, deductions: r2(deductions), taxable: r2(taxable),
		tax: t.tax, rate: t.rate, quick: t.quick,
		afterTax: r2(income - (Number(socialAndFund) || 0) - t.tax),
		effectiveRate: income > 0 ? r2(t.tax / income * 100) : 0
	}
}

/** 月度累计预扣法：逐月算出当月应预扣税额 */
export function calcMonthlyWithholding(monthlyIncome, socialAndFund = 0, specialDeduction = 0, months = 12) {
	const m = Math.max(1, Math.min(12, Math.floor(Number(months) || 12)))
	const income = Number(monthlyIncome) || 0
	const perMonthDeduct = 5000 + (Number(socialAndFund) || 0) + (Number(specialDeduction) || 0)
	let paid = 0
	const rows = []
	for (let i = 1; i <= m; i++) {
		const cumTaxable = Math.max(0, income * i - perMonthDeduct * i)
		const cumTax = taxOfTaxable(cumTaxable).tax
		const current = r2(Math.max(0, cumTax - paid))
		paid = cumTax
		rows.push({ month: i, cumulativeTaxable: r2(cumTaxable), cumulativeTax: cumTax, tax: current, takeHome: r2(income - (Number(socialAndFund) || 0) - current) })
	}
	return { rows, totalTax: r2(rows.reduce((s, x) => s + x.tax, 0)), perMonthDeduct }
}

/* ================= BMI / 健康 ================= */
export function calcBmi(heightCm, weightKg, age, sex, activity) {
	const h = Number(heightCm) / 100
	const w = Number(weightKg)
	const a = Number(age)
	if (!isFinite(h) || h < 0.5 || h > 2.5) throw new Error('身高需在 50~250 cm 之间')
	if (!isFinite(w) || w < 10 || w > 400) throw new Error('体重需在 10~400 kg 之间')
	const bmi = w / (h * h)
	let category = '正常', advice = '保持当前体重，均衡饮食与规律运动。'
	if (bmi < 18.5) { category = '偏瘦'; advice = '可适当增加优质蛋白与主食摄入，配合力量训练。' }
	else if (bmi >= 28) { category = '肥胖'; advice = '建议控制总热量、增加有氧运动，必要时咨询医生。' }
	else if (bmi >= 24) { category = '超重'; advice = '建议减少高糖高脂摄入，每周保持 150 分钟中等强度运动。' }
	const idealMin = r2(18.5 * h * h), idealMax = r2(23.9 * h * h)
	let bmr = null, tdee = null
	if (isFinite(a) && a >= 10 && a <= 120) {
		bmr = r2(10 * w + 6.25 * Number(heightCm) - 5 * a + (sex === 'female' ? -161 : 5))
		const factors = { low: 1.2, light: 1.375, medium: 1.55, high: 1.725, veryhigh: 1.9 }
		tdee = r2(bmr * (factors[activity] || 1.375))
	}
	return {
		bmi: r2(bmi), category, advice, idealMin, idealMax,
		idealText: idealMin + ' ~ ' + idealMax + ' kg',
		bmr, tdee,
		diff: r2(w > idealMax ? w - idealMax : (w < idealMin ? w - idealMin : 0))
	}
}

/* ================= 百分比 ================= */
export function percentCalc(mode, a, b) {
	const x = Number(a), y = Number(b)
	if (!isFinite(x) || !isFinite(y)) throw new Error('请输入有效数字')
	let value = 0, text = '', formula = ''
	switch (mode) {
		case 'of':
			value = x * y / 100; formula = x + ' × ' + y + '%'; text = r2(value) + ''
			break
		case 'ratio':
			if (y === 0) throw new Error('分母不能为 0')
			value = x / y * 100; formula = x + ' ÷ ' + y + ' × 100%'; text = r2(value) + '%'
			break
		case 'add':
			value = x * (1 + y / 100); formula = x + ' × (1 + ' + y + '%)'; text = r2(value) + ''
			break
		case 'sub':
			value = x * (1 - y / 100); formula = x + ' × (1 − ' + y + '%)'; text = r2(value) + ''
			break
		case 'growth':
			if (x === 0) throw new Error('基数不能为 0')
			value = (y - x) / Math.abs(x) * 100; formula = '(' + y + ' − ' + x + ') ÷ ' + x + ' × 100%'; text = r2(value) + '%'
			break
		case 'discount':
			value = x * y / 10; formula = x + ' × ' + y + ' ÷ 10'; text = r2(value) + ' 元'
			break
		case 'original':
			if (y === 0) throw new Error('折扣不能为 0')
			value = x * 10 / y; formula = x + ' × 10 ÷ ' + y; text = r2(value) + ' 元'
			break
		default: throw new Error('未知计算类型')
	}
	return { value: r2(value), text, formula }
}

/* ================= 农历 ================= */
const CN_MONTH = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

function cnDay(d) {
	if (d === 10) return '初十'
	if (d === 20) return '二十'
	if (d === 30) return '三十'
	const prefix = d < 10 ? '初' : (d < 20 ? '十' : '廿')
	return prefix + CN_NUM[d % 10]
}

/** 位串 → 月份序列 [{ days, num, leap, name }] */
export function monthSeq(bits, leap) {
	const count = leap ? 13 : 12
	const arr = []
	let num = 0
	for (let i = 0; i < count; i++) {
		const isLeap = i === leap - 1
		if (!isLeap) num++
		arr.push({
			days: (bits & (1 << i)) ? 30 : 29,
			num, leap: isLeap,
			name: (isLeap ? '闰' : '') + CN_MONTH[num - 1] + '月'
		})
	}
	return arr
}

function yearInfo(index) {
	const row = LUNAR_YEARS[index]
	if (!row) throw new Error('仅支持 1900~2100 年')
	const seq = monthSeq(row[1], row[2])
	return { year: START_YEAR + index, spring: row[0], seq, total: seq.reduce((s, m) => s + m.days, 0) }
}

export function ganzhiOf(year) {
	const i = ((year - 4) % 60 + 60) % 60
	return GAN[i % 10] + ZHI[i % 12]
}
export function zodiacOf(year) {
	return ZODIAC[((year - 4) % 12 + 12) % 12]
}

function lunarFestival(month, day, isLeap, isLastDay) {
	if (isLeap) return ''
	const map = {
		'1-1': '春节', '1-15': '元宵节', '2-2': '龙抬头', '5-5': '端午节',
		'7-7': '七夕', '7-15': '中元节', '8-15': '中秋节', '9-9': '重阳节', '12-8': '腊八节'
	}
	if (isLastDay && month === 12) return '除夕'
	return map[month + '-' + day] || ''
}

/** 公历 → 农历 */
export function solarToLunar(y, m, d) {
	const yy = Number(y), mm = Number(m), dd = Number(d)
	const dt = new Date(Date.UTC(yy, mm - 1, dd))
	if (dt.getUTCFullYear() !== yy || dt.getUTCMonth() !== mm - 1 || dt.getUTCDate() !== dd) throw new Error('公历日期无效')
	const dayNum = Math.floor(Date.UTC(yy, mm - 1, dd) / DAY) - BASE_DAY
	if (dayNum < 0) throw new Error('仅支持 1900-01-31 之后的日期')
	let acc = 0
	for (let i = 0; i < LUNAR_YEARS.length; i++) {
		const info = yearInfo(i)
		if (dayNum < info.spring + info.total) {
			let offset = dayNum - info.spring
			if (offset < 0) throw new Error('仅支持 1900-01-31 之后的日期')
			for (let j = 0; j < info.seq.length; j++) {
				const mo = info.seq[j]
				if (offset < mo.days) {
					const lDay = offset + 1
					const isLast = lDay === mo.days && j === info.seq.length - 1
					return {
						year: info.year, month: mo.num, day: lDay, leap: mo.leap,
						monthName: mo.name, dayName: cnDay(lDay),
						text: mo.name + cnDay(lDay),
						daysInMonth: mo.days,
						ganzhi: ganzhiOf(info.year), zodiac: zodiacOf(info.year),
						festival: lunarFestival(mo.num, lDay, mo.leap, isLast),
						springDay: new Date((BASE_DAY + info.spring) * DAY).toISOString().slice(0, 10)
					}
				}
				offset -= mo.days
			}
		}
		acc += info.total
	}
	throw new Error('超出 1900~2100 年范围')
}

/** 农历 → 公历，返回 YYYY-MM-DD */
export function lunarToSolar(year, month, day, isLeap = false) {
	const index = Number(year) - START_YEAR
	const info = yearInfo(index)
	const m = Number(month), d = Number(day)
	if (m < 1 || m > 12) throw new Error('农历月份需在 1~12 之间')
	let target = info.seq.findIndex(x => x.num === m && x.leap === !!isLeap)
	if (target < 0) {
		if (isLeap) throw new Error('该年没有闰' + CN_MONTH[m - 1] + '月')
		throw new Error('农历月份无效')
	}
	if (d < 1 || d > info.seq[target].days) throw new Error('该月只有 ' + info.seq[target].days + ' 天')
	let offset = info.spring
	for (let i = 0; i < target; i++) offset += info.seq[i].days
	offset += d - 1
	return new Date((BASE_DAY + offset) * DAY).toISOString().slice(0, 10)
}

/* ================= 身份证 ================= */
const PROVINCES = {
	11: '北京', 12: '天津', 13: '河北', 14: '山西', 15: '内蒙古',
	21: '辽宁', 22: '吉林', 23: '黑龙江', 31: '上海', 32: '江苏', 33: '浙江',
	34: '安徽', 35: '福建', 36: '江西', 37: '山东', 41: '河南', 42: '湖北', 43: '湖南',
	44: '广东', 45: '广西', 46: '海南', 50: '重庆', 51: '四川', 52: '贵州', 53: '云南', 54: '西藏',
	61: '陕西', 62: '甘肃', 63: '青海', 64: '宁夏', 65: '新疆', 71: '台湾', 81: '香港', 82: '澳门', 91: '国外'
}
const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const ID_CHECK = '10X98765432'

export function calcIdChecksum(first17) {
	let sum = 0
	for (let i = 0; i < 17; i++) sum += Number(first17.charAt(i)) * ID_WEIGHTS[i]
	return ID_CHECK.charAt(sum % 11)
}

export function id15to18(id15) {
	const s = String(id15 || '').trim()
	if (!/^\d{15}$/.test(s)) throw new Error('请输入 15 位旧版身份证号码')
	const first17 = s.slice(0, 6) + '19' + s.slice(6)
	return first17 + calcIdChecksum(first17)
}

// 每项为该星座的起始日期（月*100+日）
const CONSTELLATIONS = [
	[120, '水瓶座'], [219, '双鱼座'], [321, '白羊座'], [420, '金牛座'], [521, '双子座'], [622, '巨蟹座'],
	[723, '狮子座'], [823, '处女座'], [923, '天秤座'], [1024, '天蝎座'], [1123, '射手座'], [1222, '摩羯座']
]
function constellationOf(m, d) {
	const v = m * 100 + d
	let name = '摩羯座'
	for (const [start, n] of CONSTELLATIONS) if (v >= start) name = n
	return name
}

export function parseIdCard(raw, today) {
	let id = String(raw || '').trim().toUpperCase()
	if (/^\d{15}$/.test(id)) id = id15to18(id)
	if (!/^\d{17}[\dX]$/.test(id)) throw new Error('应为 18 位号码（末位可为 X）或 15 位旧号码')
	const birth = id.slice(6, 14)
	const y = Number(birth.slice(0, 4)), m = Number(birth.slice(4, 6)), d = Number(birth.slice(6, 8))
	const dt = new Date(Date.UTC(y, m - 1, d))
	if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) throw new Error('出生日期不合法')
	const expected = calcIdChecksum(id.slice(0, 17))
	const valid = expected === id.charAt(17)
	const now = today
		? new Date(String(today).length === 10 ? today + 'T12:00:00' : today)
		: new Date()
	let age = now.getFullYear() - y
	if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--
	return {
		id, valid, expected, given: id.charAt(17),
		birth: y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'),
		age: Math.max(0, age), gender: Number(id.charAt(16)) % 2 ? '男' : '女',
		province: PROVINCES[Number(id.slice(0, 2))] || '未知',
		areaCode: id.slice(0, 6), sequence: id.slice(14, 17),
		constellation: constellationOf(m, d)
	}
}

/* ================= 世界时钟 ================= */
export const CITIES = [
	{ name: '北京 / 上海', zone: 'Asia/Shanghai', offset: 480 },
	{ name: '香港', zone: 'Asia/Hong_Kong', offset: 480 },
	{ name: '台北', zone: 'Asia/Taipei', offset: 480 },
	{ name: '东京', zone: 'Asia/Tokyo', offset: 540 },
	{ name: '首尔', zone: 'Asia/Seoul', offset: 540 },
	{ name: '新加坡', zone: 'Asia/Singapore', offset: 480 },
	{ name: '曼谷', zone: 'Asia/Bangkok', offset: 420 },
	{ name: '迪拜', zone: 'Asia/Dubai', offset: 240 },
	{ name: '孟买', zone: 'Asia/Kolkata', offset: 330 },
	{ name: '莫斯科', zone: 'Europe/Moscow', offset: 180 },
	{ name: '伦敦', zone: 'Europe/London', offset: 0 },
	{ name: '巴黎', zone: 'Europe/Paris', offset: 60 },
	{ name: '柏林', zone: 'Europe/Berlin', offset: 60 },
	{ name: '纽约', zone: 'America/New_York', offset: -300 },
	{ name: '芝加哥', zone: 'America/Chicago', offset: -360 },
	{ name: '洛杉矶', zone: 'America/Los_Angeles', offset: -480 },
	{ name: '多伦多', zone: 'America/Toronto', offset: -300 },
	{ name: '圣保罗', zone: 'America/Sao_Paulo', offset: -180 },
	{ name: '悉尼', zone: 'Australia/Sydney', offset: 600 },
	{ name: '奥克兰', zone: 'Pacific/Auckland', offset: 720 },
	{ name: 'UTC', zone: 'UTC', offset: 0 }
]

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const pad = n => String(n).padStart(2, '0')

/** 按固定偏移格式化时间戳（分钟） */
export function formatAtOffset(ts, offsetMinutes) {
	const dt = new Date(Number(ts) + Number(offsetMinutes) * 60000)
	return {
		date: dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate()),
		time: pad(dt.getUTCHours()) + ':' + pad(dt.getUTCMinutes()) + ':' + pad(dt.getUTCSeconds()),
		hourMinute: pad(dt.getUTCHours()) + ':' + pad(dt.getUTCMinutes()),
		week: WEEK[dt.getUTCDay()],
		offset: Number(offsetMinutes),
		offsetText: (offsetMinutes >= 0 ? '+' : '-') + Math.floor(Math.abs(offsetMinutes) / 60) + (Math.abs(offsetMinutes) % 60 ? ':' + pad(Math.abs(offsetMinutes) % 60) : '')
	}
}

/** 优先用 IANA 时区取真实偏移（自动处理夏令时），不支持时退回固定偏移 */
export function zoneOffsetAt(zone, ts, fallback) {
	try {
		if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return fallback
		const f = new Intl.DateTimeFormat('en-US', {
			timeZone: zone, hourCycle: 'h23',
			year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit', second: '2-digit'
		})
		const v = {}
		for (const p of f.formatToParts(new Date(Number(ts)))) if (p.type !== 'literal') v[p.type] = Number(p.value)
		const asUTC = Date.UTC(v.year, v.month - 1, v.day, v.hour % 24, v.minute, v.second)
		return Math.round((asUTC - Number(ts)) / 60000)
	} catch (e) { return fallback }
}
