<template>
	<tb-net-gate>
		<view class="card">
			<view class="card-title">网络状态</view>
			<view class="row" style="margin-top: 12rpx">
				<view class="btn btn-primary" @click="refresh">{{ loading ? '获取中…' : '重新获取' }}</view>
			</view>
			<view class="hint">会请求公开接口获取当前公网出口 IP 与标准时间，结果只在本机展示，不保存、不上传。</view>
		</view>

		<view class="card" v-if="info">
			<view class="card-title">连接信息</view>
			<view class="kv"><text>网络类型</text><text>{{ typeName }}</text></view>
			<view class="kv"><text>联网功能</text><text>已开启</text></view>
			<view class="kv"><text>本机时间</text><text>{{ localTime }}</text></view>
		</view>

		<view class="card" v-if="info && info.ip">
			<view class="card-title">公网 IP（来源：{{ info.ip.source }}）</view>
			<view class="kv"><text>IP 地址</text><text>{{ info.ip.data.ip || '—' }}</text></view>
			<view class="kv"><text>城市 / 地区</text><text>{{ [info.ip.data.city, info.ip.data.region].filter(Boolean).join(' · ') || '—' }}</text></view>
			<view class="kv"><text>国家 / 地区</text><text>{{ info.ip.data.country || '—' }}</text></view>
			<view class="kv"><text>网络服务商</text><text>{{ info.ip.data.org || '—' }}</text></view>
			<view class="btn btn-sm" style="margin-top: 14rpx" @click="copyText(info.ip.data.ip)">复制 IP</view>
		</view>

		<view class="card" v-if="info && info.time">
			<view class="card-title">网络时间校准（来源：{{ info.time.source }}）</view>
			<view class="result">{{ info.time.data.datetime }}</view>
			<view class="hint">时区：{{ info.time.data.timezone }}。与本机时间对比可判断设备时钟是否偏差。</view>
		</view>

		<view class="card" v-if="info && info.errors.length">
			<view class="card-title">部分数据获取失败</view>
			<view class="hint" v-for="(e, i) in info.errors" :key="i" style="color: var(--danger)">{{ e }}</view>
			<view class="hint">公开接口可能受网络环境限制，可稍后重试；其他离线工具不受影响。</view>
		</view>
	</tb-net-gate>
</template>

<script>
	import TbNetGate from '../ui/tb-net-gate.vue'
	import { fetchNetworkInfo } from '../../utils/net.js'
	import { copyText } from '../../utils/ui.js'

	const TYPES = { wifi: 'Wi-Fi', '2g': '2G', '3g': '3G', '4g': '4G', '5g': '5G', ethernet: '有线网络', none: '无网络', unknown: '未知' }

	export default {
		components: { TbNetGate },
		data() { return { loading: false, info: null, localTime: '' } },
		computed: {
			typeName() { return this.info ? (TYPES[this.info.networkType] || this.info.networkType) : '—' }
		},
		methods: {
			copyText,
			fmtNow() {
				const d = new Date(), p = n => ('0' + n).slice(-2)
				return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
			},
			async refresh() {
				if (this.loading) return
				this.loading = true
				this.localTime = this.fmtNow()
				try { this.info = await fetchNetworkInfo() }
				catch (e) { this.info = { networkType: '未知', ip: null, time: null, errors: [e.message] } }
				finally { this.loading = false }
			}
		}
	}
</script>
