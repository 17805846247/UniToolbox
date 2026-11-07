<template>
	<view>
		<view class="card">
			<view class="card-title">粘贴任意内容</view>
			<tb-textarea class="textarea" v-model="text" placeholder="例如 JSON、JWT、网址、Base64、时间戳、Cron、颜色值、手机号…"
				placeholder-style="color:var(--text-3)" />
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm" v-for="s in samples" :key="s.k" @click="text = s.v">{{ s.k }}</view>
				<view class="btn btn-sm btn-ghost" @click="text = ''">清空</view>
			</view>
			<view class="hint">灵感来自 DevDeck 的 Command Playground：全部在本机判断，不会发送任何内容。</view>
		</view>

		<view v-if="!result.empty" class="card">
			<view class="card-title">识别结果</view>
			<view class="head-type">
				<view class="type-badge">{{ picked.label }}</view>
				<view class="grow">
					<view class="type-summary">{{ picked.summary }}</view>
					<view class="type-meta">置信度 {{ picked.confidence }}%</view>
				</view>
			</view>
			<view class="conf-track"><view class="conf-fill" :style="{ width: picked.confidence + '%' }"></view></view>

			<view class="kv" v-for="(f, i) in picked.facts" :key="i">
				<text>{{ f.k }}</text><text>{{ f.v }}</text>
			</view>

			<view class="row" style="margin-top:20rpx">
				<view class="btn btn-sm btn-primary" @click="openTool">打开「{{ toolName }}」›</view>
				<view class="btn btn-sm" @click="copyText(text)">复制原文</view>
			</view>
		</view>

		<view v-if="result.candidates.length > 1" class="card">
			<view class="card-title">其它候选（点击查看解读）</view>
			<view class="cand" v-for="(c, i) in result.candidates" :key="c.type"
				:class="{ on: chosen === i }" @click="chosen = i">
				<text class="cand-name">{{ c.label }}</text>
				<text class="cand-sum">{{ c.summary }}</text>
			</view>
		</view>

		<view v-if="!result.empty" class="card">
			<view class="card-title">文本统计</view>
			<view class="stat-grid">
				<view class="stat"><view class="stat-v">{{ result.stats.chars }}</view><view class="stat-k">字符</view></view>
				<view class="stat"><view class="stat-v">{{ result.stats.charsNoSpace }}</view><view class="stat-k">不含空格</view></view>
				<view class="stat"><view class="stat-v">{{ result.stats.lines }}</view><view class="stat-k">行</view></view>
				<view class="stat"><view class="stat-v">{{ result.stats.chinese }}</view><view class="stat-k">中文字</view></view>
				<view class="stat"><view class="stat-v">{{ result.stats.bytes }}</view><view class="stat-k">UTF-8 字节</view></view>
			</view>
		</view>

		<view v-else class="card"><view class="empty">输入内容后会自动识别类型并推荐对应工具</view></view>
	</view>
</template>

<script>
	import { detectText } from '../../utils/gadget.js'
	import { getTool } from '../../utils/tools.js'
	import { copyText, toast } from '../../utils/ui.js'

	export default {
		data() {
			return {
				text: '', chosen: 0,
				samples: [
					{ k: 'JSON', v: '{"name":"口袋工具箱","tools":49,"offline":true}' },
					{ k: '网址', v: 'https://example.com/search?q=toolbox&page=1' },
					{ k: '时间戳', v: '1700000000' },
					{ k: 'Cron', v: '30 9 * * 1-5' },
					{ k: '颜色', v: '#4f6ef7' }
				]
			}
		},
		computed: {
			result() { return detectText(this.text) },
			picked() { return this.result.candidates[this.chosen] || this.result.candidates[0] || this.result },
			toolName() {
				const t = getTool(this.picked.toolKey)
				return t ? t.name : '文本工具箱'
			}
		},
		watch: { text() { this.chosen = 0 } },
		methods: {
			copyText,
			openTool() {
				const k = this.picked.toolKey || 'text'
				copyText(this.text)
				toast('原文已复制，可直接粘贴')
				uni.navigateTo({ url: '/pages/tool/tool?key=' + k })
			}
		}
	}
</script>

<style scoped>
	.head-type { display: flex; flex-direction: row; align-items: center; margin-bottom: 16rpx; }
	.type-badge {
		padding: 12rpx 22rpx; border-radius: var(--radius-sm); margin-right: 20rpx;
		background: var(--primary-soft); color: var(--primary); font-size: 25rpx; font-weight: 600;
		flex-shrink: 0;
	}
	.type-summary { font-size: 26rpx; color: var(--text); line-height: 1.6; }
	.type-meta { font-size: 22rpx; color: var(--text-3); margin-top: 8rpx; }
	.conf-track { height: 8rpx; border-radius: 999rpx; background: var(--line); overflow: hidden; margin-bottom: 20rpx; }
	.conf-fill { height: 100%; background: var(--primary); border-radius: 999rpx; }
	.cand {
		display: flex; flex-direction: column; padding: 18rpx 20rpx; border-radius: var(--radius-sm);
		background: var(--input-bg); margin-bottom: 12rpx;
	}
	.cand.on { background: var(--primary-soft); }
	.cand-name { font-size: 25rpx; color: var(--text); font-weight: 600; }
	.cand-sum { font-size: 22rpx; color: var(--text-3); margin-top: 6rpx; line-height: 1.5; }
	.stat-grid { display: flex; flex-direction: row; flex-wrap: wrap; }
	.stat { width: 20%; text-align: center; padding: 10rpx 0; box-sizing: border-box; }
	.stat-v { font-size: 30rpx; font-weight: 700; color: var(--primary); }
	.stat-k { font-size: 20rpx; color: var(--text-3); margin-top: 6rpx; }
</style>
