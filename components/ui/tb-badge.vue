<template>
	<view
		class="tb-badge"
		:class="['is-' + size, { 'is-long': isLong }]"
		:style="badgeStyle(tool)"
	>{{ tool.badge }}</view>
</template>

<script>
	import { badgeStyle } from '../../utils/visual.js'

	/**
	 * 界面 2.0 统一徽标。
	 * 首页 / 工具目录 / 搜索结果 / 工具详情共用同一形状、同一套分类语义色，
	 * 不再各页自定义宽高圆角与随机高饱和背景色。
	 */
	export default {
		name: 'TbBadge',
		props: {
			tool: { type: Object, required: true },
			size: { type: String, default: 'md' }   // sm | md | lg
		},
		computed: {
			isLong() { return String((this.tool && this.tool.badge) || '').length > 2 }
		},
		methods: { badgeStyle }
	}
</script>

<style scoped>
	.tb-badge {
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; box-sizing: border-box;
		border-radius: var(--radius-badge);
		font-weight: 600; line-height: 1;
		letter-spacing: 0;
	}
	.tb-badge.is-sm { width: 52rpx; height: 52rpx; font-size: 22rpx; }
	.tb-badge.is-md { width: 68rpx; height: 68rpx; font-size: 27rpx; }
	.tb-badge.is-lg { width: 88rpx; height: 88rpx; font-size: 30rpx; }
	.tb-badge.is-long { font-size: 20rpx; letter-spacing: -1rpx; }
	.tb-badge.is-lg.is-long { font-size: 24rpx; }
</style>
