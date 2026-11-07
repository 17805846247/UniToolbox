<template>
	<view class="card">
		<view class="card-title">二维码内容</view>
		<tb-textarea class="textarea" v-model="text" placeholder="输入文字、网址或联系方式，支持中文" ></tb-textarea>
		<view class="label">纠错级别（越高越抗污损，图案越密）</view>
		<view class="row">
			<view class="chip" v-for="l in levels" :key="l.key" :class="{ on: level === l.key }" @click="level = l.key">{{ l.key }}</view>
		</view>
		<view class="row" style="margin-top: 20rpx">
			<view class="btn btn-primary grow" @click="draw">生成二维码</view>
			<view class="btn" @click="text = ''; imgPath = ''">清空</view>
		</view>
		<view class="hint">完全离线生成，无需联网；内容建议不超过 500 字。</view>
	</view>

	<view class="card" v-if="imgPath">
		<view class="card-title">生成结果（{{ size }} × {{ size }} px）</view>
		<view class="qr-box">
			<image :src="imgPath" class="qr-img" mode="aspectFit" />
		</view>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm btn-primary" @click="save">保存到相册</view>
			<view class="btn btn-sm" @click="draw">重新生成</view>
		</view>
		<view class="hint">浏览器预览时请长按图片保存；App 端点「保存到相册」。</view>
	</view>

	<view class="canvas-holder">
		<canvas canvas-id="qrCanvas" style="width: 300px; height: 300px"></canvas>
	</view>
</template>

<script>
	import { createQrMatrix } from '../../utils/qrcode.js'
	import { toast, ok } from '../../utils/ui.js'

	export default {
		data() {
			return {
				text: '', level: 'M', size: 300, imgPath: '',
				levels: [{ key: 'L' }, { key: 'M' }, { key: 'Q' }, { key: 'H' }]
			}
		},
		mounted() {
			let prefill = ''
			try { prefill = uni.getStorageSync('tb_qr_prefill') || '' } catch (e) {}
			if (prefill) {
				this.text = prefill
				try { uni.removeStorageSync('tb_qr_prefill') } catch (e) {}
			} else {
				this.text = '口袋工具箱 · 离线小工具'
			}
			this.$nextTick(() => this.draw())
		},
		methods: {
			draw() {
				if (!this.text) return toast('请先输入内容')
				if (this.text.length > 500) return toast('内容太长了，请精简到 500 字以内')
				try {
					const m = createQrMatrix(this.text, this.level)
					const n = m.length, quiet = 4
					const cell = this.size / (n + quiet * 2)
					const ctx = uni.createCanvasContext('qrCanvas', this)
					ctx.setFillStyle('#ffffff')
					ctx.fillRect(0, 0, this.size, this.size)
					ctx.setFillStyle('#111827')
					for (let r = 0; r < n; r++) {
						for (let c = 0; c < n; c++) {
							if (m[r][c]) ctx.fillRect((c + quiet) * cell, (r + quiet) * cell, cell + 0.6, cell + 0.6)
						}
					}
					ctx.draw(false, () => {
						uni.canvasToTempFilePath({
							canvasId: 'qrCanvas', fileType: 'png', quality: 1,
							success: res => { this.imgPath = res.tempFilePath; ok('生成成功') },
							fail: () => toast('图片导出失败，请在真机上运行')
						}, this)
					})
				} catch (e) { toast('生成失败：' + e.message) }
			},
			save() {
				if (!this.imgPath) return
				uni.saveImageToPhotosAlbum({
					filePath: this.imgPath,
					success: () => ok('已保存到相册'),
					fail: () => toast('保存失败，可长按图片保存')
				})
			}
		}
	}
</script>

<style scoped>
	.qr-box { display: flex; justify-content: center; padding: 16rpx; background: var(--card); }
	.qr-img { width: 480rpx; height: 480rpx; }
	.canvas-holder { position: fixed; left: 0; top: 0; width: 300px; height: 300px; opacity: 0; pointer-events: none; z-index: -1; }
</style>
