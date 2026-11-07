<template>
	<view class="tb-empty">
		<view class="tb-empty-icon"><view class="tb-empty-line"></view></view>
		<view class="tb-empty-text">{{ text }}</view>
		<view v-if="sub" class="tb-empty-sub">{{ sub }}</view>
		<slot></slot>
	</view>
</template>

<script>
	export default {
		name: 'TbEmpty',
		props: {
			text: { type: String, default: '这里还什么都没有' },
			sub: { type: String, default: '' }
		}
	}
</script>

<style scoped>
	.tb-empty { padding: 70rpx 30rpx; text-align: center; }
	.tb-empty-icon {
		width: 108rpx; height: 108rpx; border-radius: 50%;
		border: 4rpx solid var(--line); margin: 0 auto 24rpx;
		display: flex; align-items: center; justify-content: center;
	}
	.tb-empty-line { width: 44rpx; height: 4rpx; border-radius: 4rpx; background: var(--line); transform: rotate(-35deg); }
	.tb-empty-text { font-size: 27rpx; color: var(--text-2); }
	.tb-empty-sub { font-size: 23rpx; color: var(--text-3); margin-top: 12rpx; line-height: 1.6; }
</style>
