<template>
	<view class="tb-field">
		<view v-if="label" class="tb-label">{{ label }}</view>
		<textarea
			v-if="type === 'textarea'"
			class="tb-input tb-textarea"
			:style="'height:' + (rows * 52) + 'rpx'"
			:value="String(modelValue == null ? '' : modelValue)"
			:placeholder="placeholder"
			placeholder-class="tb-ph"
			@input="onInput"
		></textarea>
		<input
			v-else
			class="tb-input"
			:type="type === 'number' ? 'number' : 'text'"
			:value="String(modelValue == null ? '' : modelValue)"
			:placeholder="placeholder"
			placeholder-class="tb-ph"
			@input="onInput"
		/>
		<view v-if="hint" class="tb-hint">{{ hint }}</view>
	</view>
</template>

<script>
	export default {
		name: 'TbField',
		props: {
			modelValue: { type: [String, Number], default: '' },
			label: { type: String, default: '' },
			placeholder: { type: String, default: '请输入' },
			hint: { type: String, default: '' },
			type: { type: String, default: 'text' },   // text | textarea | number
			rows: { type: Number, default: 5 }
		},
		emits: ['update:modelValue'],
		methods: {
			onInput(e) {
				const v = e && e.detail ? e.detail.value : ''
				this.$emit('update:modelValue', v)
			}
		}
	}
</script>

<style scoped>
	.tb-field { width: 100%; }
	.tb-label { font-size: 26rpx; color: var(--text-2); margin: 20rpx 0 10rpx; }
	.tb-input {
		width: 100%; box-sizing: border-box; height: 76rpx;
		background: var(--input-bg); border: 1rpx solid var(--line);
		border-radius: var(--radius-sm); padding: 16rpx 20rpx;
		font-size: 28rpx; color: var(--text);
	}
	.tb-textarea { height: 260rpx; line-height: 1.6; padding: 18rpx 20rpx; }
	.tb-hint { font-size: 23rpx; color: var(--text-3); margin-top: 10rpx; line-height: 1.6; }
</style>
