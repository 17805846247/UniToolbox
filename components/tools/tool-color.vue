<template>
	<view class="card">
		<view class="card-title">颜色值</view>
		<tb-input class="input" v-model="input" placeholder="输入 var(--primary) 或 rgb(79,110,247)" />
		<view class="preview" :style="{ background: info ? info.preview : 'var(--line)' }">
			<text :style="{ color: light ? '#333' : 'var(--card)' }">{{ info ? info.hex : '颜色预览' }}</text>
		</view>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm" @click="random">随机颜色</view>
			<view class="btn btn-sm btn-ghost" @click="input = 'var(--primary)'">重置</view>
		</view>
		<view class="label">快捷取色</view>
		<view class="row">
			<view class="swatch" v-for="c in presets" :key="c" :style="{ background: c }" @click="input = c"></view>
		</view>
		<view class="divider"></view>
		<view v-if="info">
			<view class="kv"><text>HEX</text><text>{{ info.hex }}</text></view>
			<view class="kv"><text>RGB</text><text>{{ info.rgb }}</text></view>
			<view class="kv"><text>HSL</text><text>{{ info.hsl }}</text></view>
			<view class="kv"><text>十进制</text><text>{{ info.decimal }}</text></view>
			<view class="row" style="margin-top: 16rpx">
				<view class="btn btn-sm" @click="copyText(info.hex)">复制 HEX</view>
				<view class="btn btn-sm" @click="copyText(info.rgb)">复制 RGB</view>
				<view class="btn btn-sm" @click="copyText(info.hsl)">复制 HSL</view>
			</view>
		</view>
		<view v-else class="hint" style="color:var(--danger)">无法识别该颜色，请输入 #RGB、#RRGGBB 或 rgb(r,g,b)</view>
		<view class="hint">常用于写 App 主题色、CSS 样式；HEX 支持 3 位缩写。</view>
	</view>
</template>

<script>
	import { colorInfo } from '../../utils/convert.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				input: 'var(--primary)',
				presets: ['var(--primary)', '#16A06A', '#E8813A', 'var(--danger)', '#8B5CF6', '#EC4899', '#0EA5E9', '#F5B301', 'var(--text)', 'var(--card)']
			}
		},
		computed: {
			info() {
				try { return colorInfo(this.input) } catch (e) { return null }
			},
			light() {
				if (!this.info) return true
				const h = this.info.hex.slice(1)
				const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
				return (r * 299 + g * 587 + b * 114) / 1000 > 150
			}
		},
		methods: {
			copyText,
			random() {
				const n = Math.floor(Math.random() * 0xffffff)
				this.input = '#' + ('000000' + n.toString(16)).slice(-6).toUpperCase()
			}
		}
	}
</script>

<style scoped>
	.preview {
		height: 180rpx; border-radius: 20rpx; margin-top: 20rpx;
		display: flex; align-items: center; justify-content: center;
		font-size: 32rpx; font-weight: 600; letter-spacing: 2rpx;
	}
	.swatch {
		width: 64rpx; height: 64rpx; border-radius: 16rpx; margin: 8rpx 14rpx 8rpx 0;
		border: 1rpx solid rgba(0, 0, 0, 0.06);
	}
</style>
