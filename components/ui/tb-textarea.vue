<template>
	<!--
		非受控文本域（与 tb-input 同款修复）：绑定值 view 始终跟随 DOM 内容，
		重渲染时 uni-app 不会把已输入的中文重置掉。auto-height / show-confirm-bar
		等原生属性透传到根 textarea 元素。原生 textarea 必须成对闭合。
	-->
	<textarea
		:key="key"
		:value="view"
		placeholder-class="tb-ph"
		@input="onInput"
		@blur="onBlur"
		@focus="onFocus"
		@compositionstart="composing = true"
		@compositionend="onCompositionEnd"></textarea>
</template>

<script>
	export default {
		name: 'TbTextarea',
		props: {
			modelValue: { type: [String, Number], default: '' },
			value: { type: [String, Number], default: '' }
		},
		emits: ['input', 'update:modelValue', 'update:value', 'change', 'blur', 'focus', 'compositionstart', 'compositionend'],
		data() {
			const v = (this.modelValue !== undefined && this.modelValue !== null) ? this.modelValue : this.value
			return { view: v == null ? '' : String(v), composing: false, pending: null, key: 0 }
		},
		watch: {
			modelValue(v) { this.syncExternal(v) },
			value(v) { this.syncExternal(v) }
		},
		methods: {
			norm(v) { return v == null ? '' : String(v) },
			syncExternal(v) {
				const nv = this.norm(v)
				if (nv === this.view) return
				this.pending = nv
				if (!this.composing) {
					this.view = nv
					this.key++
				}
			},
			onInput(e) {
				const v = e.detail.value
				this.view = v
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
				this.$emit('update:value', v)
			},
			onCompositionEnd(e) {
				this.composing = false
				const v = (e && e.detail) ? e.detail.value : this.view
				this.view = v
				if (this.pending != null && this.pending !== v) {
					this.view = this.pending
					this.key++
				}
				this.pending = null
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
				this.$emit('update:value', v)
			},
			onBlur() { this.$emit('blur', this.view); this.$emit('change', this.view) },
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
