<template>
	<view class="card">
		<view class="card-title">待计算内容</view>
		<tb-textarea class="textarea" v-model="input" placeholder="输入文字，或从文件管理器载入一个文件" ></tb-textarea>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm" @click="fromFile">从文件载入</view>
			<view class="btn btn-sm btn-ghost" @click="upper = !upper">切换{{ upper ? '小写' : '大写' }}</view>
			<view class="btn btn-sm btn-danger" @click="input = ''">清空</view>
		</view>
		<view class="hint">三种摘要同时计算，纯本地算法，不上传任何内容。</view>
	</view>

	<view class="card">
		<view class="card-title">计算结果</view>
		<view v-for="r in results" :key="r.name" style="margin-bottom: 22rpx">
			<view class="label" style="margin-top: 0">{{ r.name }}（{{ r.value.length }} 位）</view>
			<view class="result">{{ r.value }}</view>
			<view class="btn btn-sm" style="margin-top: 10rpx" @click="copyText(r.value)">复制 {{ r.name }}</view>
		</view>
		<view class="hint">MD5 / SHA-1 已不推荐用于密码存储，仅适合做文件一致性校验；安全性请用 SHA-256。</view>
	</view>
</template>

<script>
	import { md5, sha1, sha256 } from '../../utils/crypto.js'
	import { listFiles, readFile } from '../../utils/fs.js'
	import { copyText, toast } from '../../utils/ui.js'

	const ALGOS = [
		{ name: 'MD5', fn: md5 }, { name: 'SHA-1', fn: sha1 }, { name: 'SHA-256', fn: sha256 }
	]

	export default {
		data() {
			return { input: '', upper: false }
		},
		computed: {
			results() {
				return ALGOS.map(a => {
					let v = ''
					try { v = a.fn(this.input) } catch (e) { v = e.message }
					return { name: a.name, value: this.upper ? v.toUpperCase() : v }
				})
			}
		},
		methods: {
			copyText,
			async fromFile() {
				try {
					const files = await listFiles()
					if (!files.length) return toast('文件管理器里还没有文件')
					const names = files.slice(0, 20).map(f => f.name)
					uni.showActionSheet({
						itemList: names,
						success: async r => {
							try {
								this.input = await readFile(names[r.tapIndex])
								toast('已载入 ' + names[r.tapIndex])
							} catch (e) { toast(e.message) }
						},
						fail: () => {}
					})
				} catch (e) { toast(e.message) }
			}
		}
	}
</script>
