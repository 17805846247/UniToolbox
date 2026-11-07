<template>
	<view>
		<view class="card">
			<view class="card-title">IP 地址 / CIDR</view>
			<tb-input class="input" v-model="cidr" placeholder="例如 192.168.1.10/24" />
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm" v-for="s in samples" :key="s" @click="cidr = s">{{ s }}</view>
			</view>
			<view class="hint">支持 IP/位数（/24）、点分掩码（/255.255.255.0）、只写 IP（默认 /32）。</view>
		</view>

		<view class="card" v-if="result">
			<view class="card-title">子网信息</view>
			<view class="big-value" style="font-size:40rpx">{{ result.cidr }}</view>
			<view class="hint" style="text-align:center;margin-top:-6rpx">{{ result.kind }} · {{ result.ipClass }} 类地址</view>
			<view class="divider"></view>
			<view class="kv"><text>IP 地址</text><text>{{ result.ip }}</text></view>
			<view class="kv"><text>子网掩码</text><text>{{ result.mask }}</text></view>
			<view class="kv"><text>反掩码</text><text>{{ result.wildcard }}</text></view>
			<view class="kv"><text>网络地址</text><text>{{ result.network }}</text></view>
			<view class="kv"><text>广播地址</text><text>{{ result.broadcast }}</text></view>
			<view class="kv"><text>可用地址范围</text><text>{{ result.firstHost }} ~ {{ result.lastHost }}</text></view>
			<view class="kv"><text>可用主机数</text><text>{{ result.hostCount }} 个</text></view>
			<view class="kv"><text>掩码位数</text><text>/{{ result.prefix }}</text></view>
			<view class="row" style="margin-top:18rpx">
				<view class="btn btn-sm btn-primary" @click="copyText(result.cidr)">复制 CIDR</view>
				<view class="btn btn-sm" @click="copyAll">复制全部信息</view>
			</view>
		</view>
		<view class="card" v-if="error"><view class="hint" style="color:var(--danger)">{{ error }}</view></view>

		<view class="card" v-if="result">
			<view class="card-title">二进制对照</view>
			<view class="bin-row" v-for="(b, i) in binaryRows" :key="i">
				<text class="bin-label">{{ binLabels[i] }}</text>
				<text class="bin-value">{{ b }}</text>
			</view>
			<view class="hint">按位与（IP & 掩码）得到网络地址；主机位全 1 即广播地址。</view>
		</view>
	</view>
</template>

<script>
	import { parseCidr } from '../../utils/devkit.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				cidr: '192.168.1.10/24', error: '',
				samples: ['192.168.1.10/24', '10.0.0.5/8', '172.16.5.4/12', '8.8.8.8'],
				binLabels: ['IP 地址', '子网掩码', '网络地址', '广播地址']
			}
		},
		computed: {
			result() {
				try { this.error = ''; return parseCidr(this.cidr) }
				catch (e) { this.error = e.message; return null }
			},
			binaryRows() { return this.result ? this.result.binary : [] }
		},
		methods: {
			copyText,
			copyAll() {
				const r = this.result
				if (!r) return
				copyText([
					'CIDR: ' + r.cidr, 'IP: ' + r.ip, '掩码: ' + r.mask,
					'网络: ' + r.network, '广播: ' + r.broadcast,
					'可用: ' + r.firstHost + ' ~ ' + r.lastHost,
					'主机数: ' + r.hostCount, '类型: ' + r.kind
				].join('\n'))
			}
		}
	}
</script>

<style scoped>
	.bin-row {
		display: flex; flex-direction: column; padding: 14rpx 0;
		border-bottom: 1rpx solid var(--line);
	}
	.bin-row:last-child { border-bottom: none; }
	.bin-label { font-size: 22rpx; color: var(--text-3); margin-bottom: 8rpx; }
	.bin-value { font-size: 22rpx; color: var(--text); letter-spacing: 1rpx; word-break: break-all; }
</style>
