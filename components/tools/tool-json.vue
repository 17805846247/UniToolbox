<template>
	<view class="card">
		<view class="card-title">JSON 文本</view>
		<tb-textarea class="textarea tall" v-model="input" placeholder='粘贴 JSON，例如 {"name":"口袋工具箱","tools":18}' ></tb-textarea>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-primary btn-sm" @click="fmt(2)">格式化 2</view>
			<view class="btn btn-sm" @click="fmt(4)">格式化 4</view>
			<view class="btn btn-sm" @click="minify">压缩</view>
			<view class="btn btn-sm btn-ghost" @click="validate">校验</view>
		</view>
		<view class="row" style="margin-top: 4rpx">
			<view class="btn btn-sm" @click="escape">转义为字符串</view>
			<view class="btn btn-sm" @click="unescape">去除转义</view>
			<view class="btn btn-sm btn-ghost" @click="sample">填入示例</view>
		</view>
		<view class="label">处理结果</view>
		<tb-textarea class="textarea tall" v-model="output" placeholder="处理结果" ></tb-textarea>
		<view class="row" style="margin-top: 14rpx">
			<view class="btn btn-sm" @click="copyText(output)">复制结果</view>
			<view class="btn btn-sm btn-ghost" @click="input = ''; output = ''; info = ''; error = ''">清空</view>
		</view>
		<view class="result" v-if="info">{{ info }}</view>
		<view v-if="error" style="color:var(--danger);font-size:25rpx;margin-top:14rpx">{{ error }}</view>
		<view class="hint">格式化 / 压缩前会先做语法校验，错误的 JSON 会给出原因。</view>
	</view>
</template>

<script>
	import { jsonFormat, jsonMinify, jsonEscape, jsonUnescape } from '../../utils/convert.js'
	import { copyText, toast, ok } from '../../utils/ui.js'

	export default {
		data() {
			return { input: '', output: '', info: '', error: '' }
		},
		methods: {
			copyText,
			run(fn, msg, describe) {
				try {
					this.output = fn()
					this.error = ''
					this.info = ''
					if (describe) {
						try {
							const v = JSON.parse(this.input || '{}')
							this.info = '类型：' + (Array.isArray(v) ? '数组' : typeof v) + ' · ' +
								(Array.isArray(v) ? '元素 ' + v.length + ' 个' : '顶层字段 ' + Object.keys(v || {}).length + ' 个')
						} catch (e) { this.info = '' }
					}
					if (msg) toast(msg)
				} catch (e) {
					this.error = '处理失败：' + e.message
					toast(this.error)
				}
			},
			fmt(n) { this.run(() => jsonFormat(this.input, n), '已格式化', true) },
			minify() { this.run(() => jsonMinify(this.input), '已压缩', true) },
			escape() { this.run(() => jsonEscape(this.input), '已转义', false) },
			unescape() { this.run(() => jsonUnescape(this.input), '已去转义', false) },
			validate() {
				try {
					const v = JSON.parse(this.input)
					const n = Array.isArray(v) ? v.length : Object.keys(v || {}).length
					ok('JSON 合法，' + n + ' 项')
					this.info = '校验通过：' + JSON.stringify(v).length + ' 字符'
					this.error = ''
				} catch (e) { this.error = 'JSON 不合法：' + e.message; toast(this.error) }
			},
			sample() {
				this.input = JSON.stringify({ name: '口袋工具箱', version: '1.0.0', tools: ['格式转换', '文件编辑', '实用工具'], offline: true, count: 18 }, null, 2)
				this.output = ''
				this.info = ''
				this.error = ''
			}
		}
	}
</script>
