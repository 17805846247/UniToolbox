<template>
	<!--
		非受控输入（彻底解决中文输入法被打断）：
		1) 关键点：绑定值 view 始终等于输入框里「正在显示」的内容。
		   每次 @input 都把 view 同步成用户输入，这样 uni-app 的 <input> 在重渲染时
		   看到「绑定值 === DOM 值」，绝不会把已输入的中文重置掉（这是之前打不了中文的根因）。
		2) 只有外部（父组件）主动改值时才用 :key 重建，正常打字不会触发重建 / 丢焦点。
		3) 兼容 type / password / placeholder / maxlength / disabled 等透传属性。
	-->
	<input
		:key="key"
		:value="view"
		placeholder-class="tb-ph"
		@input="onInput"
		@confirm="onConfirm"
		@blur="onBlur"
		@focus="onFocus"
		@compositionstart="composing = true"
		@compositionend="onCompositionEnd"
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
				// 组合（拼音）进行中：先记下目标值，待 compositionend 再落地，避免打断上屏
				this.pending = nv
				if (!this.composing) {
					this.view = nv
					this.key++           // 外部程序化改值才重建输入框
				}
			},
			onInput(e) {
				const v = e.detail.value
				this.view = v          // ★ 让绑定值紧跟 DOM，IME 安全
				this.$emit('update:modelValue', v)
				this.$emit('input', v)
				this.$emit('update:value', v)
			},
			onCompositionEnd(e) {
				this.composing = false
				const v = (e && e.detail) ? e.detail.value : this.view
				this.view = v
				// 组合期间若有外部改值（极少），以外部为准重建
				if (this.pending != null && this.pending !== v) {
					this.view = this.pending
					this.key++
				}
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
