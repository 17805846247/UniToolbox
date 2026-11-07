<template>
	<view>
		<view class="card">
			<view class="card-title">贷款信息</view>
			<view class="label">贷款金额（万元）</view>
			<tb-input class="input" v-model="principal" type="digit" placeholder="例如 100" />
			<view class="row">
				<view class="btn btn-sm" v-for="s in samples" :key="s" @click="principal = s">{{ s }} 万</view>
			</view>
			<view class="label">年利率（%）</view>
			<tb-input class="input" v-model="rate" type="digit" placeholder="例如 4.2" />
			<view class="label">贷款年限</view>
			<view class="row">
				<view class="chip" v-for="y in years" :key="y" :class="{ on: year === y }" @click="year = y">{{ y }} 年</view>
			</view>
			<view class="label">还款方式</view>
			<view class="row">
				<view class="chip" :class="{ on: type === 'equal' }" @click="type = 'equal'">等额本息</view>
				<view class="chip" :class="{ on: type === 'principal' }" @click="type = 'principal'">等额本金</view>
			</view>
		</view>

		<view class="card" v-if="result">
			<view class="card-title">计算结果</view>
			<view class="big-value">¥ {{ fmt(result.first) }}</view>
			<view class="hint" style="text-align:center;margin-top:-8rpx">
				{{ type === 'equal' ? '每月月供（固定）' : '首月月供，每月递减 ¥ ' + fmt(result.monthlyDecrease) }}
			</view>
			<view class="divider"></view>
			<view class="kv"><text>贷款本金</text><text>¥ {{ fmt(result.principal) }}</text></view>
			<view class="kv"><text>还款月数</text><text>{{ result.months }} 期</text></view>
			<view class="kv"><text>首月 / 末月月供</text><text>{{ fmt(result.first) }} / {{ fmt(result.last) }}</text></view>
			<view class="kv"><text>支付利息总额</text><text>¥ {{ fmt(result.totalInterest) }}</text></view>
			<view class="kv"><text>本息合计</text><text>¥ {{ fmt(result.totalPayment) }}</text></view>
			<view class="hint">按现行商业贷款通用公式计算，仅供估算；实际以银行还款计划为准。</view>
		</view>
		<view class="card" v-if="error"><view class="hint" style="color:var(--danger)">{{ error }}</view></view>

		<view class="card" v-if="result">
			<view class="card-title">还款计划（{{ showAll ? '全部' : '前 12 期' }}）</view>
			<view class="plan-head">
				<text>期数</text><text>月供</text><text>本金</text><text>利息</text><text>剩余本金</text>
			</view>
			<view class="plan-row" v-for="r in planRows" :key="r.i">
				<text>{{ r.i }}</text><text>{{ fmt(r.payment) }}</text><text>{{ fmt(r.principal) }}</text>
				<text>{{ fmt(r.interest) }}</text><text>{{ fmt(r.balance) }}</text>
			</view>
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm" @click="showAll = !showAll">{{ showAll ? '收起' : '展开全部 ' + result.months + ' 期' }}</view>
				<view class="btn btn-sm" @click="copyPlan">复制计划</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { calcLoan } from '../../utils/life.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				principal: '100', rate: '4.2', year: 30, type: 'equal', showAll: false,
				samples: ['30', '50', '100', '200'], years: [5, 10, 15, 20, 25, 30], error: ''
			}
		},
		computed: {
			result() {
				try {
					this.error = ''
					return calcLoan(Number(this.principal) * 10000, this.rate, this.year * 12, this.type)
				} catch (e) { this.error = e.message; return null }
			},
			planRows() { return this.result ? (this.showAll ? this.result.schedule : this.result.schedule.slice(0, 12)) : [] }
		},
		methods: {
			copyText,
			fmt(n) { return Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
			copyPlan() {
				if (!this.result) return
				const lines = ['期数\t月供\t本金\t利息\t剩余本金']
				for (const r of this.result.schedule) lines.push([r.i, r.payment, r.principal, r.interest, r.balance].join('\t'))
				copyText(lines.join('\n'))
			}
		}
	}
</script>

<style scoped>
	.plan-head, .plan-row {
		display: flex; flex-direction: row; justify-content: space-between;
		font-size: 21rpx; padding: 12rpx 0; border-bottom: 1rpx solid var(--line);
	}
	.plan-head { color: var(--text-3); font-weight: 600; }
	.plan-row text { flex: 1; text-align: right; color: var(--text-2); }
	.plan-row text:first-child, .plan-head text:first-child { text-align: left; }
	.plan-row:last-child { border-bottom: none; }
</style>
