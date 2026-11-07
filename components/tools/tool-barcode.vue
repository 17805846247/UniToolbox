<template>
	<view>
		<view class="card">
			<view class="card-title">EAN-13 商品条码</view>
			<view class="label">12 位或 13 位数字（留 12 位自动计算校验位）</view>
			<tb-input class="input" v-model="digits" type="number" placeholder="例如 400638133393" />
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm" @click="digits = '400638133393'">示例商品码</view>
				<view class="btn btn-sm" @click="randomDigits">随机 12 位</view>
			</view>
			<view class="hint">EAN-13 是零售商品最常用的条码标准，末位为校验位；本工具纯本地编码与绘制，不联网、不查询商品库。</view>
		</view>

		<view class="card" v-if="encoded">
			<view class="card-title">生成结果</view>
			<view class="barcode-box">
				<canvas canvas-id="barCanvas" :style="canvasStyle"></canvas>
			</view>
			<view class="hint" style="text-align:center">支持标准扫码枪 / 手机相机识别</view>
			<view class="divider"></view>
			<view class="kv"><text>完整条码</text><text>{{ encoded.digits }}</text></view>
			<view class="kv"><text>校验位</text><text>{{ encoded.checkDigit }}（{{ encoded.valid ? '正确' : '与输入不符' }}）</text></view>
			<view class="kv"><text>模块数</text><text>{{ encoded.modules }} 模块</text></view>
			<view class="row" style="margin-top:18rpx">
				<view class="btn btn-sm btn-primary" @click="save">保存条码图片</view>
				<view class="btn btn-sm" @click="copyText(encoded.digits)">复制数字</view>
			</view>
		</view>
		<view class="card" v-if="error"><view class="hint" style="color:var(--danger)">{{ error }}</view></view>
	</view>
</template>

<script>
	import { ean13Encode } from '../../utils/devkit.js'
	import { toast, ok, copyText } from '../../utils/ui.js'

	const MODULE = 3
	const WIDTH = 95 * MODULE + 40
	const HEIGHT = 170
	export default {
		data() {
			return { digits: '400638133393', tempFile: '', error: '' }
		},
		computed: {
			encoded() {
				try { this.error = ''; return ean13Encode(this.digits) }
				catch (e) { this.error = e.message; return null }
			},
			canvasStyle() { return { width: WIDTH + 'px', height: HEIGHT + 'px' } }
		},
		mounted() { this.$nextTick(() => this.draw()) },
		watch: { digits: function () { this.$nextTick(() => this.draw()) } },
		methods: {
			copyText,
			randomDigits() {
				let s = '69'
				for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10)
				this.digits = s
			},
			draw() {
				const e = this.encoded
				if (!e) return
				const ctx = uni.createCanvasContext('barCanvas', this)
				ctx.setFillStyle('#ffffff')
				ctx.fillRect(0, 0, WIDTH, HEIGHT)
				ctx.setFillStyle('#000000')
				for (let i = 0; i < e.bits.length; i++) {
					if (e.bits.charAt(i) === '1') ctx.fillRect(20 + i * MODULE, 16, MODULE, 112)
				}
				ctx.setFontSize(18)
				ctx.setFillStyle('#111111')
				ctx.fillText(e.digits.charAt(0), 4, 154)
				ctx.fillText(e.digits.slice(1, 7), 26, 154)
				ctx.fillText(e.digits.slice(7), 20 + 48 * MODULE, 154)
				ctx.draw(false, () => {
					uni.canvasToTempFilePath({
						canvasId: 'barCanvas', x: 0, y: 0, width: WIDTH, height: HEIGHT,
						destWidth: WIDTH * 2, destHeight: HEIGHT * 2, fileType: 'png',
						success: res => { this.tempFile = res.tempFilePath },
						fail: () => {}
					}, this)
				})
			},
			save() {
				if (!this.tempFile) return toast('条码还在生成，请稍候')
				uni.saveImageToPhotosAlbum({
					filePath: this.tempFile,
					success: () => ok('已保存到相册'),
					fail: () => toast('保存失败，可长按条码图片保存')
				})
			}
		}
	}
</script>

<style scoped>
	.barcode-box {
		background: #ffffff; border-radius: 16rpx; padding: 16rpx 0;
		display: flex; align-items: center; justify-content: center; overflow: hidden;
	}
</style>
