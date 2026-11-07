<template>
	<tb-net-gate>
		<view class="card">
			<view class="card-title">实时汇率</view>
			<view class="row">
				<view class="chip" :class="{ on: !reverse }" @click="reverse = false">人民币 → 外币</view>
				<view class="chip" :class="{ on: reverse }" @click="reverse = true">外币 → 人民币</view>
			</view>
			<view class="label">金额</view>
			<tb-input class="input" v-model="amount" type="digit" placeholder="100" />
			<view class="label">币种</view>
			<picker mode="selector" :range="currencies" :value="curIdx" @change="onCur">
				<view class="picker">{{ currencies[curIdx] }}</view>
			</picker>
			<view class="row" style="margin-top: 20rpx">
				<view class="btn btn-primary" @click="load(true)">{{ loading ? '获取中…' : '获取最新汇率' }}</view>
			</view>
			<view class="hint">数据源为免 Key 公开接口，多个源自动容错；汇率仅供参考，实际以银行牌价为准。</view>
		</view>

		<view class="card" v-if="rate">
			<view class="card-title">换算结果</view>
			<view class="big-value" style="font-size: 44rpx">{{ resultText }}</view>
			<view class="kv"><text>数据源</text><text>{{ rate.source }}</text></view>
			<view class="kv"><text>基准货币</text><text>CNY 人民币</text></view>
			<view class="kv"><text>1 CNY =</text><text>{{ unitRate }} {{ cur }}</text></view>
			<view class="kv"><text>更新时间</text><text>{{ rate.data.updated || '见数据源' }}</text></view>
			<view class="btn btn-sm" style="margin-top: 14rpx" @click="copyText(resultText)">复制结果</view>
		</view>

		<view class="card" v-if="rate">
			<view class="card-title">常用币种速览（1 CNY）</view>
			<view class="kv" v-for="c in common" :key="c">
				<text>{{ c }}</text><text>{{ rate.data.rates[c] != null ? Number(rate.data.rates[c]).toFixed(4) : '—' }}</text>
			</view>
		</view>

		<view class="card" v-if="error">
			<view class="card-title">获取失败</view>
			<view class="hint" style="color: var(--danger)">{{ error }}</view>
		</view>
	</tb-net-gate>
</template>

<script>
	import TbNetGate from '../ui/tb-net-gate.vue'
	import { fetchSource } from '../../utils/net.js'
	import { copyText, toast } from '../../utils/ui.js'

	const DEFAULT = ['USD', 'EUR', 'JPY', 'HKD', 'GBP', 'KRW', 'AUD', 'SGD']

	export default {
		components: { TbNetGate },
		data() {
			return {
				reverse: false, amount: '100', currencies: DEFAULT.slice(), curIdx: 0,
				common: DEFAULT, rate: null, error: '', loading: false
			}
		},
		computed: {
			cur() { return this.currencies[this.curIdx] || 'USD' },
			unitRate() { return this.rate && this.rate.data.rates[this.cur] != null ? Number(this.rate.data.rates[this.cur]).toFixed(4) : '—' },
			resultText() {
				if (!this.rate) return '—'
				const r = Number(this.rate.data.rates[this.cur])
				const a = Number(this.amount)
				if (!isFinite(r) || !isFinite(a)) return '—'
				const v = this.reverse ? a / r : a * r
				return this.reverse
					? a.toFixed(2) + ' ' + this.cur + ' ≈ ¥ ' + v.toFixed(2)
					: '¥ ' + a.toFixed(2) + ' ≈ ' + v.toFixed(2) + ' ' + this.cur
			}
		},
		methods: {
			copyText,
			onCur(e) { this.curIdx = Number(e.detail.value) || 0 },
			async load(force) {
				if (this.loading) return
				if (this.rate && !force) return
				this.loading = true; this.error = ''
				try {
					const r = await fetchSource('rate')
					const extra = Object.keys(r.data.rates || {}).map(k => k.toUpperCase())
						.filter(k => /^[A-Z]{3}$/.test(k) && DEFAULT.indexOf(k) < 0).slice(0, 40)
					this.currencies = DEFAULT.concat(extra)
					this.rate = r
				} catch (e) { this.error = e.message; toast('汇率获取失败') }
				finally { this.loading = false }
			}
		}
	}
</script>
