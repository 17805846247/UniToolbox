<template>
	<view>
		<view class="card">
			<view class="card-title">选择计算类型</view>
			<view class="row">
				<view class="chip" v-for="m in modes" :key="m.k" :class="{ on: mode === m.k }" @click="mode = m.k">{{ m.n }}</view>
			</view>
			<view class="label">{{ current.a }}</view>
			<tb-input class="input" v-model="a" type="digit" :placeholder="current.pa" />
			<view class="label">{{ current.b }}</view>
			<tb-input class="input" v-model="b" type="digit" :placeholder="current.pb" />
			<view class="row" style="margin-top:18rpx">
				<view class="btn btn-sm" v-for="s in samples" :key="s" @click="fillSample(s)">{{ s }}</view>
			</view>
			<view class="hint">{{ current.tip }}</view>
		</view>

		<view class="card" v-if="result">
			<view class="card-title">计算结果</view>
			<view class="big-value">{{ result.text }}</view>
			<view class="hint" style="text-align:center;margin-top:-6rpx">{{ result.formula }}</view>
			<view class="row" style="justify-content:center;margin-top:20rpx">
				<view class="btn btn-sm btn-primary" @click="copyText(result.text)">复制结果</view>
			</view>
		</view>
		<view class="card" v-if="error"><view class="hint" style="color:var(--danger)">{{ error }}</view></view>

		<view class="card">
			<view class="card-title">常见场景</view>
			<view class="kv"><text>商品打 8 折</text><text>折扣：原价 × 8 ÷ 10</text></view>
			<view class="kv"><text>涨价 / 降价</text><text>增加、减少百分比</text></view>
			<view class="kv"><text>同比增长率</text><text>(新值 − 原值) ÷ 原值</text></view>
			<view class="kv"><text>已知折后价求原价</text><text>反推原价</text></view>
		</view>
	</view>
</template>

<script>
	import { percentCalc } from '../../utils/life.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				mode: 'of', a: '200', b: '15', error: '',
				samples: ['重置', '8 折', '涨 10%'],
				modes: [
					{ k: 'of', n: '求百分比', a: '基数', b: '百分比（%）', pa: '例如 200', pb: '例如 15', tip: '计算一个数的百分之几，如 200 的 15%。' },
					{ k: 'ratio', n: '求占比', a: '部分数值', b: '总数值', pa: '例如 50', pb: '例如 200', tip: '计算部分占总数的百分比，如完成率、正确率。' },
					{ k: 'add', n: '增加', a: '原数值', b: '增加百分比（%）', pa: '例如 100', pb: '例如 10', tip: '计算上涨、加价、含税后的数值。' },
					{ k: 'sub', n: '减少', a: '原数值', b: '减少百分比（%）', pa: '例如 100', pb: '例如 10', tip: '计算降价、衰减后的数值。' },
					{ k: 'growth', n: '增长率', a: '原数值', b: '新数值', pa: '例如 100', pb: '例如 120', tip: '计算从原值到新值的变化百分比，可为负。' },
					{ k: 'discount', n: '打折', a: '原价（元）', b: '折扣（折）', pa: '例如 100', pb: '例如 8', tip: '8 折即原价的 80%，8.5 折即 85%。' },
					{ k: 'original', n: '反推原价', a: '折后价（元）', b: '折扣（折）', pa: '例如 80', pb: '例如 8', tip: '已知折后价与折扣，求打折前的原价。' }
				]
			}
		},
		computed: {
			current() { return this.modes.find(m => m.k === this.mode) || this.modes[0] },
			result() {
				try { this.error = ''; return percentCalc(this.mode, this.a, this.b) }
				catch (e) { this.error = e.message; return null }
			}
		},
		methods: {
			copyText,
			fillSample(s) {
				if (s === '重置') { this.a = '200'; this.b = '15'; this.mode = 'of' }
				else if (s === '8 折') { this.a = '299'; this.b = '8'; this.mode = 'discount' }
				else { this.a = '100'; this.b = '10'; this.mode = 'add' }
			}
		}
	}
</script>
