<template>
	<view class="card">
		<view class="card-title">正则表达式</view>
		<tb-input class="input" v-model="pattern" placeholder="例如 (\d+)" />
		<view class="row" style="margin-top: 16rpx">
			<view class="chip" v-for="f in flagList" :key="f.k" :class="{ on: hasFlag(f.k) }" @click="toggleFlag(f.k)">
				{{ f.k }} · {{ f.n }}
			</view>
		</view>
		<view class="label">测试文本</view>
		<tb-textarea class="textarea" v-model="text" placeholder="输入要匹配的文本" ></tb-textarea>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm" @click="sample">填入示例</view>
			<view class="btn btn-sm btn-ghost" @click="text = ''">清空</view>
		</view>
		<view class="hint">纯本地运行，不发送任何数据；最多列出 1000 个匹配。</view>
	</view>

	<view class="card">
		<view class="card-title">匹配结果：{{ result.count }} 处</view>
		<view v-if="error" class="hint" style="color: var(--danger)">{{ error }}</view>
		<view class="result" style="max-height: 280rpx; overflow: auto">
			<text v-for="(s, i) in result.segments" :key="i" :class="{ hit: s.hit }">{{ s.text }}</text>
		</view>

		<view class="label">匹配列表（前 50 条）</view>
		<view class="kv" v-for="(m, i) in shown" :key="i">
			<text>#{{ i + 1 }} · 位置 {{ m.index }}</text>
			<text>{{ m.text || '(空匹配)' }}</text>
		</view>

		<view class="label">替换为（支持 $1 引用分组，留空表示删除）</view>
		<tb-input class="input" v-model="replacement" placeholder="例如 [$&]" />
		<view class="result">{{ result.replaced }}</view>
		<view class="row" style="margin-top: 14rpx">
			<view class="btn btn-sm" @click="copyText(result.replaced)">复制替换结果</view>
		</view>
	</view>
</template>

<script>
	import { regexRun } from '../../utils/format-extra.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				pattern: '(\\d{4})-(\\d{2})-(\\d{2})',
				flags: 'g',
				text: '订单 2026-11-07 创建，交付日期 2026-12-01，金额 88.5 元。',
				replacement: '[$1/$2/$3]',
				error: '',
				result: { count: 0, segments: [], matches: [], replaced: '' },
				flagList: [
					{ k: 'g', n: '全局' }, { k: 'i', n: '忽略大小写' },
					{ k: 'm', n: '多行' }, { k: 's', n: '点含换行' }
				]
			}
		},
		computed: {
			shown() { return this.result.matches.slice(0, 50) }
		},
		watch: { pattern: 'run', flags: 'run', text: 'run', replacement: 'run' },
		mounted() { this.run() },
		methods: {
			copyText,
			hasFlag(k) { return this.flags.indexOf(k) >= 0 },
			toggleFlag(k) {
				this.flags = this.hasFlag(k) ? this.flags.replace(k, '') : this.flags + k
			},
			sample() {
				this.pattern = '(\\w+)@(\\w+)\\.(\\w+)'
				this.text = '联系我们：hello@example.com 或 support@workbuddy.cn 均可。'
				this.replacement = '<$1@***>'
			},
			run() {
				try {
					this.result = regexRun(this.pattern, this.flags, this.text, this.replacement)
					this.error = ''
				} catch (e) {
					this.error = e.message
					this.result = { count: 0, segments: [], matches: [], replaced: '' }
				}
			}
		}
	}
</script>

<style scoped>
	.hit { background: var(--primary); color: #ffffff; border-radius: 4rpx; }
</style>
