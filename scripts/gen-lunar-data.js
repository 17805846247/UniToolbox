/**
 * 构建期脚本：用 Node 内置的 ICU 中国农历日历，生成 1900-2100 年的离线数据表。
 * 生成的 utils/lunar-data.js 是纯数据，App 运行时不需要 Intl、不需要联网。
 * 用法：node scripts/gen-lunar-data.js
 */
const fs = require('fs')
const path = require('path')

const fmt = new Intl.DateTimeFormat('en-u-ca-chinese', {
	year: 'numeric', month: 'numeric', day: 'numeric'
})
const DAY = 86400000
const START = Date.UTC(1900, 0, 31) / DAY
// 多扫一年，保证 2100 农历年有完整的结束边界，最后再裁掉多余年份
const END = Date.UTC(2102, 1, 28) / DAY

function lunarOf(day) {
	const parts = fmt.formatToParts(new Date(day * DAY + 12 * 3600 * 1000))
	let m = '', d = '', y = ''
	for (const p of parts) {
		if (p.type === 'month') m = p.value
		else if (p.type === 'day') d = p.value
		else if (p.type === 'relatedYear') y = p.value
	}
	const bis = /bis$/.test(m)
	return { m: parseInt(m, 10), d: parseInt(d, 10), y: parseInt(y, 10), bis }
}

const rows = []
let cur = null

function finish(endDay) {
	if (!cur) return
	// 2101 及以后只作为 2100 的结束边界，不写入数据
	if (cur.y > 2100) return
	// 月份天数必须是 29 / 30；闰月位置
	let bits = 0
	let leap = 0
	cur.seq.forEach((mo, i) => {
		if (mo.days === 30) bits |= (1 << i)
		if (mo.bis) leap = i + 1
	})
	if (cur.seq.length < 12 || cur.seq.length > 13) throw new Error('月份数异常 ' + cur.y + ' => ' + cur.seq.length)
	for (const mo of cur.seq) {
		if (mo.days !== 29 && mo.days !== 30) throw new Error('月天数异常 ' + cur.y + ' => ' + JSON.stringify(mo))
	}
	if (cur.spring < START) throw new Error('春节早于基准 ' + cur.y)
	rows.push({ y: cur.y, spring: cur.spring - START, bits, leap, total: endDay - cur.spring, count: cur.seq.length })
}

for (let day = START; day < END; day++) {
	const p = lunarOf(day)
	if (p.d === 1 && !p.bis && p.m === 1 && p.y >= 1900) {
		finish(day)
		cur = { y: p.y, spring: day, seq: [] }
	}
	if (cur) {
		if (p.d === 1) cur.seq.push({ m: p.m, bis: p.bis, days: 0 })
		if (cur.seq.length) cur.seq[cur.seq.length - 1].days++
	}
}
finish(END)
// 只保留 1900-2100 的完整年份（末年是给最后一年算结束边界用的）
rows.splice(201)

// 校验：春节、总天数连续性、已知日期
const byYear = new Map(rows.map(r => [r.y, r]))
for (const [y, md] of [[2024, '02-10'], [2025, '01-29'], [2026, '02-17'], [2023, '01-22'], [2033, '01-31']]) {
	const r = byYear.get(y)
	if (!r) throw new Error('缺少年份 ' + y)
	const d = new Date((START + r.spring) * DAY).toISOString().slice(0, 10)
	if (d !== y + '-' + md) throw new Error('春节校验失败 ' + y + ': ' + d + ' != ' + y + '-' + md)
}
for (let i = 1; i < rows.length; i++) {
	if (rows[i - 1].spring + rows[i - 1].total !== rows[i].spring) {
		throw new Error('日期不连续：' + rows[i - 1].y + ' -> ' + rows[i].y)
	}
}
if (rows.length !== 201) throw new Error('年份数异常：' + rows.length)

const out = `/**
 * 农历离线数据（1900-2100），由 scripts/gen-lunar-data.js 依据 ICU 中国农历生成，请勿手改。
 * 每年一条 [春节距 1900-01-31 的天数, 月大小位串(第 i 位 1=30天 0=29天), 闰月位置(0=无)]。
 * 数据已通过春节日期、逐年连续性校验；运行时只做整数运算，不依赖 Intl / 网络。
 */
export const BASE_DAY = ${START}
export const START_YEAR = 1900
export const LUNAR_YEARS = [
${rows.map(r => `\t[${r.spring}, ${r.bits}, ${r.leap}]`).join(',\n')}
]
`
const target = path.join(__dirname, '..', 'utils', 'lunar-data.js')
fs.writeFileSync(target, out, 'utf8')
console.log('已生成 ' + target)
console.log('年份：' + rows.length + ' 个（' + rows[0].y + '-' + rows[rows.length - 1].y + '），字节数：' + Buffer.byteLength(out))
console.log('2024 春节：' + new Date((START + byYear.get(2024).spring) * DAY).toISOString().slice(0, 10))
