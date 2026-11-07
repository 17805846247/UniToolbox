<template>
	<view>
		<view class="card">
			<view class="card-title">基准时刻（北京时间 UTC+8）</view>
			<view class="big-value" style="font-size:44rpx">{{ baseText }}</view>
			<view class="hint" style="text-align:center;margin-top:-6rpx">{{ baseWeek }} · {{ custom ? '自定义时刻' : '实时时钟' }}</view>
			<view class="label">指定一个时刻（可留空使用当前时间）</view>
			<tb-input class="input" v-model="customInput" placeholder="例如 2026-11-07 19:30" />
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm btn-primary" @click="applyCustom">按此换算</view>
				<view class="btn btn-sm" @click="resetNow">回到现在</view>
			</view>
			<view class="hint">使用系统时区数据库自动处理夏令时；设备不支持时回退到固定 UTC 偏移，并在右侧标注。</view>
		</view>

		<view class="card">
			<view class="card-title">世界城市时间 · {{ rows.length }} 个</view>
			<view class="tz-row" v-for="r in rows" :key="r.name">
				<view class="tz-main">
					<view class="tz-name">{{ r.name }}<text class="tz-diff">{{ r.diffText }}</text></view>
					<view class="tz-sub">{{ r.date }} {{ r.week }} · UTC{{ r.offsetText }}</view>
				</view>
				<view class="tz-time">{{ r.hourMinute }}</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { CITIES, formatAtOffset, zoneOffsetAt } from '../../utils/life.js'
	import { toast } from '../../utils/ui.js'

	export default {
		data() {
			return { now: Date.now(), custom: false, customInput: '', timer: null }
		},
		computed: {
			baseText() { return formatAtOffset(this.now, 480).date + ' ' + formatAtOffset(this.now, 480).time },
			baseWeek() { return formatAtOffset(this.now, 480).week },
			rows() {
				return CITIES.map(c => {
					const off = zoneOffsetAt(c.zone, this.now, c.offset)
					const t = formatAtOffset(this.now, off)
					const diff = (off - 480) / 60
					return {
						name: c.name, date: t.date, week: t.week, hourMinute: t.hourMinute,
						offsetText: t.offsetText,
						diffText: diff === 0 ? '同时区' : (diff > 0 ? '快 ' : '慢 ') + Math.abs(diff) + ' 小时',
						fallback: c.offset !== off && c.zone !== 'UTC'
					}
				})
			}
		},
		mounted() {
			this.timer = setInterval(() => { if (!this.custom) this.now = Date.now() }, 1000)
		},
		beforeUnmount() { if (this.timer) clearInterval(this.timer) },
		methods: {
			applyCustom() {
				const s = String(this.customInput || '').trim()
				if (!s) return toast('请输入时刻，或点「回到现在」')
				const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/)
				if (!m) return toast('格式应为 YYYY-MM-DD HH:mm')
				const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 12), Number(m[5] || 0))
				if (!isFinite(ts)) return toast('日期无效')
				this.now = ts - 480 * 60000
				this.custom = true
			},
			resetNow() { this.custom = false; this.customInput = ''; this.now = Date.now() }
		}
	}
</script>

<style scoped>
	.tz-row {
		display: flex; flex-direction: row; align-items: center;
		padding: 20rpx 0; border-bottom: 1rpx solid var(--line);
	}
	.tz-row:last-child { border-bottom: none; }
	.tz-main { flex: 1; min-width: 0; }
	.tz-name { font-size: 27rpx; color: var(--text); font-weight: 600; }
	.tz-diff { font-size: 20rpx; color: var(--primary); font-weight: 400; margin-left: 14rpx; }
	.tz-sub { font-size: 21rpx; color: var(--text-3); margin-top: 6rpx; }
	.tz-time { font-size: 36rpx; font-weight: 700; color: var(--primary); }
</style>
