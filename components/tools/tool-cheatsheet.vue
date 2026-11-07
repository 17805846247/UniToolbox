<template>
	<view>
		<view class="card">
			<view class="card-title">开发者速查手册</view>
			<tb-input class="input" v-model="kw" placeholder="搜索状态码 / MIME / 端口 / Git 命令" />
			<view class="row" style="margin-top:16rpx">
				<view class="chip" :class="{ on: active === 'all' }" @click="active = 'all'">全部</view>
				<view class="chip" v-for="g in groupsAll" :key="g.key" :class="{ on: active === g.key }" @click="active = g.key">{{ g.name }}</view>
			</view>
			<view class="hint">共 {{ totalItems }} 条，本地静态数据，无需联网；点任意一行可复制。</view>
		</view>

		<view class="card" v-for="g in groups" :key="g.key">
			<view class="card-title">{{ g.name }} · {{ g.items.length }}</view>
			<view class="cheat-row" v-for="(it, i) in g.items" :key="i" @click="copyLine(it)">
				<text class="cheat-k">{{ it[0] }}</text>
				<text class="cheat-v">{{ it[1] }}</text>
			</view>
		</view>
		<view v-if="!groups.length" class="empty">没有找到相关条目，换个关键词试试</view>
	</view>
</template>

<script>
	import { CHEATS, searchCheats } from '../../utils/devkit.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() { return { kw: '', active: 'all', groupsAll: CHEATS } },
		computed: {
			groups() {
				const found = searchCheats(this.kw, CHEATS)
				return this.active === 'all' ? found : found.filter(g => g.key === this.active)
			},
			totalItems() { return CHEATS.reduce((s, g) => s + g.items.length, 0) }
		},
		methods: {
			copyLine(it) { copyText(it[0] + ' — ' + it[1]) }
		}
	}
</script>

<style scoped>
	.cheat-row {
		display: flex; flex-direction: row; align-items: flex-start;
		padding: 18rpx 0; border-bottom: 1rpx solid var(--line);
	}
	.cheat-row:last-child { border-bottom: none; }
	.cheat-row:active { opacity: .6; }
	.cheat-k {
		width: 200rpx; flex-shrink: 0; font-size: 24rpx;
		color: var(--primary); font-weight: 600; word-break: break-all;
	}
	.cheat-v { flex: 1; font-size: 24rpx; color: var(--text-2); line-height: 1.6; }
</style>
