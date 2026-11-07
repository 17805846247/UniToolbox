<template>
	<view class="card">
		<view class="card-title">表达式</view>
		<tb-input class="input" v-model="expr" placeholder="输入算式，例如 (12+8)*3/4" />
		<view class="result-box">
			<text class="result-label">=</text>
			<text class="result-value">{{ result }}</text>
		</view>
		<view class="row" style="margin-top: 12rpx">
			<view class="btn btn-sm" @click="copyText(String(result))">复制结果</view>
			<view class="btn btn-sm btn-ghost" @click="expr = ''; result = ''">清空</view>
		</view>
		<view class="hint">支持 + - × ÷ %、括号、小数、幂（^）；不调用 eval，纯本地解析。</view>
	</view>

	<view class="card">
		<view class="card-title">按键</view>
		<view class="keypad" v-for="(row, ri) in keys" :key="ri">
			<view class="key" v-for="k in row" :key="k"
				:class="{ 'key-op': isOp(k), 'key-eq': k === '=' }" @click="press(k)">{{ k }}</view>
		</view>
	</view>

	<view class="card" v-if="history.length">
		<view class="card-title">计算记录</view>
		<view class="kv" v-for="(h, i) in history" :key="i" @click="expr = h.expr">
			<text>{{ h.expr }}</text>
			<text>= {{ h.value }}</text>
		</view>
		<view class="hint">点记录可把算式放回输入区。</view>
	</view>
</template>

<script>
	import { calcExpression } from '../../utils/convert.js'
	import { copyText, toast } from '../../utils/ui.js'

	export default {
		data() {
			return {
				expr: '', result: '', history: [],
				keys: [
					['C', '(', ')', '←'], ['7', '8', '9', '÷'],
					['4', '5', '6', '×'], ['1', '2', '3', '-'],
					['0', '.', '%', '+'], ['^', '00', 'Ans', '=']
				],
				lastAnswer: '0'
			}
		},
		methods: {
			copyText,
			isOp(k) { return ['+', '-', '×', '÷', '%', '^', '(', ')', '←', 'C'].indexOf(k) >= 0 },
			press(k) {
				if (k === 'C') { this.expr = ''; this.result = ''; return }
				if (k === '←') { this.expr = this.expr.slice(0, -1); return }
				if (k === 'Ans') { this.expr += this.lastAnswer; return }
				if (k === '=') { this.calc(); return }
				if (k === '00') { this.expr += '00'; return }
				this.expr += k
			},
			calc() {
				if (!this.expr) return
				try {
					const v = calcExpression(this.expr)
					this.result = String(v)
					this.lastAnswer = String(v)
					this.history.unshift({ expr: this.expr, value: v })
					this.history = this.history.slice(0, 10)
				} catch (e) { toast(e.message); this.result = '错误' }
			}
		}
	}
</script>

<style scoped>
	.result-box { display: flex; align-items: center; justify-content: flex-end; padding: 26rpx 10rpx 6rpx; }
	.result-label { color: var(--text-3); font-size: 34rpx; margin-right: 20rpx; }
	.result-value { color: var(--primary); font-size: 60rpx; font-weight: 700; word-break: break-all; }
	.keypad { display: flex; flex-direction: row; justify-content: space-between; margin-bottom: 14rpx; }
	.key {
		width: 23%; height: 92rpx; border-radius: 16rpx; background: var(--input-bg);
		display: flex; align-items: center; justify-content: center;
		font-size: 32rpx; color: var(--text);
	}
	.key-op { background: var(--primary-soft); color: var(--primary); }
	.key-eq { background: var(--primary); color: #ffffff; }
	.key:active { opacity: 0.7; }
</style>
