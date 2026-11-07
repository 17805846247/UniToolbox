<template>
	<view class="tb-result">
		<view class="tb-result-head">
			<view class="tb-result-label">{{ label }}</view>
			<view v-if="copyable" class="tb-result-copy" @click="doCopy">复制</view>
		</view>
		<view class="tb-result-value">{{ display }}</view>
	</view>
</template>

<script>
	import { copyText } from '../../utils/ui.js'

	export default {
		name: 'TbResult',
		props: {
			label: { type: String, default: '结果' },
			value: { type: [String, Number], default: '' },
			copyable: { type: Boolean, default: true },
			empty: { type: String, default: '—' }
		},
		computed: {
			display() { return this.value === '' || this.value == null ? this.empty : String(this.value) }
		},
		methods: {
			doCopy() { copyText(this.display) }
		}
	}
</script>

<style scoped>
	.tb-result {
		background: var(--input-bg); border: 1rpx solid var(--line);
		border-radius: var(--radius-sm); padding: 20rpx; margin-top: 16rpx;
	}
	.tb-result-head { display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
	.tb-result-label { font-size: 24rpx; color: var(--text-3); }
	.tb-result-copy { font-size: 24rpx; color: var(--primary); padding: 2rpx 12rpx; }
	.tb-result-value {
		font-size: 26rpx; color: var(--text); line-height: 1.7;
		margin-top: 12rpx; word-break: break-all; white-space: pre-wrap;
	}
</style>
