<template>
	<view class="card">
		<view class="card-title">金额（数字）</view>
		<tb-input class="input" v-model="amount" type="digit" placeholder="例如 12345.67" />
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm" v-for="s in samples" :key="s" @click="amount = s">{{ s }}</view>
		</view>
		<view class="hint">支持负数、千分位逗号与 ¥ 前缀；自动四舍五入到分，最大支持到千万亿。</view>
	</view>

	<view class="card">
		<view class="card-title">中文大写金额</view>
		<view v-if="error" class="hint" style="color: var(--danger)">{{ error }}</view>
		<view v-else class="big-value" style="font-size: 40rpx; line-height: 1.5">{{ upper }}</view>
		<view class="row" style="margin-top: 14rpx; justify-content: center">
			<view class="btn btn-sm btn-primary" @click="copyText(upper)">复制大写金额</view>
		</view>
		<view class="divider"></view>
		<view class="kv"><text>输入金额</text><text>{{ amount || '—' }}</text></view>
		<view class="kv"><text>小写规范</text><text>¥ {{ normalized }}</text></view>
		<view class="hint">按财务书写习惯生成：角位为零且分位非零时补「零」，整数末尾不加「零」。</view>
	</view>
</template>

<script>
	import { rmbUpper } from '../../utils/format-extra.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				amount: '12345.67', error: '',
				samples: ['0.07', '100.5', '1001', '20000.05', '-88.8']
			}
		},
		computed: {
			upper() {
				try { this.error = ''; return rmbUpper(this.amount) }
				catch (e) { this.error = e.message; return '—' }
			},
			normalized() {
				const n = Number(String(this.amount || '').replace(/[,，\s¥￥]/g, ''))
				return isFinite(n) ? n.toFixed(2) : '—'
			}
		},
		methods: { copyText }
	}
</script>
