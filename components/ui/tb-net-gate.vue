<template>
	<view>
		<view v-if="!enabled" class="gate card">
			<view class="gate-icon">网</view>
			<view class="gate-title">联网功能未开启</view>
			<view class="gate-desc">
				本工具需要访问网络。联网默认关闭，只有你主动开启后才会发出请求；关闭后所有请求立即停止。
			</view>
			<view class="row" style="margin-top: var(--sp-4)">
				<tb-btn type="primary" @click="enable">开启联网</tb-btn>
				<tb-btn type="ghost" @click="goSettings">去设置</tb-btn>
			</view>
			<view class="hint">请求均由你主动点击触发，不会上传本地文件、草稿或剪贴板。</view>
		</view>
		<view v-else><slot></slot></view>
	</view>
</template>

<script>
	import TbBtn from './tb-btn.vue'
	import { isNetEnabled, setNetEnabled } from '../../utils/net.js'
	import { ok } from '../../utils/ui.js'

	export default {
		name: 'TbNetGate',
		components: { TbBtn },
		emits: ['change'],
		data() { return { enabled: false } },
		created() {
			this.enabled = isNetEnabled()
			this._netHandler = v => { this.enabled = !!v }
			if (typeof uni !== 'undefined' && uni.$on) uni.$on('tb-net-change', this._netHandler)
		},
		beforeUnmount() {
			if (typeof uni !== 'undefined' && uni.$off) uni.$off('tb-net-change', this._netHandler)
		},
		methods: {
			enable() {
				setNetEnabled(true)
				this.enabled = true
				ok('已开启联网')
				this.$emit('change', true)
			},
			goSettings() {
				uni.switchTab({ url: '/pages/mine/mine' })
			}
		}
	}
</script>

<style scoped>
	.gate { text-align: center; padding: 46rpx 32rpx; }
	.gate-icon {
		width: 96rpx; height: 96rpx; border-radius: 28rpx; margin: 0 auto 24rpx;
		background: var(--primary-soft); color: var(--primary);
		font-size: 40rpx; font-weight: 600;
		display: flex; align-items: center; justify-content: center;
	}
	.gate-title { font-size: 32rpx; font-weight: 600; color: var(--text); }
	.gate-desc { font-size: 25rpx; color: var(--text-2); line-height: 1.8; margin-top: 16rpx; text-align: left; }
	.gate .row { justify-content: center; }
</style>
