<template>
	<view class="card">
		<view class="card-title">计时模式</view>
		<view class="row">
			<view class="chip" v-for="m in modes" :key="m.key" :class="{ on: mode === m.key }" @click="switchMode(m.key)">{{ m.name }}</view>
		</view>

		<view class="time-box">
			<view class="time-text">{{ display }}</view>
			<view class="time-sub">{{ mode === 'stopwatch' ? '已用时' : (running ? '计时中…' : '剩余时间') }}</view>
		</view>

		<view v-if="mode !== 'stopwatch' && !running" style="margin-top: 20rpx">
			<view class="label">{{ mode === 'pomodoro' ? '专注时长（分钟）' : '倒计时设置' }}</view>
			<view class="row" v-if="mode === 'countdown'">
				<tb-input class="input grow" v-model="minutes" type="number" placeholder="分钟" />
				<tb-input class="input grow" v-model="seconds" type="number" placeholder="秒" />
			</view>
			<view class="row" v-else>
				<view class="chip" v-for="n in [15, 25, 45, 60]" :key="n" :class="{ on: pomodoro === n }" @click="pomodoro = n">{{ n }} 分钟</view>
			</view>
		</view>

		<view class="row" style="margin-top: 26rpx; justify-content: center">
			<view class="btn btn-primary" @click="start" v-if="!running">开始</view>
			<view class="btn" @click="pause" v-else>暂停</view>
			<view class="btn btn-ghost" @click="reset">重置</view>
		</view>
		<view class="hint">番茄钟结束后会震动提醒；切到后台时计时基于系统时间，不会被页面暂停影响。</view>
	</view>

	<view class="card">
		<view class="card-title">快捷预设</view>
		<view class="row">
			<view class="chip" v-for="p in presets" :key="p.s" @click="preset(p.s)">{{ p.name }}</view>
		</view>
	</view>
</template>

<script>
	import { ok } from '../../utils/ui.js'

	function pad(n) { return ('0' + n).slice(-2) }

	export default {
		data() {
			return {
				mode: 'countdown', modes: [
					{ key: 'countdown', name: '倒计时' }, { key: 'pomodoro', name: '番茄钟' }, { key: 'stopwatch', name: '正计时' }
				],
				minutes: '5', seconds: '0', pomodoro: 25,
				remain: 300, elapsed: 0, running: false,
				endAt: 0, startAt: 0, timer: null,
				presets: [{ name: '1 分钟', s: 60 }, { name: '3 分钟', s: 180 }, { name: '5 分钟', s: 300 }, { name: '10 分钟', s: 600 }, { name: '25 分钟', s: 1500 }]
			}
		},
		computed: {
			total() { return this.mode === 'stopwatch' ? this.elapsed : this.remain },
			display() {
				const t = Math.max(0, this.total)
				const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60
				return h > 0 ? pad(h) + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s)
			}
		},
		mounted() { this.reset() },
		beforeUnmount() { this.clear() },
		methods: {
			clear() { if (this.timer) { clearInterval(this.timer); this.timer = null } },
			baseSeconds() {
				if (this.mode === 'stopwatch') return 0
				if (this.mode === 'pomodoro') return this.pomodoro * 60
				const m = Math.max(0, Number(this.minutes) || 0), s = Math.max(0, Number(this.seconds) || 0)
				return m * 60 + s
			},
			switchMode(k) { this.clear(); this.mode = k; this.running = false; this.reset() },
			preset(s) {
				this.clear()
				this.mode = 'countdown'
				this.minutes = String(Math.floor(s / 60))
				this.seconds = String(s % 60)
				this.running = false
				this.reset()
				ok('已设置 ' + s / 60 + ' 分钟')
			},
			reset() {
				this.clear()
				this.running = false
				this.elapsed = 0
				this.remain = this.baseSeconds()
			},
			start() {
				if (this.running) return
				if (this.mode !== 'stopwatch' && this.remain <= 0) this.remain = this.baseSeconds()
				if (this.mode !== 'stopwatch' && this.remain <= 0) return uni.showToast({ title: '请先设置时间', icon: 'none' })
				this.running = true
				if (this.mode === 'stopwatch') this.startAt = Date.now() - this.elapsed * 1000
				else this.endAt = Date.now() + this.remain * 1000
				this.tick()
				this.timer = setInterval(() => this.tick(), 250)
			},
			pause() {
				this.clear()
				this.running = false
				if (this.mode === 'stopwatch') this.elapsed = Math.floor((Date.now() - this.startAt) / 1000)
				else this.remain = Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000))
			},
			tick() {
				if (this.mode === 'stopwatch') {
					this.elapsed = Math.floor((Date.now() - this.startAt) / 1000)
				} else {
					this.remain = Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000))
					if (this.remain <= 0) {
						this.clear()
						this.running = false
						try { uni.vibrateLong({}) } catch (e) { /* 部分设备不支持 */ }
						uni.showModal({ title: '时间到', content: this.mode === 'pomodoro' ? '专注结束，起来活动一下吧' : '倒计时结束', showCancel: false })
					}
				}
			}
		}
	}
</script>

<style scoped>
	.time-box {
		background: linear-gradient(135deg, var(--primary), #7b5cf0); border-radius: 24rpx;
		padding: 44rpx 20rpx; margin-top: 26rpx; text-align: center; color: #ffffff;
	}
	.time-text { font-size: 92rpx; font-weight: 700; letter-spacing: 4rpx; font-variant-numeric: tabular-nums; }
	.time-sub { font-size: 24rpx; opacity: 0.85; margin-top: 10rpx; }
</style>
