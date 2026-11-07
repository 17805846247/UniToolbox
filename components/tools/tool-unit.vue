<template>
	<view class="card">
		<view class="card-title">换算类别</view>
		<view class="row">
			<view class="chip" v-for="g in groups" :key="g.key" :class="{ on: group === g.key }" @click="setGroup(g.key)">{{ g.name }}</view>
		</view>
		<view class="label">数值</view>
		<tb-input class="input" v-model="value" type="digit" placeholder="输入要换算的数值" />
		<view class="row pickers" style="margin-top: 20rpx">
			<picker mode="selector" :range="units" :value="fromIdx" @change="onFrom">
				<view class="picker">{{ from }}</view>
			</picker>
			<view class="btn btn-sm btn-ghost" @click="swap">交换</view>
			<picker mode="selector" :range="units" :value="toIdx" @change="onTo">
				<view class="picker">{{ to }}</view>
			</picker>
		</view>
		<view class="label">换算结果（{{ to }}）</view>
		<view class="result big-value">{{ calc.v }}</view>
		<view v-if="calc.err" style="color:var(--danger);font-size:25rpx">{{ calc.err }}</view>
		<view class="row" style="margin-top: 10rpx">
			<view class="btn btn-sm" @click="copyText(calc.v)">复制结果</view>
		</view>
	</view>

	<view class="card">
		<view class="card-title">换算成其它单位</view>
		<view class="kv" v-for="u in units" :key="u" @click="copyText(other(u))">
			<text>{{ u }}</text>
			<text>{{ other(u) }}</text>
		</view>
		<view class="hint">点任意一行可复制该数值；温度为非线性换算，单独处理。</view>
	</view>
</template>

<script>
	import { UNIT_GROUPS, convertUnit } from '../../utils/convert.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				groups: Object.keys(UNIT_GROUPS).map(k => ({ key: k, name: UNIT_GROUPS[k].name })),
				group: 'length', from: 'm', to: 'km', value: '1'
			}
		},
		computed: {
			units() { return Object.keys(UNIT_GROUPS[this.group].units) },
			fromIdx() { return Math.max(0, this.units.indexOf(this.from)) },
			toIdx() { return Math.max(0, this.units.indexOf(this.to)) },
			calc() {
				try { return { v: this.pretty(convertUnit(this.value, this.group, this.from, this.to)), err: '' } }
				catch (e) { return { v: '—', err: e.message } }
			}
		},
		methods: {
			copyText,
			onFrom(e) { this.from = this.units[Number(e.detail.value)] },
			onTo(e) { this.to = this.units[Number(e.detail.value)] },
			setGroup(k) {
				this.group = k
				this.from = this.units[0]
				this.to = this.units[1] || this.units[0]
			},
			swap() { const t = this.from; this.from = this.to; this.to = t },
			pretty(v) {
				if (!isFinite(v)) return '—'
				if (v === 0) return '0'
				const a = Math.abs(v)
				if (a >= 1e12 || a < 1e-6) return v.toExponential(6)
				return String(Math.round(v * 1e10) / 1e10)
			},
			other(u) {
				try { return this.pretty(convertUnit(this.value, this.group, this.from, u)) }
				catch (e) { return '—' }
			}
		}
	}
</script>

<style scoped>
	.pickers picker { width: 40%; }
	.pickers .picker { text-align: center; }
</style>
