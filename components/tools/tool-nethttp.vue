<template>
	<tb-net-gate>
		<view class="card">
			<view class="card-title">请求配置</view>
			<view class="row">
				<view class="chip" v-for="m in methods" :key="m" :class="{ on: method === m }" @click="method = m">{{ m }}</view>
			</view>
			<view class="label">URL</view>
			<tb-input class="input" v-model="url" placeholder="https://httpbin.org/get" />
			<view class="label">请求头（每行一条，格式 Key: Value）</view>
			<tb-textarea class="textarea" style="height: 150rpx" v-model="headers" placeholder="Accept: application/json" ></tb-textarea>
			<view class="label" v-if="method !== 'GET' && method !== 'HEAD'">请求体 Body</view>
			<tb-textarea v-if="method !== 'GET' && method !== 'HEAD'" class="textarea" style="height: 180rpx" v-model="body" placeholder='{"name":"test"}' ></tb-textarea>
			<view class="row" style="margin-top: 18rpx">
				<view class="btn btn-primary" @click="send">{{ loading ? '请求中…' : '发送请求' }}</view>
				<view class="btn btn-ghost" @click="reset">重置</view>
			</view>
			<view class="hint">8 秒超时；请求由你主动点击触发。App 端无跨域限制，H5 端受浏览器 CORS 约束，跨域失败可换支持 CORS 的接口。</view>
		</view>

		<view class="card" v-if="error">
			<view class="card-title">请求失败</view>
			<view class="hint" style="color: var(--danger)">{{ error }}</view>
		</view>

		<view class="card" v-if="res">
			<view class="card-title">响应</view>
			<view class="kv"><text>状态码</text><text :style="{ color: res.status >= 200 && res.status < 300 ? 'var(--ok)' : 'var(--danger)' }">{{ res.status }}</text></view>
			<view class="kv"><text>耗时</text><text>{{ res.elapsed }} ms</text></view>
			<view class="kv"><text>响应大小</text><text>{{ res.size }} 字符</text></view>
			<view class="label">响应头</view>
			<view class="result" style="max-height: 200rpx; overflow: auto">{{ headersText }}</view>
			<view class="label">响应正文（JSON 自动美化）</view>
			<view class="result" style="max-height: 460rpx; overflow: auto">{{ res.text }}</view>
			<view class="row" style="margin-top: 14rpx">
				<view class="btn btn-sm" @click="copyText(res.text)">复制正文</view>
			</view>
		</view>
	</tb-net-gate>
</template>

<script>
	import TbNetGate from '../ui/tb-net-gate.vue'
	import { httpDebug } from '../../utils/net.js'
	import { copyText, toast } from '../../utils/ui.js'

	export default {
		components: { TbNetGate },
		data() {
			return {
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
				method: 'GET',
				url: 'https://httpbin.org/get',
				headers: 'Accept: application/json',
				body: '',
				loading: false, error: '', res: null
			}
		},
		computed: {
			headersText() {
				const h = this.res ? this.res.headers : {}
				const keys = Object.keys(h || {})
				return keys.length ? keys.map(k => k + ': ' + h[k]).join('\n') : '（无响应头）'
			}
		},
		methods: {
			copyText,
			parseHeaders() {
				const h = {}
				for (const line of String(this.headers || '').split('\n')) {
					const i = line.indexOf(':')
					if (i > 0) h[line.slice(0, i).trim()] = line.slice(i + 1).trim()
				}
				return h
			},
			async send() {
				if (this.loading) return
				if (!/^https?:\/\//i.test(this.url.trim())) return toast('请填写 http(s) 开头的地址')
				this.loading = true; this.error = ''; this.res = null
				try {
					const opts = { url: this.url.trim(), method: this.method, header: this.parseHeaders() }
					if (this.method !== 'GET' && this.method !== 'HEAD' && this.body) opts.data = this.body
					this.res = await httpDebug(opts)
				} catch (e) { this.error = e.message }
				finally { this.loading = false }
			},
			reset() {
				this.method = 'GET'; this.url = 'https://httpbin.org/get'
				this.headers = 'Accept: application/json'; this.body = ''
				this.error = ''; this.res = null
			}
		}
	}
</script>
