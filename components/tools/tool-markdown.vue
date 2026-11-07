<template>
	<view class="card">
		<view class="card-title">Markdown 源码</view>
		<tb-textarea class="textarea tall" v-model="md" placeholder="在这里写 Markdown…" ></tb-textarea>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm" @click="sample">填入示例</view>
			<view class="btn btn-sm btn-ghost" @click="md = ''">清空</view>
			<view class="btn btn-sm btn-ghost" @click="copyText(html)">复制 HTML</view>
		</view>
		<view class="hint">本地解析，不联网、不加载外部图片；支持标题、粗斜体、行内代码、代码块、列表、引用、链接与分隔线。</view>
	</view>

	<view class="card">
		<view class="card-title">预览</view>
		<view class="md-body"><rich-text :nodes="html"></rich-text></view>
		<view class="divider"></view>
		<view class="card-title">生成的 HTML（{{ html.length }} 字符）</view>
		<view class="result" style="max-height: 260rpx; overflow: auto">{{ html }}</view>
	</view>
</template>

<script>
	import { markdownToHtml } from '../../utils/format-extra.js'
	import { copyText } from '../../utils/ui.js'

	const DEMO = '# 口袋工具箱\n\n一个**完全离线**的小工具合集，支持 `Markdown` 预览。\n\n## 功能\n\n- 格式转换\n- 文件编辑\n- 实用工具\n\n> 所有计算都在手机本地完成。\n\n---\n\n查看 [项目说明](https://dcloud.io)。\n\n```\nconst tool = "offline"\n```'

	export default {
		data() { return { md: DEMO } },
		computed: {
			html() { return markdownToHtml(this.md) }
		},
		methods: {
			copyText,
			sample() { this.md = DEMO }
		}
	}
</script>

<style scoped>
	.md-body {
		background: var(--card); color: var(--text); font-size: 27rpx;
		line-height: 1.8; padding: 8rpx 4rpx; min-height: 120rpx;
	}
</style>
