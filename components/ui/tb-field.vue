<template>
	<view class="tb-field">
		<view v-if="label" class="tb-label">{{ label }}</view>
		<!--
			与 tb-input / tb-searchbar 一致：完全非受控。
			:value 绑定 initialValue，输入过程绝不回写；inner 影子值过滤
			v-model 自身回传，避免 key++ 重建打断中文输入法组合。
		-->
		<textarea
			v-if="type === 'textarea'"
			:key="key"
			class="tb-input tb-textarea"
			:style="'height:' + (rows * 52) + 'rpx'"
			:value="initialValue"
			:placeholder="placeholder"
			placeholder-class="tb-ph"
			@input="onInput"
		></textarea>
		<input
			v-else
			:key="key"
			class="tb-input"
			:type="type === 'number' ? 'number' : 'text'"
			:value="initialValue"
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
			modelValue: { type: [String, Number], default: undefined },
			label: { type: String, default: '' },
			placeholder: { type: String, default: '请输入' },
			hint: { type: String, default: '' },
			type: { type: String, default: 'text' },   // text | textarea | number
			rows: { type: Number, default: 5 }
		},
		emits: ['input', 'update:modelValue'],
		data() {
			const s = this.modelValue == null ? '' : String(this.modelValue)
			return { initialValue: s, inner: s, key: 0 }
		},
		watch: {
			modelValue(v) {
				const nv = v == null ? '' : String(v)
				if (nv === this.inner) return
				this.inner = nv
				this.initialValue = nv
				this.key++
			}
		},
		methods: {
			onInput(e) {
				const v = e && e.detail ? e.detail.value : ''
				this.inner = v
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
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
