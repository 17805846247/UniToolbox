<template>
	<view class="card">
		<view class="card-title">1. 选择图片</view>
		<view class="row">
			<view class="btn btn-primary" @click="choose">从相册选图</view>
			<view class="btn btn-ghost" @click="src = ''; result = ''">清除</view>
		</view>
		<image v-if="src" :src="src" class="preview" mode="aspectFit" />
		<view class="hint" v-if="origin.w">原图：{{ origin.w }} × {{ origin.h }} px</view>
	</view>

	<view class="card">
		<view class="card-title">2. 转换参数</view>
		<view class="label">目标格式</view>
		<view class="row">
			<view class="chip" v-for="f in formats" :key="f" :class="{ on: format === f }" @click="format = f">{{ f.toUpperCase() }}</view>
		</view>
		<view class="label">最大边长：<text style="color:var(--primary)">{{ maxSide }} px</text>（0 = 保持原图）</view>
		<slider :value="maxSide" min="0" max="2000" step="100" show-value activeColor="#4f6ef7" @change="onMax" block-size="22" />
		<view class="label">压缩质量：<text style="color:var(--primary)">{{ quality }}</text>（JPG / WEBP 有效）</view>
		<slider :value="quality * 100" min="10" max="100" show-value activeColor="#4f6ef7" @change="onQuality" block-size="22" />
		<view class="row" style="margin-top: 20rpx">
			<view class="btn btn-primary grow" @click="convert">开始转换</view>
		</view>
		<view class="hint">PNG 无损、支持透明；JPG 体积小但会丢失透明通道；WEBP 在部分设备上可能不被支持。</view>
	</view>

	<view class="card" v-if="result">
		<view class="card-title">转换结果（{{ outW }} × {{ outH }}）</view>
		<image :src="result" class="preview" mode="aspectFit" />
		<view class="row" style="margin-top: 12rpx">
			<view class="btn btn-sm btn-primary" @click="save">保存到相册</view>
			<view class="btn btn-sm" @click="copyBase64">复制为 Base64</view>
		</view>
		<view class="hint">浏览器预览时可长按图片另存为；Base64 结果可直接贴到代码里。</view>
	</view>

	<view class="canvas-holder">
		<canvas canvas-id="imgCanvas" :style="canvasStyle"></canvas>
	</view>
</template>

<script>
	import { toast, ok, copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				src: '', result: '', format: 'png', maxSide: 0, quality: 0.9,
				origin: { w: 0, h: 0 }, outW: 0, outH: 0,
				formats: ['png', 'jpg', 'webp']
			}
		},
		computed: {
			canvasStyle() {
				return { width: (this.outW || 300) + 'px', height: (this.outH || 300) + 'px' }
			}
		},
		methods: {
			copyText,
			onMax(e) { this.maxSide = Number(e.detail.value) },
			onQuality(e) { this.quality = Number(e.detail.value) / 100 },
			choose() {
				uni.chooseImage({
					count: 1, sourceType: ['album', 'camera'],
					success: r => {
						this.src = r.tempFilePaths[0]
						this.result = ''
						uni.getImageInfo({
							src: this.src,
							success: img => { this.origin = { w: img.width, h: img.height } },
							fail: () => { this.origin = { w: 0, h: 0 } }
						})
					},
					fail: () => toast('已取消选择')
				})
			},
			convert() {
				if (!this.src) return toast('请先选择图片')
				uni.getImageInfo({
					src: this.src,
					success: img => {
						let w = img.width, h = img.height
						if (this.maxSide > 0 && Math.max(w, h) > this.maxSide) {
							const s = this.maxSide / Math.max(w, h)
							w = Math.max(1, Math.round(w * s))
							h = Math.max(1, Math.round(h * s))
						}
						if (w > 1600 || h > 1600) { const s = 1600 / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s) }
						this.outW = w; this.outH = h
						this.origin = { w: img.width, h: img.height }
						this.$nextTick(() => this.draw())
					},
					fail: () => toast('读取图片信息失败')
				})
			},
			draw() {
				const ctx = uni.createCanvasContext('imgCanvas', this)
				if (this.format !== 'png') {
					ctx.setFillStyle('#ffffff')
					ctx.fillRect(0, 0, this.outW, this.outH)
				} else {
					ctx.clearRect(0, 0, this.outW, this.outH)
				}
				ctx.drawImage(this.src, 0, 0, this.outW, this.outH)
				ctx.draw(false, () => {
					uni.canvasToTempFilePath({
						canvasId: 'imgCanvas', x: 0, y: 0,
						width: this.outW, height: this.outH,
						destWidth: this.outW, destHeight: this.outH,
						fileType: this.format, quality: this.quality,
						success: res => { this.result = res.tempFilePath; ok('转换完成') },
						fail: () => toast('转换失败：该格式可能不被当前平台支持')
					}, this)
				})
			},
			save() {
				if (!this.result) return
				uni.saveImageToPhotosAlbum({
					filePath: this.result,
					success: () => ok('已保存到相册'),
					fail: () => toast('保存失败，可长按图片保存')
				})
			},
			copyBase64() {
				if (!this.result) return
				// #ifdef H5
				toast('浏览器预览请长按图片另存；真机可保存相册')
				// #endif
				// #ifdef APP-PLUS
				try {
					const reader = new plus.io.FileReader()
					plus.io.resolveLocalFileSystemURL(this.result, entry => {
						entry.file(file => {
							reader.onloadend = e => copyText(String(e.target.result || '').split(',')[1] || '')
							reader.readAsDataURL(file)
						}, () => toast('读取文件失败'))
					}, () => toast('无法读取转换结果'))
				} catch (e) { toast('当前环境不支持') }
				// #endif
			}
		}
	}
</script>

<style scoped>
	.preview {
		width: 100%; height: 360rpx; background: var(--input-bg);
		border-radius: 16rpx; margin-top: 18rpx;
	}
	.canvas-holder { position: fixed; left: 0; top: 0; opacity: 0; pointer-events: none; z-index: -1; }
</style>
