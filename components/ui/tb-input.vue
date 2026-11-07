<template>
	<!--
		非受控输入（彻底解决中文输入法被打断）：
		照搬已验证可用的 tb-searchbar 思路——
		原生 <input> 在打字期间自行掌管 value；组件只在「外部/父组件主动改值」时
		用 :key 重建输入框，正常打字绝不改 :value、绝不重建、绝不丢焦点。
		之前版本在 onInput 里把绑定值也改了，等于又变回受控回写，
		导致 uni-app 在拼音组合期间重置 DOM → 又打不了中文。这版彻底改回非受控。
	-->
	<input
		:key="key"
		:value="initialValue"
		placeholder-class="tb-ph"
		@input="onInput"
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
		emits: ['input', 'update:modelValue', 'update:value', 'change', 'confirm', 'blur', 'focus'],
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
				// 自己刚 emit 出去的值会原样回来，此时绝不重建，避免打断 IME
				if (nv === this.inner) return
				this.inner = nv
				this.initialValue = nv
				this.key++          // 外部程序化改值才重建输入框（如「重置」按钮）
			},
			onInput(e) {
				const v = (e && e.detail) ? e.detail.value : ''
				this.inner = v
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
				this.$emit('update:value', v)
			},
			onConfirm() { this.$emit('confirm', this.inner) },
			onBlur() { this.$emit('blur', this.inner); this.$emit('change', this.inner) },
			onFocus(e) { this.$emit('focus', e) }
		}
	}
</script>

<style scoped>
	/* 让根 <input> 在任意父容器（含 flex）下都能正确撑开并显示文字。
	   背景 / 边框 / 内边距等由父级传入的 .input 类负责；这里只补“不被压扁 + 文字可见”。 */
	input {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		font-size: 28rpx;
		color: var(--text);
		-webkit-text-fill-color: var(--text);
	}
</style>
