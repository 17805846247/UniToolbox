<template>
	<view
		class="tb-btn"
		:class="['tb-' + type, 'tb-' + size, { 'is-block': block, 'is-disabled': disabled }]"
		@click="onClick"
	><slot></slot></view>
</template>

<script>
	export default {
		name: 'TbBtn',
		props: {
			type: { type: String, default: 'plain' },   // plain | primary | ghost | danger
			size: { type: String, default: 'md' },      // sm | md | lg
			block: { type: Boolean, default: false },
			disabled: { type: Boolean, default: false }
		},
		emits: ['click'],
		methods: {
			onClick() { if (!this.disabled) this.$emit('click') }
		}
	}
</script>

<style scoped>
	/* 与全局 .btn 保持同一套尺寸与令牌，避免出现两种按钮观感 */
	.tb-btn {
		display: inline-flex; align-items: center; justify-content: center;
		min-width: 0; height: 72rpx; padding: 0 24rpx;
		border-radius: var(--radius-sm); background: var(--primary-soft);
		color: var(--primary); font-size: 26rpx; box-sizing: border-box;
		line-height: 1.2; transition: transform .12s ease, opacity .12s ease;
	}
	.tb-btn:active { opacity: .75; transform: scale(.97); }
	.tb-primary { background: var(--primary); color: #ffffff; }
	.tb-ghost { background: var(--chip-bg); color: var(--text-2); }
	.tb-danger { background: var(--danger); color: #ffffff; }
	.tb-sm { height: 60rpx; padding: 0 20rpx; font-size: 24rpx; border-radius: 12rpx; }
	.tb-lg { height: 88rpx; font-size: 30rpx; }
	.tb-btn.is-block { display: flex; width: 100%; }
	.tb-btn.is-disabled { opacity: .45; }
</style>
