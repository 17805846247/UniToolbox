<template>
	<view class="card">
		<view class="card-title">源数据</view>
		<tb-textarea class="textarea tall" v-model="input" placeholder="粘贴 JSON / CSV / YAML 数据" ></tb-textarea>
		<view class="label">源格式</view>
		<view class="row">
			<view class="chip" v-for="f in formats" :key="f.key" :class="{ on: src === f.key }" @click="src = f.key">{{ f.name }}</view>
		</view>
		<view class="label">目标格式</view>
		<view class="row">
			<view class="chip" v-for="f in formats" :key="'d' + f.key" :class="{ on: dst === f.key }" @click="dst = f.key">{{ f.name }}</view>
		</view>
		<view class="row" style="margin-top: 12rpx">
			<view class="chip" :class="{ on: hasHeader }" @click="hasHeader = !hasHeader">CSV 首行是表头</view>
		</view>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-primary" @click="convert">开始转换</view>
			<view class="btn btn-ghost" @click="swapFormats">交换格式</view>
			<view class="btn btn-ghost" @click="sample">示例数据</view>
		</view>
		<view class="label">转换结果</view>
		<tb-textarea class="textarea tall" v-model="output" placeholder="转换结果" ></tb-textarea>
		<view class="row" style="margin-top: 14rpx">
			<view class="btn btn-sm" @click="copyText(output)">复制结果</view>
			<view class="btn btn-sm btn-ghost" @click="useAsInput">结果作为新输入</view>
		</view>
		<view class="result" v-if="info">{{ info }}</view>
		<view v-if="error" style="color:var(--danger);font-size:25rpx;margin-top:14rpx">{{ error }}</view>
		<view class="hint">CSV 支持带引号的逗号与换行；YAML 支持常见对象 / 数组 / 缩进结构，复杂 YAML 特性（锚点等）不支持。</view>
	</view>
</template>

<script>
	import { csvToJson, jsonToCsv, jsonToYaml, yamlToJson } from '../../utils/convert.js'
	import { copyText, toast } from '../../utils/ui.js'

	export default {
		data() {
			return {
				input: '', output: '', src: 'json', dst: 'csv', hasHeader: true,
				info: '', error: '',
				formats: [{ key: 'json', name: 'JSON' }, { key: 'csv', name: 'CSV' }, { key: 'yaml', name: 'YAML' }]
			}
		},
		methods: {
			copyText,
			convert() {
				try {
					let obj
					if (this.src === 'json') obj = JSON.parse(this.input)
					else if (this.src === 'csv') obj = csvToJson(this.input, this.hasHeader)
					else obj = yamlToJson(this.input)
					if (this.dst === 'json') this.output = JSON.stringify(obj, null, 2)
					else if (this.dst === 'csv') this.output = jsonToCsv(Array.isArray(obj) ? obj : [obj])
					else this.output = jsonToYaml(obj)
					const n = Array.isArray(obj) ? obj.length : Object.keys(obj || {}).length
					this.info = '转换完成：' + (Array.isArray(obj) ? '共 ' + n + ' 行记录' : '共 ' + n + ' 个字段') + ' · ' + this.output.length + ' 字符'
					this.error = ''
				} catch (e) {
					this.error = '转换失败：' + e.message
					toast(this.error)
				}
			},
			swapFormats() {
				const t = this.src
				this.src = this.dst
				this.dst = t
				this.useAsInput()
			},
			useAsInput() {
				if (!this.output) return
				this.input = this.output
				this.info = '已把结果放回输入区'
			},
			sample() {
				this.src = 'json'
				this.dst = 'csv'
				this.input = JSON.stringify([
					{ 名称: '图片转换', 分类: '格式转换', 使用次数: 12 },
					{ 名称: '二维码', 分类: '实用工具', 使用次数: 8 },
					{ 名称: '文本编辑器', 分类: '文件编辑', 使用次数: 20 }
				], null, 2)
				this.output = ''
				this.info = ''
				this.error = ''
			}
		}
	}
</script>
