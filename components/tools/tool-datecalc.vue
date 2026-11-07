<template>
	<view class="card">
		<view class="card-title">计算方式</view>
		<view class="row">
			<view class="chip" v-for="m in modes" :key="m.key" :class="{ on: mode === m.key }" @click="mode = m.key; result = ''">{{ m.name }}</view>
		</view>

		<view class="label">{{ mode === 'target' ? '目标日期' : '起始日期' }}</view>
		<picker mode="date" :value="dateA" @change="onA">
			<view class="picker">{{ dateA }}</view>
		</picker>

		<view v-if="mode === 'diff'">
			<view class="label">结束日期</view>
			<picker mode="date" :value="dateB" @change="onB">
				<view class="picker">{{ dateB }}</view>
			</picker>
		</view>

		<view v-else-if="mode === 'add'">
			<view class="label">加减天数（负数表示往前推）</view>
			<tb-input class="input" v-model="days" type="number" placeholder="例如 100 或 -7" />
			<view class="row" style="margin-top: 12rpx">
				<view class="chip" v-for="n in [7, 30, 100, 365]" :key="n" @click="days = String(n)">+{{ n }} 天</view>
			</view>
		</view>

		<view class="row" style="margin-top: 22rpx">
			<view class="btn btn-primary grow" @click="run">开始计算</view>
			<view class="btn btn-ghost" @click="today">回到今天</view>
		</view>
		<view class="result big-value" v-if="result">{{ result }}</view>
		<view class="result" v-if="detail">{{ detail }}</view>
		<view class="row" style="margin-top: 12rpx" v-if="result">
			<view class="btn btn-sm" @click="copyText(result)">复制结果</view>
		</view>
	</view>

	<view class="card">
		<view class="card-title">今天</view>
		<view class="kv"><text>日期</text><text>{{ todayStr }}</text></view>
		<view class="kv"><text>星期</text><text>{{ todayWeek }}</text></view>
		<view class="kv"><text>本年已过</text><text>{{ dayOfYear }} 天</text></view>
	</view>
</template>

<script>
	import { daysBetween, dateAdd, formatDate } from '../../utils/convert.js'
	import { copyText, toast } from '../../utils/ui.js'

	const WEEK = ['日', '一', '二', '三', '四', '五', '六']

	export default {
		data() {
			const t = formatDate(new Date(), false)
			return {
				mode: 'diff', modes: [
					{ key: 'diff', name: '两日期天数差' }, { key: 'add', name: '日期加减' }, { key: 'target', name: '倒数日' }
				],
				dateA: t, dateB: t, days: '100', result: '', detail: '', todayStr: t
			}
		},
		computed: {
			todayWeek() { return '星期' + WEEK[new Date().getDay()] },
			dayOfYear() {
				const d = new Date()
				return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
			}
		},
		methods: {
			copyText,
			onA(e) { this.dateA = e.detail.value },
			onB(e) { this.dateB = e.detail.value },
			today() { const t = formatDate(new Date(), false); this.dateA = t; this.dateB = t; this.result = ''; this.detail = '' },
			weekOf(s) {
				const m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
				return m ? '星期' + WEEK[new Date(+m[1], +m[2] - 1, +m[3]).getDay()] : ''
			},
			workdays(a, b) {
				let n = 0
				const start = new Date(a), end = new Date(b)
				if (isNaN(start) || isNaN(end) || end < start) return 0
				for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
					if (d.getDay() !== 0 && d.getDay() !== 6) n++
				}
				return n
			},
			run() {
				try {
					if (this.mode === 'diff') {
						const d = daysBetween(this.dateA, this.dateB)
						this.result = Math.abs(d) + ' 天'
						this.detail = `${this.dateA} ${this.weekOf(this.dateA)} → ${this.dateB} ${this.weekOf(this.dateB)}\n` +
							`方向：${d >= 0 ? '结束日期在之后' : '结束日期在之前'} ${Math.abs(d)} 天\n` +
							`约 ${(Math.abs(d) / 7).toFixed(1)} 周 · 其中工作日约 ${this.workdays(this.dateA, this.dateB)} 天（未扣除法定节假日）`
					} else if (this.mode === 'add') {
						const d = dateAdd(this.dateA, Number(this.days) || 0)
						this.result = d
						this.detail = `${this.dateA} ${Number(this.days) >= 0 ? '加上' : '减去'} ${Math.abs(Number(this.days) || 0)} 天 = ${d} ${this.weekOf(d)}`
					} else {
						const t = formatDate(new Date(), false)
						const d = daysBetween(t, this.dateA)
						this.result = d > 0 ? '还有 ' + d + ' 天' : (d === 0 ? '就是今天' : '已过去 ' + Math.abs(d) + ' 天')
						this.detail = `目标：${this.dateA} ${this.weekOf(this.dateA)}\n今天：${t}\n约 ${(Math.abs(d) / 30).toFixed(1)} 个月`
					}
				} catch (e) { toast(e.message) }
			}
		}
	}
</script>
