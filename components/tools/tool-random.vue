<template>
	<view class="card">
		<view class="card-title">抽签方式</view>
		<view class="row">
			<view class="chip" v-for="m in modes" :key="m.key" :class="{ on: mode === m.key }" @click="mode = m.key; result = ''">{{ m.name }}</view>
		</view>

		<view v-if="mode === 'number'" style="margin-top: 16rpx">
			<view class="row">
				<tb-input class="input grow" v-model="min" type="number" placeholder="最小值" />
				<tb-input class="input grow" v-model="max" type="number" placeholder="最大值" />
			</view>
			<view class="label">一次抽几个</view>
			<view class="row">
				<view class="chip" v-for="n in [1, 3, 5, 10]" :key="n" :class="{ on: numCount === n }" @click="numCount = n">{{ n }} 个</view>
			</view>
		</view>

		<view v-else-if="mode === 'names'" style="margin-top: 16rpx">
			<view class="label">名单（每行一个，支持中文）</view>
			<tb-textarea class="textarea" v-model="names" placeholder="张三&#10;李四&#10;王五" ></tb-textarea>
			<view class="label">抽取人数</view>
			<view class="row">
				<view class="chip" v-for="n in [1, 2, 3, 5]" :key="n" :class="{ on: pickCount === n }" @click="pickCount = n">{{ n }} 人</view>
			</view>
		</view>

		<view v-else-if="mode === 'dice'" style="margin-top: 16rpx">
			<view class="label">骰子个数</view>
			<view class="row">
				<view class="chip" v-for="n in [1, 2, 3, 4, 5]" :key="n" :class="{ on: diceCount === n }" @click="diceCount = n">{{ n }} 个</view>
			</view>
		</view>

		<view v-else class="hint" style="margin-top: 16rpx">点下面的按钮抛一次硬币，正面 / 反面各 50%。</view>

		<view class="row" style="margin-top: 22rpx">
			<view class="btn btn-primary grow" @click="run">{{ mode === 'coin' ? '抛硬币' : '开始抽取' }}</view>
			<view class="btn btn-ghost" @click="history = []; result = ''">清空记录</view>
		</view>
	</view>

	<view class="card">
		<view class="card-title">本次结果</view>
		<view class="result big-value">{{ result || '等待抽取' }}</view>
		<view class="row" style="justify-content: center" v-if="result">
			<view class="btn btn-sm" @click="copyText(result)">复制结果</view>
		</view>
	</view>

	<view class="card" v-if="history.length">
		<view class="card-title">历史记录（最近 8 次）</view>
		<view class="kv" v-for="(h, i) in history" :key="i">
			<text>{{ h.time }}</text>
			<text>{{ h.text }}</text>
		</view>
	</view>
</template>

<script>
	import { copyText, toast } from '../../utils/ui.js'
	import { formatDate } from '../../utils/convert.js'

	export default {
		data() {
			return {
				mode: 'number', modes: [
					{ key: 'number', name: '随机数' }, { key: 'names', name: '名单抽签' },
					{ key: 'coin', name: '抛硬币' }, { key: 'dice', name: '掷骰子' }
				],
				min: '1', max: '100', numCount: 1,
				names: '', pickCount: 1, diceCount: 2,
				result: '', history: []
			}
		},
		methods: {
			copyText,
			rnd(n) {
				try {
					const c = typeof window !== 'undefined' ? window.crypto : null
					if (c && c.getRandomValues) { const a = new Uint32Array(1); c.getRandomValues(a); return a[0] % n }
				} catch (e) { /* 回退 */ }
				return Math.floor(Math.random() * n)
			},
			add(text) {
				this.result = text
				this.history.unshift({ time: formatDate(new Date()).slice(11), text })
				this.history = this.history.slice(0, 8)
			},
			run() {
				if (this.mode === 'number') {
					const a = Number(this.min), b = Number(this.max)
					if (!isFinite(a) || !isFinite(b) || a > b) return toast('请输入有效范围，最小值不能大于最大值')
					const arr = []
					for (let i = 0; i < this.numCount; i++) arr.push(a + this.rnd(b - a + 1))
					this.add(arr.join('，'))
				} else if (this.mode === 'names') {
					const list = this.names.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
					if (!list.length) return toast('请先输入名单')
					for (let i = list.length - 1; i > 0; i--) { const j = this.rnd(i + 1); const t = list[i]; list[i] = list[j]; list[j] = t }
					this.add(list.slice(0, Math.min(this.pickCount, list.length)).join('，'))
				} else if (this.mode === 'coin') {
					this.add(this.rnd(2) ? '正面' : '反面')
				} else {
					const arr = []
					for (let i = 0; i < this.diceCount; i++) arr.push(this.rnd(6) + 1)
					this.add(arr.join(' + ') + ' = ' + arr.reduce((s, n) => s + n, 0))
				}
			}
		}
	}
</script>
