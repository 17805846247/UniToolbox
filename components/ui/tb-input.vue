<template>
	<!--
		中文输入法（IME）安全单行输入框 —— 完全非受控（与 tb-searchbar 同一范式）。

		根因（此前 3 次修复失败的原因）：
		  uni-app <input> 的 value 语义是「输入框的初始内容」，且 App/H5 端
		  ignoreCompositionEvent 默认为 true —— 合成期间既不派发 input，
		  也不派发 compositionstart / compositionend。所以：
		    · 用 composition 事件做「组合守卫」是死代码，composing 恒为 false；
		    · 一旦在 @input 里把值写回 :value（受控回写），Vue 重渲染会重设
		      原生输入框内容，直接打断拼音组合 → 中文打不上 / 上屏即回滚。

		正确做法（tb-searchbar 已在真机验证）：
		  1) :value 绑定 initialValue，输入全程绝不改动；
		  2) @input 只记录影子值 inner 并向外 emit，不回写、不重建；
		  3) inner 用来识别「v-model 把自己 emit 出去的值原样回传」并忽略，
		     否则每次输入都会触发 watch → key++ 重建输入框 → 同样打断 IME；
		  4) 仅父组件主动改值（重置 / 随机 / 载入）时才更新 initialValue 并
		     用 :key 重建输入框。
		  5) 全程不依赖 composition 事件，因此对平台默认值不敏感。
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
			modelValue: { type: [String, Number], default: undefined },
			value: { type: [String, Number], default: undefined }
		},
		emits: ['input', 'update:modelValue', 'update:value', 'change', 'confirm', 'blur', 'focus'],
		data() {
			const raw = (this.modelValue !== undefined && this.modelValue !== null) ? this.modelValue : this.value
			const s = raw == null ? '' : String(raw)
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
				// 自己刚 emit 出去的值原样回来：绝不回写、绝不重建，避免打断 IME
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
			onConfirm() { this.$emit('confirm', this.inner) },
			onBlur() { this.$emit('blur', this.inner); this.$emit('change', this.inner) },
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
