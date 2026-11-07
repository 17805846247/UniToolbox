<template>
	<view class="card">
		<view class="card-title">当前时间戳</view>
		<view class="result big-value">{{ nowSec }}</view>
		<view class="row" style="justify-content: center">
			<view class="btn btn-sm" @click="refresh">刷新</view>
			<view class="btn btn-sm btn-primary" @click="copyText(String(nowSec))">复制秒</view>
			<view class="btn btn-sm" @click="copyText(String(nowMs))">复制毫秒</view>
		</view>
		<view class="hint">当前本地时间：{{ nowText }} · {{ weekday }}</view>
	</view>

	<view class="card">
		<view class="card-title">时间戳 → 日期时间</view>
		<tb-input class="input" v-model="tsInput" placeholder="输入 10 位秒 或 13 位毫秒时间戳" type="number" />
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-primary" @click="toDate">转换</view>
			<view class="btn btn-ghost" @click="tsInput = String(nowSec)">填入当前</view>
		</view>
		<view class="result" v-if="dateResult">{{ dateResult }}</view>
	</view>

	<view class="card">
		<view class="card-title">日期时间 → 时间戳</view>
		<tb-input class="input" v-model="dateInput" placeholder="YYYY-MM-DD HH:mm:ss" />
		<view class="row" style="margin-top: 16rpx">
			<view class="btn btn-primary" @click="toTs">转换</view>
			<view class="btn btn-ghost" @click="dateInput = nowText">填入当前</view>
		</view>
		<view class="result" v-if="tsResult">{{ tsResult }}</view>
		<view class="row" style="margin-top: 12rpx" v-if="tsResult">
			<view class="btn btn-sm" @click="copyText(tsResult)">复制结果</view>
		</view>
	</view>
</template>

<script>
	import { tsToDate, dateToTs, formatDate } from '../../utils/convert.js'
	import { copyText, toast } from '../../utils/ui.js'

	export default {
		data() {
			return {
				nowSec: 0, nowMs: 0, nowText: '', weekday: '',
				tsInput: '', dateInput: '', dateResult: '', tsResult: '', timer: null
			}
		},
		mounted() {
			this.refresh()
			this.timer = setInterval(() => this.refresh(), 1000)
		},
		beforeUnmount() { if (this.timer) clearInterval(this.timer) },
		methods: {
			copyText,
			refresh() {
				const d = new Date()
				this.nowMs = d.getTime()
				this.nowSec = Math.floor(this.nowMs / 1000)
				this.nowText = formatDate(d)
				this.weekday = '星期' + '日一二三四五六'[d.getDay()]
			},
			toDate() {
				try {
					const r = tsToDate(this.tsInput)
					this.dateResult = `${r.text}  ${r.weekday}\n秒级：${r.seconds}\n毫秒：${r.ms}`
				} catch (e) { toast(e.message) }
			},
			toTs() {
				try {
					const r = dateToTs(this.dateInput)
					this.tsResult = `秒级：${r.seconds}\n毫秒：${r.ms}\n本地时间：${r.text}`
				} catch (e) { toast(e.message) }
			}
		}
	}
</script>
