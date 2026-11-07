<template>
	<!--
		中文输入法（IME）安全输入框 —— 组合守卫 + 受控同步（终极修法）：
		1) :value="view" 受控绑定，保证「绑定值」始终最终等于输入框里的真实内容，
		   不会被 uni-app 在重渲染时重置回旧值（这是“打了中文又消失”的根因）。
		2) 拼音组合期间（compositionstart→compositionend）composing=true，
		   此时【绝不】回写 view，把拼音缓冲完全交给系统输入法自己管，避免打断上屏。
		3) 组合结束（compositionend）再把最终中文写回 view 并 emit。
		   英文/数字没有组合态，onInput 里立即同步 view。
		4) 仅父组件主动改值时（如「重置」按钮）用 :key 重建输入框。
	-->
	<input
		:key="key"
		:value="view"
		placeholder-class="tb-ph"
		@input="onInput"
		@compositionstart="composing = true"
		@compositionend="onCompositionEnd"
		@confirm="onConfirm"
		@blur="onBlur"
		@focus="onFocus"
	/>
</template>

<script>
	export default {
		name: 'TbInput',
		props: {
			modelValue: { type: [String, Number], default: '' },
			value: { type: [String, Number], default: '' }
		},
		emits: ['input', 'update:modelValue', 'update:value', 'change', 'confirm', 'blur', 'focus', 'compositionstart', 'compositionend'],
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
				// 组合进行中：先记下目标值，待 compositionend 再落地，避免打断上屏
				if (this.composing) { this.pending = nv; return }
				this.view = nv
				this.key++
			},
			onInput(e) {
				const v = (e && e.detail) ? e.detail.value : ''
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
				this.$emit('update:value', v)
				// 非组合态立即同步；组合态交给 compositionend，绝不中途回写打断输入法
				if (!this.composing) this.view = v
			},
			onCompositionEnd(e) {
				this.composing = false
				const v = (e && e.detail) ? e.detail.value : this.view
				this.view = v
				// 组合期间若有外部改值，以外部为准
				if (this.pending != null && this.pending !== v) { this.view = this.pending; this.key++ }
				this.pending = null
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
				this.$emit('update:value', v)
			},
			onConfirm() { this.$emit('confirm', this.view) },
			onBlur() { this.$emit('blur', this.view); this.$emit('change', this.view) },
			onFocus(e) { this.$emit('focus', e) }
		}
	}
</script>

<style scoped>
	input {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		font-size: 28rpx;
		color: var(--text);
		-webkit-text-fill-color: var(--text);
	}
</style>
