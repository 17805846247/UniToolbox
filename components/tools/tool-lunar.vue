<template>
	<view>
		<view class="card">
			<view class="card-title">公历 → 农历</view>
			<picker mode="date" :value="solarDate" :start="'1900-01-31'" :end="'2100-12-31'" @change="onDate">
				<view class="picker">{{ solarDate }}</view>
			</picker>
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm" @click="today">今天</view>
				<view class="btn btn-sm" @click="solarDate = '2026-02-17'">2026 春节</view>
			</view>
			<view v-if="lunar" class="lunar-box">
				<view class="lunar-main">{{ lunar.text }}</view>
				<view class="lunar-sub">{{ lunar.ganzhi }}年 · 生肖{{ lunar.zodiac }}<text v-if="lunar.festival"> · {{ lunar.festival }}</text></view>
			</view>
			<view class="divider"></view>
			<view class="kv" v-if="lunar"><text>农历年</text><text>{{ lunar.year }} 年（{{ lunar.ganzhi }}）</text></view>
			<view class="kv" v-if="lunar"><text>本月天数</text><text>{{ lunar.daysInMonth }} 天{{ lunar.leap ? '（闰月）' : '' }}</text></view>
			<view class="kv" v-if="lunar"><text>当年春节</text><text>{{ lunar.springDay }}</text></view>
			<view class="kv" v-if="lunar"><text>传统节日</text><text>{{ lunar.festival || '无' }}</text></view>
			<view class="hint">数据覆盖 1900~2100 年，内置闰月与大小月，完全离线；生肖按农历年划分。</view>
		</view>
		<view class="card" v-if="error"><view class="hint" style="color:var(--danger)">{{ error }}</view></view>

		<view class="card">
			<view class="card-title">农历 → 公历</view>
			<view class="label">农历年（1900~2100）</view>
			<tb-input class="input" v-model="ly" type="number" placeholder="例如 2025" />
			<view class="label">农历月 / 日</view>
			<view class="row">
				<picker mode="selector" :range="monthNames" :value="lmIdx" @change="onMonth">
					<view class="picker picker-half">{{ monthNames[lmIdx] }}</view>
				</picker>
				<picker mode="selector" :range="dayNames" :value="ldIdx" @change="onDay">
					<view class="picker picker-half">{{ dayNames[ldIdx] }}</view>
				</picker>
			</view>
			<view class="setting-row">
				<text class="grow">这个月是闰月</text>
				<switch :checked="isLeap" color="#4f6ef7" @change="onLeap" />
			</view>
			<view class="row" style="margin-top:18rpx">
				<view class="btn btn-primary btn-sm" @click="toSolar">换算为公历</view>
				<view class="btn btn-sm" @click="fillLeap">填入 2025 闰六月</view>
			</view>
			<view class="result" v-if="solarBack">{{ solarBack }}</view>
			<view class="result" v-if="backError" style="color:var(--danger)">{{ backError }}</view>
		</view>
	</view>
</template>

<script>
	import { solarToLunar, lunarToSolar } from '../../utils/life.js'

	const CN_MONTH = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
	export default {
		data() {
			return {
				solarDate: '', lunar: null, error: '',
				ly: '2025', lmIdx: 5, ldIdx: 0, isLeap: false,
				solarBack: '', backError: '',
				monthNames: CN_MONTH,
				dayNames: Array.from({ length: 30 }, (_, i) => (i + 1) + ' 日')
			}
		},
		created() {
			const d = new Date()
			this.solarDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
			this.refresh()
		},
		methods: {
			refresh() {
				try {
					this.error = ''
					const p = this.solarDate.split('-')
					this.lunar = solarToLunar(Number(p[0]), Number(p[1]), Number(p[2]))
				} catch (e) { this.error = e.message; this.lunar = null }
			},
			onDate(e) { this.solarDate = e.detail.value; this.refresh() },
			today() {
				const d = new Date()
				this.solarDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
				this.refresh()
			},
			onMonth(e) { this.lmIdx = Number(e.detail.value) },
			onDay(e) { this.ldIdx = Number(e.detail.value) },
			onLeap(e) { this.isLeap = e.detail.value },
			fillLeap() { this.ly = '2025'; this.lmIdx = 5; this.ldIdx = 0; this.isLeap = true },
			toSolar() {
				try {
					this.backError = ''
					this.solarBack = lunarToSolar(this.ly, this.lmIdx + 1, this.ldIdx + 1, this.isLeap)
				} catch (e) { this.backError = e.message; this.solarBack = '' }
			}
		}
	}
</script>

<style scoped>
	.lunar-box { text-align: center; padding: 30rpx 0 10rpx; }
	.lunar-main { font-size: 52rpx; font-weight: 700; color: var(--primary); }
	.lunar-sub { font-size: 25rpx; color: var(--text-2); margin-top: 12rpx; }
	.picker-half { width: 46%; margin-right: 4%; display: inline-block; }
	.setting-row { display: flex; flex-direction: row; align-items: center; margin-top: 20rpx; font-size: 26rpx; color: var(--text-2); }
</style>
