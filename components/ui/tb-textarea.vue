<template>
	<!--
		中文输入法安全文本域 —— 与 tb-input 同款组合守卫 + 受控同步：
		拼音组合期间不回写 view（交给系统输入法），组合结束再落地；
		英文/数字立即同步，保证重渲染不会把已输入内容重置回旧值。
	-->
	<textarea
		:key="key"
		:value="view"
		placeholder-class="tb-ph"
		@input="onInput"
		@compositionstart="composing = true"
		@compositionend="onCompositionEnd"
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
		emits: ['input', 'update:modelValue', 'update:value', 'change', 'blur', 'focus', 'compositionstart', 'compositionend'],
		data() {
			const v = (this.modelValue !== undefined && this.modelValue !== null) ? this.modelValue : this.value
			const s = v == null ? '' : String(v)
			return { view: s, composing: false, pending: null, key: 0 }
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
				if (this.composing) { this.pending = nv; return }
				this.view = nv
				this.key++
			},
			onInput(e) {
				const v = (e && e.detail) ? e.detail.value : ''
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
				this.$emit('update:value', v)
				if (!this.composing) this.view = v
			},
			onCompositionEnd(e) {
				this.composing = false
				const v = (e && e.detail) ? e.detail.value : this.view
				this.view = v
				if (this.pending != null && this.pending !== v) { this.view = this.pending; this.key++ }
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
