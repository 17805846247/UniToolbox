<template>
	<view>
		<view class="card">
			<view class="card-title">图片 → Base64</view>
			<view class="row">
				<view class="btn btn-primary btn-sm" @click="choose">选择图片</view>
				<view class="btn btn-sm btn-ghost" @click="clearImage">清空</view>
			</view>
			<image v-if="src" :src="src" class="preview" mode="aspectFit" />
			<view class="kv" v-if="dataUrl"><text>DataURL 长度</text><text>{{ dataUrl.length }} 字符</text></view>
			<view class="kv" v-if="dataUrl"><text>约合大小</text><text>{{ approxSize }}</text></view>
			<view class="result result-clip" v-if="dataUrl">{{ dataUrl }}</view>
			<view class="row" style="margin-top:16rpx" v-if="dataUrl">
				<view class="btn btn-sm" @click="copyText(dataUrl)">复制 DataURL</view>
				<view class="btn btn-sm" @click="copyText(pureBase64)">复制纯 Base64</view>
			</view>
			<view class="hint">常用于把小图内嵌进 HTML / CSS / JSON；大图转出的文本可能很长，复制时请留意剪贴板限制。全程本地处理，不上传图片。</view>
		</view>

		<view class="card">
			<view class="card-title">Base64 → 图片</view>
			<view class="label">粘贴 DataURL 或纯 Base64 文本</view>
			<tb-textarea class="textarea" v-model="encoded" placeholder="data:image/png;base64,iVBORw0KGgo... 或直接粘贴 Base64 字符串" ></tb-textarea>
			<view class="row" style="margin-top:14rpx">
				<view class="btn btn-primary btn-sm" @click="decode">预览图片</view>
				<view class="btn btn-sm" @click="paste">从剪贴板粘贴</view>
				<view class="btn btn-sm btn-ghost" @click="encoded = ''; preview = ''">清空</view>
			</view>
			<image v-if="preview" :src="preview" class="preview" mode="aspectFit" />
			<view class="result" v-if="decodeError" style="color:var(--danger)">{{ decodeError }}</view>
			<view class="hint" v-if="preview">浏览器预览可长按图片另存；H5 端若无法显示，请检查是否带正确的 data:image 前缀。</view>
		</view>
	</view>
</template>

<script>
	import { toast, copyText } from '../../utils/ui.js'

	export default {
		data() {
			return { src: '', dataUrl: '', pureBase64: '', encoded: '', preview: '', decodeError: '' }
		},
		computed: {
			approxSize() {
				const n = Math.round(this.dataUrl.length * 0.75)
				return n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(2) + ' MB' : (n / 1024).toFixed(1) + ' KB'
			}
		},
		methods: {
			copyText,
			clearImage() { this.src = ''; this.dataUrl = ''; this.pureBase64 = '' },
			choose() {
				uni.chooseImage({
					count: 1, sourceType: ['album', 'camera'],
					success: r => {
						this.src = r.tempFilePaths[0]
						this.readAsDataUrl(this.src)
					},
					fail: () => toast('已取消选择')
				})
			},
			readAsDataUrl(path) {
				// #ifdef H5
				fetch(path)
					.then(res => res.blob())
					.then(blob => new Promise((resolve, reject) => {
						const fr = new FileReader()
						fr.onload = () => resolve(fr.result)
						fr.onerror = reject
						fr.readAsDataURL(blob)
					}))
					.then(data => this.setDataUrl(String(data)))
					.catch(() => toast('读取失败，请换一张图片'))
				// #endif
				// #ifdef APP-PLUS
				try {
					plus.io.resolveLocalFileSystemURL(path, entry => {
						entry.file(file => {
							const reader = new plus.io.FileReader()
							reader.onloadend = e => this.setDataUrl(String(e.target.result || ''))
							reader.onerror = () => toast('读取文件失败')
							reader.readAsDataURL(file)
						}, () => toast('读取文件失败'))
					}, () => toast('无法读取该文件'))
				} catch (e) { toast('当前环境不支持读取文件') }
				// #endif
			},
			setDataUrl(v) {
				this.dataUrl = v
				this.pureBase64 = v.indexOf(',') >= 0 ? v.split(',').slice(1).join(',') : v
				this.encoded = v
			},
			paste() {
				uni.getClipboardData({
					success: r => {
						this.encoded = (r && r.data) || ''
						if (this.encoded) this.decode()
					},
					fail: () => toast('无法读取剪贴板')
				})
			},
			decode() {
				const s = String(this.encoded || '').trim().replace(/\s/g, '')
				if (!s) { this.decodeError = '请先粘贴 Base64 文本'; this.preview = ''; return }
				if (s.indexOf('data:image/') === 0) { this.preview = s; this.decodeError = ''; return }
				if (!/^[A-Za-z0-9+/=]+$/.test(s) || s.length < 16) {
					this.decodeError = '内容不像有效的 Base64 图片数据'; this.preview = ''; return
				}
				this.preview = 'data:image/png;base64,' + s
				this.decodeError = ''
			}
		}
	}
</script>

<style scoped>
	.preview {
		width: 100%; height: 320rpx; background: var(--input-bg);
		border-radius: 16rpx; margin-top: 18rpx;
	}
	.result-clip { max-height: 200rpx; overflow: hidden; font-size: 21rpx; }
</style>
