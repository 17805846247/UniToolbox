<template>
	<view>
		<view class="card">
			<view class="card-title">输入要检测的密码</view>
			<tb-input class="input" v-model="pwd" :password="hide" placeholder="仅在本机计算，不会保存或上传" />
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm" @click="hide = !hide">{{ hide ? '显示密码' : '隐藏密码' }}</view>
				<view class="btn btn-sm" @click="pwd = 'X7!mQ2@vL9#pR'">填入强密码示例</view>
				<view class="btn btn-sm btn-ghost" @click="pwd = ''">清空</view>
			</view>
			<view class="hint">估算基于字符空间与常见攻击模式，仅作参考；请勿在不可信页面输入真实密码。</view>
		</view>

		<view v-if="!r.empty" class="card">
			<view class="card-title">强度评估</view>
			<view class="score-row">
				<view class="score-num">{{ r.score }}</view>
				<view class="grow">
					<view class="score-level" :style="{ color: barColor }">{{ r.level }}</view>
					<view class="score-sub">满分 100 · 熵 {{ r.entropy }} bit</view>
				</view>
			</view>
			<view class="bar-track"><view class="bar-fill" :style="{ width: r.score + '%', background: barColor }"></view></view>

			<view class="kv"><text>长度</text><text>{{ r.length }} 位</text></view>
			<view class="kv"><text>字符种类</text><text>{{ r.classes.length ? r.classes.join(' / ') : '—' }}</text></view>
			<view class="kv"><text>字符空间</text><text>{{ r.pool }} 种</text></view>
			<view class="kv"><text>离线爆破估算</text><text>{{ r.crackTime }}</text></view>
		</view>

		<view v-if="r.issues.length || r.suggestions.length" class="card">
			<view class="card-title">改进建议</view>
			<view v-if="r.issues.length" class="issue" v-for="(x, i) in r.issues" :key="'i' + i">· {{ x }}</view>
			<view class="sug" v-for="(x, i) in r.suggestions" :key="'s' + i">✓ {{ x }}</view>
		</view>

		<view class="card">
			<view class="card-title">相关工具</view>
			<view class="list-row" @click="goPassword">
				<view class="list-icon">锁</view>
				<view class="list-main">
					<view class="list-title">密码生成器</view>
					<view class="list-sub">生成自定义长度与字符集的高强度密码</view>
				</view>
				<view class="list-arrow">›</view>
			</view>
			<view class="list-row" @click="goHash">
				<view class="list-icon">#</view>
				<view class="list-main">
					<view class="list-title">哈希校验</view>
					<view class="list-sub">MD5 / SHA-1 / SHA-256 摘要计算</view>
				</view>
				<view class="list-arrow">›</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { passwordStrength } from '../../utils/gadget.js'

	export default {
		data() { return { pwd: '', hide: true } },
		computed: {
			r() { return passwordStrength(this.pwd) },
			barColor() {
				const s = this.r.score
				if (s < 20) return 'var(--danger)'
				if (s < 40) return 'var(--warn)'
				if (s < 60) return '#d9a406'
				if (s < 80) return '#2f9e6b'
				return 'var(--ok)'
			}
		},
		methods: {
			goPassword() { uni.navigateTo({ url: '/pages/tool/tool?key=password' }) },
			goHash() { uni.navigateTo({ url: '/pages/tool/tool?key=hash' }) }
		}
	}
</script>

<style scoped>
	.score-row { display: flex; flex-direction: row; align-items: center; margin-bottom: 16rpx; }
	.score-num { font-size: 72rpx; font-weight: 700; color: var(--text); margin-right: 28rpx; line-height: 1; }
	.score-level { font-size: 34rpx; font-weight: 700; }
	.score-sub { font-size: 22rpx; color: var(--text-3); margin-top: 8rpx; }
	.bar-track { height: 14rpx; border-radius: 999rpx; background: var(--line); overflow: hidden; margin-bottom: 18rpx; }
	.bar-fill { height: 100%; border-radius: 999rpx; transition: width .25s ease; }
	.issue { font-size: 25rpx; color: var(--danger); line-height: 1.9; }
	.sug { font-size: 25rpx; color: var(--ok); line-height: 1.9; }
</style>
