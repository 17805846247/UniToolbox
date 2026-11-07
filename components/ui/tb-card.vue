<template>
	<view class="tb-card" :class="{ 'is-flat': flat }">
		<view v-if="title" class="tb-card-head">
			<view class="tb-card-title">{{ title }}</view>
			<view v-if="subtitle" class="tb-card-sub">{{ subtitle }}</view>
		</view>
		<slot></slot>
	</view>
</template>

<script>
	export default {
		name: 'TbCard',
		props: {
			title: { type: String, default: '' },
			subtitle: { type: String, default: '' },
			flat: { type: Boolean, default: false }
		}
	}
</script>

<style scoped>
	/* 基础卡片样式由 App.vue 全局 .tb-card 统一提供，这里只保留修饰符与标题，
	   避免 1.x 里 .card / .tb-card 两套 padding、圆角、阴影各写一遍 */
	.tb-card.is-flat { box-shadow: none; border: 1rpx solid var(--line); }
	.tb-card-head { margin-bottom: var(--sp-3); }
	.tb-card-title { font-size: 29rpx; font-weight: 600; color: var(--text); }
	.tb-card-sub { font-size: 23rpx; color: var(--text-3); margin-top: 8rpx; line-height: 1.6; }
</style>
