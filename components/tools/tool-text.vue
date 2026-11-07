<template>
	<view class="card">
		<view class="card-title">文本内容</view>
		<tb-textarea class="textarea tall" v-model="input" placeholder="粘贴或输入文本，点下面的按钮直接处理" ></tb-textarea>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm btn-primary" @click="undo" :class="{ disabled: !stack.length }">撤销</view>
			<view class="btn btn-sm" @click="copyText(input)">复制文本</view>
			<view class="btn btn-sm btn-ghost" @click="paste">粘贴</view>
			<view class="btn btn-sm btn-danger" @click="input = ''; stack = []">清空</view>
		</view>
		<view class="hint">每次处理都会记一步，可连续点击多个操作，也可以撤销。</view>
	</view>

	<view class="card">
		<view class="card-title">一键处理</view>
		<view class="row">
			<view class="chip" v-for="o in ops" :key="o.key" @click="apply(o.key)">{{ o.name }}</view>
		</view>
	</view>

	<view class="card">
		<view class="card-title">文本统计</view>
		<view class="kv"><text>字符数</text><text>{{ stats.chars }}</text></view>
		<view class="kv"><text>不含空白</text><text>{{ stats.noSpace }}</text></view>
		<view class="kv"><text>行数</text><text>{{ stats.lines }}</text></view>
		<view class="kv"><text>英文单词</text><text>{{ stats.words }}</text></view>
		<view class="kv"><text>中文字</text><text>{{ stats.chinese }}</text></view>
		<view class="kv"><text>UTF-8 字节</text><text>{{ stats.bytes }}</text></view>
	</view>
</template>

<script>
	import { TEXT_OPS, textTransform, textStats } from '../../utils/convert.js'
	import { copyText, toast } from '../../utils/ui.js'

	export default {
		data() {
			return { input: '', ops: TEXT_OPS, stack: [] }
		},
		computed: {
			stats() { return textStats(this.input) }
		},
		methods: {
			copyText,
			apply(op) {
				if (!this.input) return toast('请先输入文本')
				this.stack.push(this.input)
				if (this.stack.length > 30) this.stack.shift()
				this.input = textTransform(this.input, op)
			},
			undo() {
				if (!this.stack.length) return toast('没有可撤销的操作')
				this.input = this.stack.pop()
			},
			async paste() {
				try {
					const res = await uni.getClipboardData()
					const r = Array.isArray(res) ? res[1] : res
					if (r && r.data) this.input = String(r.data)
					else toast('剪贴板是空的')
				} catch (e) { toast('无法读取剪贴板') }
			}
		}
	}
</script>

<style scoped>
	.disabled { opacity: 0.45; }
</style>
