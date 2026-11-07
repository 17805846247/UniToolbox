<template>
	<view class="card">
		<view class="card-title">输入数字</view>
		<tb-input class="input" v-model="input" placeholder="例如 FF、1024、101101" />
		<view class="label">源进制 → 目标进制</view>
		<view class="row pickers">
			<picker mode="selector" :range="bases" :value="fromIdx" @change="onFrom">
				<view class="picker">源：{{ bases[fromIdx] }} 进制</view>
			</picker>
			<text class="arrow">→</text>
			<picker mode="selector" :range="bases" :value="toIdx" @change="onTo">
				<view class="picker">目标：{{ bases[toIdx] }} 进制</view>
			</picker>
		</view>
		<view class="row" style="margin-top: 8rpx">
			<view class="chip" v-for="b in common" :key="b" @click="setFrom(b)">{{ b }} 进制输入</view>
		</view>
		<view class="label">转换结果</view>
		<view class="result big-value">{{ output || '—' }}</view>
		<view v-if="error" style="color:var(--danger);font-size:25rpx;margin-top:10rpx">{{ error }}</view>
		<view class="row" style="margin-top: 12rpx">
			<view class="btn btn-sm" @click="copyText(output)">复制结果</view>
			<view class="btn btn-sm btn-ghost" @click="swap">交换源与目标</view>
		</view>
		<view class="divider"></view>
		<view class="card-title">常用进制对照</view>
		<view class="kv" v-for="r in quick" :key="r.b">
			<text>{{ r.name }}（{{ r.b }} 进制）</text>
			<text>{{ r.v || '—' }}</text>
		</view>
		<view class="hint">采用任意精度整数算法，超过 2^53 的大数也不会失真；支持 2~36 进制。</view>
	</view>
</template>

<script>
	import { radixConvert } from '../../utils/convert.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				input: '255', fromIdx: 8, toIdx: 14, output: '', error: '',
				bases: Array.from({ length: 35 }, (_, i) => String(i + 2)),
				common: [2, 8, 10, 16]
			}
		},
		computed: {
			from() { return Number(this.bases[this.fromIdx]) },
			to() { return Number(this.bases[this.toIdx]) },
			quick() {
				const names = { 2: '二进制', 8: '八进制', 10: '十进制', 16: '十六进制', 36: '三十六进制' }
				return [2, 8, 10, 16, 36].map(b => {
					let v = ''
					try { if (this.input) v = radixConvert(this.input, this.from, b) } catch (e) { v = '' }
					return { b, name: names[b], v }
				})
			}
		},
		watch: {
			input: 'calc', fromIdx: 'calc', toIdx: 'calc'
		},
		mounted() { this.calc() },
		methods: {
			copyText,
			onFrom(e) { this.fromIdx = Number(e.detail.value) },
			onTo(e) { this.toIdx = Number(e.detail.value) },
			setFrom(b) { this.fromIdx = b - 2 },
			calc() {
				try {
					this.output = this.input ? radixConvert(this.input, this.from, this.to) : ''
					this.error = ''
				} catch (e) { this.output = ''; this.error = e.message }
			},
			swap() {
				const t = this.fromIdx
				this.fromIdx = this.toIdx
				this.toIdx = t
			}
		}
	}
</script>

<style scoped>
	.pickers picker { width: 44%; }
	.pickers .picker { text-align: center; }
	.arrow { color: var(--text-3); font-size: 30rpx; }
</style>
