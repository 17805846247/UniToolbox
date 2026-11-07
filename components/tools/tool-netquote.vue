<template>
	<tb-net-gate>
		<view class="card">
			<view class="card-title">每日一言</view>
			<view class="quote-box">
				<view class="quote-mark">“</view>
				<view class="quote-text">{{ quote.text || (loading ? '正在获取…' : '点下方按钮，取一句话') }}</view>
				<view class="quote-from" v-if="quote.from">— {{ quote.from }}</view>
			</view>
			<view class="row" style="margin-top: 24rpx">
				<view class="btn btn-primary" @click="load">{{ loading ? '获取中…' : '换一句' }}</view>
				<view class="btn" @click="copyText(quote.text)">复制</view>
				<view class="btn btn-ghost" @click="fav">收藏</view>
			</view>
			<view class="hint">文案来自公开的一言接口，仅在你点击时请求；不会上传任何本地内容。</view>
		</view>

		<view class="card" v-if="error">
			<view class="hint" style="color: var(--danger)">{{ error }}</view>
		</view>

		<view class="card">
			<view class="card-title">我的收藏（{{ favs.length }}）</view>
			<view class="fav-item" v-for="(f, i) in favs" :key="i" @click="copyText(f.text)">
				<view class="fav-text">{{ f.text }}</view>
				<view class="fav-from">{{ f.from || '未知来源' }}</view>
			</view>
			<view v-if="!favs.length" class="empty">还没有收藏，喜欢的句子点「收藏」保存</view>
			<view class="btn btn-sm btn-ghost" style="margin-top: 12rpx" @click="clearFavs">清空收藏</view>
		</view>
	</tb-net-gate>
</template>

<script>
	import TbNetGate from '../ui/tb-net-gate.vue'
	import { fetchSource } from '../../utils/net.js'
	import { copyText, toast } from '../../utils/ui.js'

	const KEY = 'tb_quote_favs'

	export default {
		components: { TbNetGate },
		data() { return { quote: { text: '', from: '' }, favs: [], loading: false, error: '' } },
		mounted() {
			try {
				const f = uni.getStorageSync(KEY)
				this.favs = Array.isArray(f) ? f : []
			} catch (e) { this.favs = [] }
		},
		methods: {
			copyText,
			async load() {
				if (this.loading) return
				this.loading = true; this.error = ''
				try { this.quote = (await fetchSource('quote')).data }
				catch (e) { this.error = e.message; toast('获取失败') }
				finally { this.loading = false }
			},
			fav() {
				if (!this.quote.text) return toast('先取一句话吧')
				if (this.favs.some(f => f.text === this.quote.text)) return toast('已经收藏过了')
				this.favs = [{ text: this.quote.text, from: this.quote.from }].concat(this.favs).slice(0, 30)
				try { uni.setStorageSync(KEY, this.favs) } catch (e) {}
				toast('已收藏')
			},
			clearFavs() {
				this.favs = []
				try { uni.setStorageSync(KEY, []) } catch (e) {}
				toast('已清空')
			}
		}
	}
</script>

<style scoped>
	.quote-box {
		background: var(--input-bg); border-radius: var(--radius-sm);
		padding: 34rpx 30rpx; min-height: 200rpx;
	}
	.quote-mark { font-size: 64rpx; color: var(--primary); line-height: 1; opacity: .5; }
	.quote-text { font-size: 30rpx; color: var(--text); line-height: 1.9; margin-top: 8rpx; }
	.quote-from { font-size: 24rpx; color: var(--text-3); text-align: right; margin-top: 22rpx; }
	.fav-item { padding: 18rpx 0; border-bottom: 1rpx solid var(--line); }
	.fav-text { font-size: 26rpx; color: var(--text); line-height: 1.7; }
	.fav-from { font-size: 22rpx; color: var(--text-3); text-align: right; margin-top: 8rpx; }
</style>
