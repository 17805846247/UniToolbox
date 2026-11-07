<template>
	<view>
		<view class="card">
			<view class="card-title">计算方式</view>
			<view class="row">
				<view class="chip" :class="{ on: mode === 'annual' }" @click="mode = 'annual'">年度汇算</view>
				<view class="chip" :class="{ on: mode === 'monthly' }" @click="mode = 'monthly'">月度累计预扣</view>
			</view>
			<view class="label">{{ mode === 'annual' ? '年度税前收入（元）' : '每月税前收入（元）' }}</view>
			<tb-input class="input" v-model="income" type="digit" :placeholder="mode === 'annual' ? '例如 200000' : '例如 15000'" />
			<view class="label">{{ mode === 'annual' ? '全年三险一金（元）' : '每月三险一金（元）' }}</view>
			<tb-input class="input" v-model="social" type="digit" placeholder="例如 24000 或 2000，可留空" />
			<view class="label">{{ mode === 'annual' ? '全年专项附加扣除（元）' : '每月专项附加扣除（元）' }}</view>
			<tb-input class="input" v-model="special" type="digit" placeholder="子女教育 / 房贷 / 赡养老人等" />
			<view class="row" style="margin-top:18rpx">
				<view class="btn btn-sm" v-for="s in samples" :key="s.v" @click="applySample(s)">{{ s.n }}</view>
			</view>
			<view class="hint">起征点 60000 元/年（5000 元/月）已内置；本工具按 2019 年起综合所得七级税率计算，不含年终奖单独计税与各地补充政策。</view>
		</view>

		<view class="card" v-if="mode === 'annual' && annual">
			<view class="card-title">年度汇算结果</view>
			<view class="big-value">¥ {{ fmt(annual.tax) }}</view>
			<view class="hint" style="text-align:center;margin-top:-8rpx">全年应纳个人所得税</view>
			<view class="divider"></view>
			<view class="kv"><text>税前年收入</text><text>¥ {{ fmt(annual.income) }}</text></view>
			<view class="kv"><text>扣除合计</text><text>¥ {{ fmt(annual.deductions) }}</text></view>
			<view class="kv"><text>应纳税所得额</text><text>¥ {{ fmt(annual.taxable) }}</text></view>
			<view class="kv"><text>适用税率 / 速算扣除</text><text>{{ (annual.rate * 100).toFixed(0) }}% / {{ annual.quick }}</text></view>
			<view class="kv"><text>实际税负率</text><text>{{ annual.effectiveRate }}%</text></view>
			<view class="kv"><text>税后年收入</text><text>¥ {{ fmt(annual.afterTax) }}</text></view>
		</view>

		<view class="card" v-if="mode === 'monthly' && monthly">
			<view class="card-title">每月预扣明细</view>
			<view class="kv"><text>全年预扣合计</text><text>¥ {{ fmt(monthly.totalTax) }}</text></view>
			<view class="kv"><text>每月固定扣除</text><text>¥ {{ fmt(monthly.perMonthDeduct) }}</text></view>
			<view class="month-head"><text>月份</text><text>累计应税</text><text>当月预扣</text><text>到手</text></view>
			<view class="month-row" v-for="r in monthly.rows" :key="r.month">
				<text>{{ r.month }} 月</text><text>{{ fmt(r.cumulativeTaxable) }}</text><text>{{ fmt(r.tax) }}</text><text>{{ fmt(r.takeHome) }}</text>
			</view>
			<view class="hint">累计预扣法：随累计收入上升，部分月份会跳档，属正常现象。</view>
		</view>
		<view class="card" v-if="error"><view class="hint" style="color:var(--danger)">{{ error }}</view></view>
	</view>
</template>

<script>
	import { calcAnnualTax, calcMonthlyWithholding } from '../../utils/life.js'

	export default {
		data() {
			return {
				mode: 'annual', income: '200000', social: '24000', special: '12000', error: '',
				samples: [
					{ n: '月薪 1 万', v: '120000', s: '12000', p: '12000' },
					{ n: '月薪 2 万', v: '240000', s: '24000', p: '24000' },
					{ n: '年薪 50 万', v: '500000', s: '60000', p: '36000' }
				]
			}
		},
		computed: {
			annual() {
				if (this.mode !== 'annual') return null
				try { this.error = ''; return calcAnnualTax(this.income, this.social, this.special) }
				catch (e) { this.error = e.message; return null }
			},
			monthly() {
				if (this.mode !== 'monthly') return null
				try { this.error = ''; return calcMonthlyWithholding(this.income, this.social, this.special, 12) }
				catch (e) { this.error = e.message; return null }
			}
		},
		methods: {
			fmt(n) { return Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 }) },
			applySample(s) {
				this.mode = 'annual'
				this.income = s.v; this.social = s.s; this.special = s.p
			}
		}
	}
</script>

<style scoped>
	.month-head, .month-row {
		display: flex; flex-direction: row; justify-content: space-between;
		font-size: 22rpx; padding: 12rpx 0; border-bottom: 1rpx solid var(--line);
	}
	.month-head { color: var(--text-3); font-weight: 600; margin-top: 18rpx; }
	.month-row text { flex: 1; text-align: right; color: var(--text-2); }
	.month-row text:first-child, .month-head text:first-child { text-align: left; }
</style>
