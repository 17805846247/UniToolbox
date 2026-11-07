<template>
	<view class="tb-section">
		<view class="tb-section-head">
			<view class="tb-bar"></view>
			<view class="tb-section-title">{{ title }}</view>
			<view v-if="action" class="tb-section-action" @click="onAction">{{ action }}</view>
		</view>
		<view v-if="desc" class="tb-section-desc">{{ desc }}</view>
		<slot></slot>
	</view>
</template>

<script>
	export default {
		name: 'TbSection',
		props: {
			title: { type: String, default: '' },
			desc: { type: String, default: '' },
			action: { type: String, default: '' }
		},
		emits: ['action'],
		methods: {
			onAction() { this.$emit('action') }
		}
	}
</script>

<style scoped>
	/* 与全局 .section-title 对齐同一套间距节奏，首页 / 我的 / 关于 / 工具目录共用 */
	.tb-section { margin: var(--sp-5) var(--sp-1) var(--sp-3); }
	.tb-section-head { display: flex; flex-direction: row; align-items: center; }
	.tb-bar { width: 6rpx; height: 28rpx; border-radius: 6rpx; background: var(--primary); margin-right: 12rpx; }
	.tb-section-title { flex: 1; font-size: 28rpx; font-weight: 600; color: var(--text); }
	.tb-section-action { font-size: 24rpx; color: var(--primary); }
	.tb-section-desc { font-size: 22rpx; color: var(--text-3); margin: 8rpx 0 0 18rpx; line-height: 1.6; }
</style>
