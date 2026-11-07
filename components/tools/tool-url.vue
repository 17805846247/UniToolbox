<template>
	<view class="card">
		<view class="card-title">URL 或查询串</view>
		<tb-textarea class="textarea" v-model="input" placeholder="https://example.com/search?q=中文&page=1" ></tb-textarea>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm btn-primary" @click="parse">解析</view>
			<view class="btn btn-sm" @click="sample">填入示例</view>
			<view class="btn btn-sm btn-ghost" @click="input = ''; pairs = []; base = ''">清空</view>
		</view>
		<view class="hint">自动识别完整 URL 或纯 a=1&amp;b=2 查询串；中文与特殊字符自动解码。</view>
	</view>

	<view class="card" v-if="base">
		<view class="card-title">地址主体</view>
		<view class="result">{{ base }}</view>
		<view class="btn btn-sm" style="margin-top: 12rpx" @click="copyText(base)">复制</view>
	</view>

	<view class="card">
		<view class="card-title">参数（{{ pairs.length }} 个，可直接编辑）</view>
		<view v-for="(p, i) in pairs" :key="i" class="pair">
			<tb-input class="input pair-k" v-model="p.key" placeholder="参数名" />
			<tb-input class="input pair-v" v-model="p.value" placeholder="参数值" />
			<view class="pair-del" @click="pairs.splice(i, 1)">×</view>
		</view>
		<view v-if="!pairs.length" class="empty">暂无参数</view>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm" @click="pairs.push({ key: '', value: '' })">添加一行</view>
			<view class="btn btn-sm btn-ghost" @click="encode = !encode">{{ encode ? '编码中' : '不编码' }}（点切换）</view>
		</view>
	</view>

	<view class="card">
		<view class="card-title">重新拼装</view>
		<view class="result">{{ query }}</view>
		<view class="result" v-if="base">{{ full }}</view>
		<view class="row" style="margin-top: 12rpx">
			<view class="btn btn-sm" @click="copyText(full || query)">复制完整地址</view>
			<view class="btn btn-sm btn-ghost" @click="copyText(json)">复制 JSON</view>
		</view>
		<view class="hint">JSON 视图会把重复参数合并成数组。</view>
	</view>
</template>

<script>
	import { parseUrl, buildQuery, queryToObject } from '../../utils/format-extra.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() { return { input: '', base: '', pairs: [], encode: true } },
		computed: {
			query() { return buildQuery(this.pairs, this.encode) },
			full() { return this.base ? this.base + (this.query ? '?' + this.query : '') : '' },
			json() { return JSON.stringify(queryToObject(this.pairs), null, 2) }
		},
		mounted() { this.sample() },
		methods: {
			copyText,
			parse() {
				const r = parseUrl(this.input)
				this.base = r.base
				this.pairs = r.pairs.map(p => ({ key: p.key, value: p.value }))
			},
			sample() {
				this.input = 'https://example.com/search?q=%E5%8F%A3%E8%A2%8B%E5%B7%A5%E5%85%B7%E7%AE%B1&page=1&tag=offline&tag=tools#result'
				this.parse()
			}
		}
	}
</script>

<style scoped>
	.pair { display: flex; flex-direction: row; align-items: center; margin-bottom: 12rpx; }
	.pair-k { flex: 1; margin-right: 10rpx; height: 68rpx; font-size: 24rpx; }
	.pair-v { flex: 1.4; height: 68rpx; font-size: 24rpx; }
	.pair-del { width: 48rpx; text-align: center; color: var(--danger); font-size: 36rpx; }
</style>
