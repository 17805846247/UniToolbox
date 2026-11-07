<template>
	<view class="card">
		<view class="card-title">相机扫码</view>
		<view class="hint">调用系统相机识别二维码 / 条形码，结果只在本机显示与保存，不会上传。</view>
		<view class="row" style="margin-top: 24rpx">
			<view class="btn btn-primary" @click="scan">开始扫码</view>
			<view class="btn btn-ghost" @click="fromClipboard">从剪贴板读取</view>
		</view>
		<view class="hint" style="margin-top: 20rpx">H5 预览环境没有相机能力，请「运行到手机」或打包 APK 后使用真机。</view>
	</view>

	<view class="card" v-if="result">
		<view class="card-title">本次识别结果</view>
		<view class="result">{{ result }}</view>
		<view class="row" style="margin-top: 14rpx">
			<view class="btn btn-sm btn-primary" @click="copyText(result)">复制内容</view>
			<view class="btn btn-sm" @click="openLink">如果是网址则打开</view>
			<view class="btn btn-sm btn-ghost" @click="toQr">生成二维码</view>
		</view>
	</view>

	<view class="card">
		<view class="card-title">识别历史（{{ history.length }}）</view>
		<view class="kv" v-for="(h, i) in history" :key="i" @click="result = h">
			<text>{{ h.slice(0, 26) }}{{ h.length > 26 ? '…' : '' }}</text>
			<text>点击载入</text>
		</view>
		<view v-if="!history.length" class="empty">还没有扫码记录</view>
		<view class="btn btn-sm btn-ghost" style="margin-top: 12rpx" @click="clearHistory">清空历史</view>
	</view>
</template>

<script>
	import { copyText, toast, confirm } from '../../utils/ui.js'

	const KEY = 'tb_scan_history'

	export default {
		data() { return { result: '', history: [] } },
		mounted() { this.loadHistory() },
		methods: {
			copyText,
			loadHistory() {
				try {
					const h = uni.getStorageSync(KEY)
					this.history = Array.isArray(h) ? h : []
				} catch (e) { this.history = [] }
			},
			push(text) {
				if (!text) return
				this.result = text
				this.history = [text].concat(this.history.filter(x => x !== text)).slice(0, 10)
				try { uni.setStorageSync(KEY, this.history) } catch (e) {}
			},
			scan() {
				// #ifdef APP-PLUS
				uni.scanCode({
					scanType: ['qrCode', 'barCode'],
					success: r => { this.push(r.result); toast('识别成功') },
					fail: () => toast('已取消或相机不可用')
				})
				// #endif
				// #ifdef H5
				uni.showToast({ title: 'H5 预览不支持相机，请运行到手机', icon: 'none' })
				// #endif
			},
			async fromClipboard() {
				try {
					const r = await uni.getClipboardData()
					const t = r && r.data ? r.data : ''
					if (!t) return toast('剪贴板是空的')
					this.push(t)
				} catch (e) { toast(e.message || '读取失败') }
			},
			openLink() {
				if (!/^https?:\/\//i.test(this.result)) return toast('内容不是 http 网址')
				// #ifdef APP-PLUS
				plus.runtime.openURL(this.result)
				// #endif
				// #ifdef H5
				window.open(this.result, '_blank')
				// #endif
			},
			toQr() {
				try { uni.setStorageSync('tb_qr_prefill', this.result) } catch (e) {}
				uni.navigateTo({ url: '/pages/tool/tool?key=qrcode' })
			},
			async clearHistory() {
				if (!await confirm('确定清空全部扫码历史？')) return
				this.history = []
				try { uni.setStorageSync(KEY, []) } catch (e) {}
				toast('已清空')
			}
		}
	}
</script>
