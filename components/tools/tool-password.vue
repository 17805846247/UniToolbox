<template>
	<view class="card">
		<view class="card-title">密码长度：<text style="color:var(--primary)">{{ len }}</text> 位</view>
		<slider :value="len" min="4" max="64" show-value activeColor="#4f6ef7" @change="onLen" block-size="22" />
		<view class="label">生成数量</view>
		<view class="row">
			<view class="chip" v-for="n in [1, 3, 5, 10]" :key="n" :class="{ on: count === n }" @click="count = n">{{ n }} 个</view>
		</view>
		<view class="label">字符组成</view>
		<view class="row">
			<view class="chip" :class="{ on: useUpper }" @click="useUpper = !useUpper">大写 A-Z</view>
			<view class="chip" :class="{ on: useLower }" @click="useLower = !useLower">小写 a-z</view>
			<view class="chip" :class="{ on: useDigit }" @click="useDigit = !useDigit">数字 0-9</view>
			<view class="chip" :class="{ on: useSymbol }" @click="useSymbol = !useSymbol">符号 !@#</view>
			<view class="chip" :class="{ on: noSimilar }" @click="noSimilar = !noSimilar">排除易混淆字符</view>
		</view>
		<view class="row" style="margin-top: 20rpx">
			<view class="btn btn-primary grow" @click="generate">生成密码</view>
			<view class="btn btn-ghost" @click="copyText(list.join('\n'))">复制全部</view>
		</view>
		<view class="hint">强度估计：约 {{ bits }} bit 熵（字符集 {{ poolSize }} 种）。优先使用系统安全随机数。</view>
	</view>

	<view class="card" v-if="list.length">
		<view class="card-title">生成结果</view>
		<view class="pwd" v-for="(p, i) in list" :key="i" @click="copyText(p)">
			<text class="pwd-text">{{ p }}</text>
			<text class="pwd-copy">复制</text>
		</view>
		<view class="hint">点任意一条即可复制。密码只在本机生成，不会保存或上传。</view>
	</view>
</template>

<script>
	import { copyText, toast } from '../../utils/ui.js'

	const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	const LOWER = 'abcdefghijklmnopqrstuvwxyz'
	const DIGIT = '0123456789'
	const SYMBOL = '!@#$%^&*()-_=+[]{};:,.?'
	const SIMILAR = /[0O1lI|`'"]/g

	function randInt(max) {
		try {
			const c = typeof window !== 'undefined' ? window.crypto : null
			if (c && c.getRandomValues) {
				const a = new Uint32Array(1)
				c.getRandomValues(a)
				return a[0] % max
			}
		} catch (e) { /* 回退到普通随机 */ }
		return Math.floor(Math.random() * max)
	}

	export default {
		data() {
			return {
				len: 16, count: 5, useUpper: true, useLower: true,
				useDigit: true, useSymbol: false, noSimilar: true, list: []
			}
		},
		computed: {
			sets() {
				let arr = []
				if (this.useUpper) arr.push(UPPER)
				if (this.useLower) arr.push(LOWER)
				if (this.useDigit) arr.push(DIGIT)
				if (this.useSymbol) arr.push(SYMBOL)
				if (this.noSimilar) arr = arr.map(s => s.replace(SIMILAR, '')).filter(Boolean)
				return arr
			},
			poolSize() { return this.sets.join('').length },
			bits() { return Math.round(this.len * Math.log2(Math.max(2, this.poolSize))) }
		},
		mounted() { this.generate() },
		methods: {
			copyText,
			onLen(e) { this.len = Number(e.detail.value) },
			pick(pool) { return pool.charAt(randInt(pool.length)) },
			generate() {
				const sets = this.sets
				if (!sets.length) return toast('至少选择一种字符类型')
				const all = sets.join('')
				const out = []
				for (let k = 0; k < this.count; k++) {
					const chars = sets.map(s => this.pick(s))
					while (chars.length < this.len) chars.push(this.pick(all))
					for (let i = chars.length - 1; i > 0; i--) {
						const j = randInt(i + 1)
						const t = chars[i]; chars[i] = chars[j]; chars[j] = t
					}
					out.push(chars.join(''))
				}
				this.list = out
			}
		}
	}
</script>

<style scoped>
	.pwd {
		display: flex; justify-content: space-between; align-items: center;
		background: var(--input-bg); border-radius: 14rpx; padding: 20rpx; margin-bottom: 14rpx;
	}
	.pwd-text { font-size: 27rpx; word-break: break-all; flex: 1; letter-spacing: 1rpx; }
	.pwd-copy { color: var(--primary); font-size: 24rpx; margin-left: 20rpx; }
</style>
