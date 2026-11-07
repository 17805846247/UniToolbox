<template>
	<view class="card">
		<view class="card-title">ID 类型</view>
		<view class="row">
			<view class="chip" v-for="t in types" :key="t.k" :class="{ on: kind === t.k }" @click="kind = t.k">{{ t.n }}</view>
		</view>
		<view class="label">生成数量：{{ count }} 个（最多 50）</view>
		<slider :value="count" min="1" max="50" show-value activeColor="#4f6ef7" @change="onCount" />
		<view class="label" v-if="kind !== 'uuid'">长度：{{ size }}</view>
		<slider v-if="kind !== 'uuid'" :value="size" min="4" max="64" show-value activeColor="#4f6ef7" @change="onSize" />
		<view class="row" style="margin-top: 18rpx">
			<view class="btn btn-primary" @click="gen">生成</view>
			<view class="btn btn-ghost" @click="copyText(list.join('\n'))">复制全部</view>
		</view>
		<view class="hint">使用本地随机数生成，不联网。适合做临时标识、测试数据；请勿当作密码或安全令牌。</view>
	</view>

	<view class="card">
		<view class="card-title">生成结果（{{ list.length }}）</view>
		<view v-for="(s, i) in list" :key="i" class="id-row" @click="copyText(s)">
			<text class="id-no">{{ i + 1 }}</text>
			<text class="id-val">{{ s }}</text>
			<text class="id-copy">复制</text>
		</view>
		<view v-if="!list.length" class="empty">点「生成」创建一批 ID</view>
	</view>
</template>

<script>
	import { generateIds } from '../../utils/format-extra.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() {
			return {
				kind: 'uuid', count: 5, size: 12, list: [],
				types: [
					{ k: 'uuid', n: 'UUID v4' }, { k: 'nano', n: 'NanoID' },
					{ k: 'hex', n: '十六进制' }, { k: 'num', n: '纯数字' }
				]
			}
		},
		mounted() { this.gen() },
		methods: {
			copyText,
			onCount(e) { this.count = e.detail.value },
			onSize(e) { this.size = e.detail.value },
			gen() { this.list = generateIds(this.kind, this.count, { size: this.size }) }
		}
	}
</script>

<style scoped>
	.id-row {
		display: flex; flex-direction: row; align-items: center;
		padding: 18rpx 0; border-bottom: 1rpx solid var(--line);
	}
	.id-no { width: 48rpx; color: var(--text-3); font-size: 23rpx; }
	.id-val { flex: 1; color: var(--text); font-size: 25rpx; word-break: break-all; }
	.id-copy { color: var(--primary); font-size: 23rpx; margin-left: 14rpx; }
</style>
