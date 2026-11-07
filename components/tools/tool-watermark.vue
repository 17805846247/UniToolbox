<template>
	<view>
		<view class="card">
			<view class="card-title">1. 选择图片</view>
			<view class="row">
				<view class="btn btn-primary btn-sm" @click="choose">从相册选图</view>
				<view class="btn btn-sm btn-ghost" @click="src = ''; result = ''">清除</view>
			</view>
			<image v-if="src" :src="src" class="preview" mode="aspectFit" />
			<view class="hint" v-if="w">原图：{{ w }} × {{ h }} px</view>
		</view>

		<view class="card">
			<view class="card-title">2. 水印设置</view>
			<view class="label">水印文字</view>
			<tb-input class="input" v-model="text" placeholder="例如 © Ezer Zheng" />
			<view class="label">字号：<text style="color:var(--primary)">{{ fontSize }} px</text></view>
			<slider :value="fontSize" min="16" max="80" show-value activeColor="#4f6ef7" @change="onFont" block-size="22" />
			<view class="label">透明度：<text style="color:var(--primary)">{{ alpha }}</text></view>
			<slider :value="alpha * 100" min="10" max="100" show-value activeColor="#4f6ef7" @change="onAlpha" block-size="22" />
			<view class="label">位置</view>
			<view class="row">
				<view class="chip" v-for="p in positions" :key="p.k" :class="{ on: pos === p.k }" @click="pos = p.k">{{ p.n }}</view>
			</view>
			<view class="label">文字颜色</view>
			<view class="row">
				<view class="chip" v-for="c in colors" :key="c.k" :class="{ on: color === c.k }" @click="color = c.k">{{ c.n }}</view>
			</view>
			<view class="row" style="margin-top:22rpx">
				<view class="btn btn-primary grow" @click="draw">生成水印图片</view>
			</view>
			<view class="hint">平铺模式会在整张图上重复文字，适合版权保护；白底黑字在深色主题下也保持可扫描。</view>
		</view>

		<view class="card" v-if="result">
			<view class="card-title">生成结果</view>
			<image :src="result" class="preview" mode="aspectFit" />
			<view class="row" style="margin-top:14rpx">
				<view class="btn btn-sm btn-primary" @click="save">保存到相册</view>
			</view>
			<view class="hint">浏览器预览可长按图片另存为；真机可直接保存到相册。</view>
		</view>

		<view class="canvas-holder">
			<canvas canvas-id="wmCanvas" :style="canvasStyle"></canvas>
		</view>
	</view>
</template>

<script>
	import { toast, ok } from '../../utils/ui.js'

	export default {
		data() {
			return {
				src: '', result: '', text: '© 口袋工具箱', fontSize: 36, alpha: 0.45,
				pos: 'tile', color: 'white', w: 0, h: 0,
				positions: [{ k: 'tile', n: '平铺' }, { k: 'center', n: '居中' }, { k: 'corner', n: '右下角' }],
				colors: [{ k: 'white', n: '白色' }, { k: 'black', n: '黑色' }, { k: 'red', n: '红色' }]
			}
		},
		computed: {
			canvasStyle() { return { width: (this.w || 300) + 'px', height: (this.h || 300) + 'px' } }
		},
		methods: {
			onFont(e) { this.fontSize = Number(e.detail.value) },
			onAlpha(e) { this.alpha = Number(e.detail.value) / 100 },
			choose() {
				uni.chooseImage({
					count: 1, sourceType: ['album', 'camera'],
					success: r => {
						this.src = r.tempFilePaths[0]; this.result = ''
						uni.getImageInfo({
							src: this.src,
							success: img => { this.w = img.width; this.h = img.height },
							fail: () => toast('读取图片信息失败')
						})
					},
					fail: () => toast('已取消选择')
				})
			},
			draw() {
				if (!this.src) return toast('请先选择图片')
				if (!this.text) return toast('请输入水印文字')
				uni.getImageInfo({
					src: this.src,
					success: img => {
						let w = img.width, h = img.height
						if (Math.max(w, h) > 1600) {
							const s = 1600 / Math.max(w, h)
							w = Math.round(w * s); h = Math.round(h * s)
						}
						this.w = w; this.h = h
						this.$nextTick(() => this.paint())
					},
					fail: () => toast('读取图片信息失败')
				})
			},
			paint() {
				const w = this.w, h = this.h
				const size = Math.max(14, Math.min(90, Math.round(this.fontSize * Math.min(w, h) / 900)))
				const ctx = uni.createCanvasContext('wmCanvas', this)
				ctx.drawImage(this.src, 0, 0, w, h)
				ctx.setGlobalAlpha(this.alpha)
				ctx.setFillStyle(this.color === 'white' ? '#ffffff' : (this.color === 'red' ? '#ff3b30' : '#111111'))
				ctx.setFontSize(size)
				const textW = this.text.length * size * 0.9
				if (this.pos === 'center') {
					ctx.fillText(this.text, (w - textW) / 2, h / 2)
				} else if (this.pos === 'corner') {
					ctx.fillText(this.text, Math.max(8, w - textW - size), h - size)
				} else {
					const stepX = textW + size * 2
					const stepY = size * 4
					for (let y = size * 2; y < h; y += stepY) {
						for (let x = -stepX; x < w + stepX; x += stepX) ctx.fillText(this.text, x, y)
					}
				}
				ctx.draw(false, () => {
					uni.canvasToTempFilePath({
						canvasId: 'wmCanvas', x: 0, y: 0, width: w, height: h,
						destWidth: w, destHeight: h, fileType: 'png',
						success: res => { this.result = res.tempFilePath; ok('水印已生成') },
						fail: () => toast('生成失败，请换一张图片重试')
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
