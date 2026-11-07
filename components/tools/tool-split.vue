<template>
	<view>
		<view class="card">
			<view class="card-title">账单信息</view>
			<view class="label">消费总额（元）</view>
			<tb-input class="input" v-model="total" type="digit" placeholder="例如 268.50" />
			<view class="label">用餐人数</view>
			<tb-input class="input" v-model="people" type="number" placeholder="例如 3" />
			<view class="label">小费 / 服务费（%）</view>
			<tb-input class="input" v-model="tip" type="digit" placeholder="0 表示不加小费" />
			<view class="label">分摊方式</view>
			<view class="row">
				<view class="chip" :class="{ on: round === 'cent' }" @click="round = 'cent'">精确到分</view>
				<view class="chip" :class="{ on: round === 'yuan' }" @click="round = 'yuan'">每人取整到元</view>
			</view>
			<view class="hint">精确到分时，除不尽的 1 分钱依次补给前几位，保证总和对得上；取整到元会多收一点，可当场找零。</view>
		</view>

		<view v-if="state.error" class="card">
			<view class="hint" style="color:var(--danger)">{{ state.error }}</view>
		</view>

		<view v-else-if="state.r" class="card">
			<view class="card-title">每人应付</view>
			<view class="big-value">¥{{ state.r.each }}</view>
			<view class="hint" style="text-align:center;margin-top:-6rpx">{{ state.r.people }} 人 · {{ state.r.round === 'yuan' ? '取整到元' : '精确到分' }}</view>

			<view class="kv"><text>账单金额</text><text>¥{{ state.r.total }}</text></view>
			<view class="kv"><text>小费（{{ state.r.tipPercent }}%）</text><text>¥{{ state.r.tip }}</text></view>
			<view class="kv"><text>合计</text><text>¥{{ state.r.grand }}</text></view>
			<view v-if="state.r.round === 'yuan'" class="kv"><text>多收（可找零）</text><text>¥{{ state.r.overpay }}</text></view>
			<view v-else class="kv"><text>除不尽的分</text><text>{{ state.r.remainderCents }} 分</text></view>

			<view class="row" style="margin-top:20rpx">
				<view class="btn btn-sm btn-primary" @click="copyText(summary)">复制分账结果</view>
			</view>
		</view>

		<view v-if="state.r" class="card">
			<view class="card-title">每人明细</view>
			<view class="kv" v-for="s in shownShares" :key="s.index">
				<text>第 {{ s.index }} 位</text><text>¥{{ s.amount }}</text>
			</view>
			<view v-if="state.r.shares.length > shownShares.length" class="hint">
				还有 {{ state.r.shares.length - shownShares.length }} 位未列出，金额同上。
			</view>
		</view>

		<view class="card">
			<view class="card-title">常见场景</view>
			<view class="kv"><text>聚餐 AA</text><text>输入总额与人数即可</text></view>
			<view class="kv"><text>境外餐厅</text><text>按当地习惯填小费比例</text></view>
			<view class="kv"><text>团建 / 拼单</text><text>取整到元方便收现金</text></view>
		</view>
	</view>
</template>

<script>
	import { splitBill } from '../../utils/gadget.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() { return { total: '268.50', people: '3', tip: '0', round: 'cent' } },
		computed: {
			state() {
				try {
					const r = splitBill({
						total: this.total, people: this.people,
						tipPercent: this.tip, round: this.round
					})
					return { r, error: '' }
				} catch (e) { return { r: null, error: e.message } }
			},
			shownShares() { return this.state.r ? this.state.r.shares.slice(0, 20) : [] },
			summary() {
				const r = this.state.r
				if (!r) return ''
				return ['账单 ¥' + r.total, '小费 ¥' + r.tip + '（' + r.tipPercent + '%）', '合计 ¥' + r.grand,
					r.people + ' 人 AA，每人 ¥' + r.each].join('\n')
			}
		},
		methods: { copyText }
	}
</script>

<style scoped>
</style>
