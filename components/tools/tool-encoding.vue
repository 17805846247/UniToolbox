<template>
	<view class="card">
		<view class="card-title">输入内容</view>
		<tb-textarea class="textarea" v-model="input" placeholder="输入要编码 / 解码的文字，支持中文" ></tb-textarea>
		<view class="label">转换类型</view>
		<view class="row">
			<view class="chip" v-for="m in modes" :key="m.key" :class="{ on: mode === m.key }" @click="mode = m.key">{{ m.name }}</view>
		</view>
		<view class="row" style="margin-top: 18rpx">
			<view class="btn btn-primary" @click="run('encode')">编码</view>
			<view class="btn" @click="run('decode')">解码</view>
			<view class="btn btn-ghost" @click="swap">上下交换</view>
		</view>
		<view class="label">结果</view>
		<tb-textarea class="textarea" v-model="output" placeholder="转换结果会显示在这里" ></tb-textarea>
		<view class="row" style="margin-top: 14rpx">
			<view class="btn btn-sm" @click="copyText(output)">复制结果</view>
			<view class="btn btn-sm btn-ghost" @click="input = ''; output = ''">清空</view>
		</view>
		<view class="hint">{{ tip }}</view>
		<view class="hint" v-if="mode === 'base64'">提示：图片转 Base64 请使用「图片格式转换」工具；本工具处理文字。</view>
	</view>
</template>

<script>
	import { b64encode, b64decode, urlEncode, urlDecode, unicodeEncode, unicodeDecode, htmlEscape, htmlUnescape } from '../../utils/convert.js'
	import { copyText, toast } from '../../utils/ui.js'

	const MAP = {
		base64: { encode: b64encode, decode: b64decode },
		url: { encode: urlEncode, decode: urlDecode },
		unicode: { encode: unicodeEncode, decode: unicodeDecode },
		html: { encode: htmlEscape, decode: htmlUnescape }
	}

	export default {
		data() {
			return {
				input: '', output: '', mode: 'base64',
				modes: [
					{ key: 'base64', name: 'Base64', tip: 'Base64 把任意文字（含中文、Emoji）编码成 A-Z、a-z、0-9、+、/ 组成的字符串，常用于接口传输。' },
					{ key: 'url', name: 'URL 编码', tip: 'URL 编码把中文、空格、& = ? 等字符转成 %XX 形式，避免网址参数被截断。' },
					{ key: 'unicode', name: 'Unicode', tip: '把非 ASCII 字符转成 \\uXXXX 形式，常用于 JS 字符串与配置文件。' },
					{ key: 'html', name: 'HTML 实体', tip: '把 < > & " \' 转成 HTML 实体，避免网页里被当成标签解析。' }
				]
			}
		},
		computed: {
			tip() {
				const m = this.modes.find(x => x.key === this.mode)
				return m ? m.tip : ''
			}
		},
		methods: {
			copyText,
			run(dir) {
				try {
					this.output = MAP[this.mode][dir](this.input)
				} catch (e) { toast(e.message) }
			},
			swap() {
				const t = this.input
				this.input = this.output
				this.output = t
			}
		}
	}
</script>
