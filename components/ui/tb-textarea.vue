<template>
	<!--
		非受控文本域（与 tb-input 同款修复，照搬已验证的 tb-searchbar 思路）：
		打字期间原生 textarea 自行掌管 value，组件只在「外部/父组件主动改值」时
		用 :key 重建。正常打字绝不改 :value、绝不重建、绝不丢焦点，中文输入法安全。
	-->
	<textarea
		:key="key"
		:value="initialValue"
		placeholder-class="tb-ph"
		@input="onInput"
		@blur="onBlur"
		@focus="onFocus"></textarea>
</template>

<script>
	export default {
		name: 'TbTextarea',
		props: {
			modelValue: { type: [String, Number], default: '' },
			value: { type: [String, Number], default: '' }
		},
		emits: ['input', 'update:modelValue', 'update:value', 'change', 'blur', 'focus'],
		data() {
			const v = (this.modelValue !== undefined && this.modelValue !== null) ? this.modelValue : this.value
			const s = v == null ? '' : String(v)
			return { initialValue: s, inner: s, key: 0 }
		},
		watch: {
			modelValue(v) { this.syncExternal(v) },
			value(v) { this.syncExternal(v) }
		},
		methods: {
			norm(v) { return v == null ? '' : String(v) },
			syncExternal(v) {
				const nv = this.norm(v)
				if (nv === this.inner) return
				this.inner = nv
				this.initialValue = nv
				this.key++
			},
			onInput(e) {
				const v = (e && e.detail) ? e.detail.value : ''
				this.inner = v
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
				this.$emit('update:value', v)
			},
			onBlur() { this.$emit('blur', this.inner); this.$emit('change', this.inner) },
			onFocus(e) { this.$emit('focus', e) }
		}
	}
</script>

<style scoped>
	textarea {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		font-size: 28rpx;
		color: var(--text);
		-webkit-text-fill-color: var(--text);
	}
</style>
