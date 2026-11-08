<template>
	<!--
		中文输入法（IME）安全多行文本域 —— 与 tb-input 同一套「完全非受控」范式。
		:value 绑定 initialValue，输入全程绝不回写；inner 影子值过滤 v-model
		自身回传；仅父组件主动改值时才 key++ 重建。详见 tb-input.vue 注释。
		不依赖 composition 事件（uni-app App/H5 默认 ignoreCompositionEvent=true）。
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
			modelValue: { type: [String, Number], default: undefined },
			value: { type: [String, Number], default: undefined }
		},
		emits: ['input', 'update:modelValue', 'update:value', 'change', 'blur', 'focus'],
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
