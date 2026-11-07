<template>
	<view class="card">
		<view class="card-title">JWT Token</view>
		<tb-textarea class="textarea" v-model="token" placeholder="粘贴 eyJ... 三段式 token，支持 Bearer 前缀" ></tb-textarea>
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-sm btn-primary" @click="run">解码</view>
			<view class="btn btn-sm" @click="sample">填入示例</view>
			<view class="btn btn-sm btn-ghost" @click="token = ''; data = null; error = ''">清空</view>
		</view>
		<view class="hint">仅在本地做 Base64Url 解码，<text style="color: var(--danger)">不校验签名</text>，因此无法判断 token 是否被篡改；请勿在此粘贴生产环境的高权限密钥。</view>
	</view>

	<view class="card" v-if="error">
		<view class="card-title">解析失败</view>
		<view class="hint" style="color: var(--danger)">{{ error }}</view>
	</view>

	<view v-if="data">
		<view class="card">
			<view class="card-title">Header</view>
			<view class="result">{{ headerJson }}</view>
		</view>
		<view class="card">
			<view class="card-title">Payload</view>
			<view class="result">{{ payloadJson }}</view>
			<view class="row" style="margin-top: 12rpx">
				<view class="btn btn-sm" @click="copyText(payloadJson)">复制 Payload</view>
			</view>
		</view>
		<view class="card">
			<view class="card-title">时间与签名</view>
			<view class="kv" v-for="r in facts" :key="r.k"><text>{{ r.k }}</text><text>{{ r.v }}</text></view>
		</view>
	</view>
</template>

<script>
	import { decodeJwt } from '../../utils/format-extra.js'
	import { copyText } from '../../utils/ui.js'

	const b64 = o => {
		const s = JSON.stringify(o)
		const bytes = []
		for (let i = 0; i < s.length; i++) {
			const c = s.charCodeAt(i)
			if (c < 128) bytes.push(c)
			else if (c < 2048) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63))
			else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
		}
		const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
		let out = ''
		for (let i = 0; i < bytes.length; i += 3) {
			const b0 = bytes[i], b1 = bytes[i + 1] || 0, b2 = bytes[i + 2] || 0
			const n = (b0 << 16) | (b1 << 8) | b2
			out += A[(n >> 18) & 63] + A[(n >> 12) & 63] + (i + 1 < bytes.length ? A[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? A[n & 63] : '=')
		}
		return out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
	}
	const fmt = ts => {
		const d = new Date(ts * 1000), p = n => ('0' + n).slice(-2)
		return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
	}

	export default {
		data() { return { token: '', data: null, error: '' } },
		computed: {
			headerJson() { return this.data ? JSON.stringify(this.data.header, null, 2) : '' },
			payloadJson() { return this.data ? JSON.stringify(this.data.payload, null, 2) : '' },
			facts() {
				if (!this.data) return []
				const p = this.data.payload || {}
				const rows = []
				if (p.iat) rows.push({ k: '签发时间 iat', v: fmt(p.iat) })
				if (p.exp) {
					rows.push({ k: '过期时间 exp', v: fmt(p.exp) })
					rows.push({ k: '当前状态', v: Date.now() < p.exp * 1000 ? '未过期' : '已过期' })
				}
				if (p.nbf) rows.push({ k: '生效时间 nbf', v: fmt(p.nbf) })
				rows.push({ k: '签名长度', v: this.data.signature.length + ' 字符（未验证）' })
				return rows
			}
		},
		mounted() { this.sample() },
		methods: {
			copyText,
			run() {
				try { this.data = decodeJwt(this.token); this.error = '' }
				catch (e) { this.error = e.message; this.data = null }
			},
			sample() {
				const now = Math.floor(Date.now() / 1000)
				this.token = 'Bearer ' + b64({ alg: 'HS256', typ: 'JWT' }) + '.' +
					b64({ sub: '口袋工具箱', name: '演示用户', iat: now - 3600, exp: now + 86400, role: 'demo' }) + '.demo-signature-not-verified'
				this.run()
			}
		}
	}
</script>
