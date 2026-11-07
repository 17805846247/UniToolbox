<template>
	<view>
		<view class="card">
			<view class="card-title">Cron 表达式</view>
			<tb-input class="input" v-model="expr" placeholder="分 时 日 月 周，例如 0 9 * * *" />
			<view class="row" style="margin-top:18rpx">
				<view class="btn btn-sm" v-for="p in presets" :key="p.name" @click="expr = p.expr">{{ p.name }}</view>
			</view>
			<view class="hint">支持 * / 逗号 / 区间 / 步长（如 1-5、*/10、1,4,7）。5 段标准写法，周 0 与 7 都表示周日。</view>
		</view>

		<view v-if="!r.valid" class="card">
			<view class="hint" style="color:var(--danger)">{{ r.error || '请输入表达式' }}</view>
		</view>

		<view v-else>
			<view class="card">
				<view class="card-title">这句话的意思</view>
				<view class="human">{{ r.human }}</view>
				<view class="hint">按本地时区推算，{{ r.scanned }}</view>
			</view>

			<view class="card">
				<view class="card-title">字段拆解</view>
				<view class="field-row" v-for="f in r.fields" :key="f.key">
					<view class="f-name">{{ f.name }}</view>
					<view class="f-raw">{{ f.raw }}</view>
					<view class="grow f-val">{{ fieldText(f) }}</view>
				</view>
			</view>

			<view class="card">
				<view class="card-title">接下来 {{ r.next.length }} 次执行</view>
				<view v-if="!r.next.length" class="empty">未来一年内没有匹配的时间</view>
				<view class="kv" v-for="(n, i) in r.next" :key="n.ts">
					<text>第 {{ i + 1 }} 次</text><text>{{ n.text }}</text>
				</view>
				<view class="row" style="margin-top:20rpx">
					<view class="btn btn-sm btn-primary" @click="copyText(expr)">复制表达式</view>
					<view class="btn btn-sm" @click="copyText(r.next.map(x => x.text).join('\n'))">复制时间列表</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { parseCron, CRON_PRESETS } from '../../utils/gadget.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() { return { expr: '30 9 * * 1-5', presets: CRON_PRESETS } },
		computed: {
			r() { return parseCron(this.expr, { count: 5 }) }
		},
		methods: {
			copyText,
			fieldText(f) {
				if (f.isAll) return '任意值'
				const v = f.values
				if (v.length > 10) return v.length + ' 个取值：' + v.slice(0, 6).join('、') + '…'
				return v.join('、') + (f.key === 'week' ? '（0/7=周日）' : '')
			}
		}
	}
</script>

<style scoped>
	.human {
		font-size: 32rpx; font-weight: 600; color: var(--primary);
		background: var(--primary-soft); border-radius: var(--radius-sm);
		padding: 24rpx 26rpx; line-height: 1.6;
	}
	.field-row {
		display: flex; flex-direction: row; align-items: flex-start;
		padding: 16rpx 0; border-bottom: 1rpx solid var(--line); font-size: 25rpx;
	}
	.field-row:last-child { border-bottom: none; }
	.f-name { width: 90rpx; color: var(--text-2); flex-shrink: 0; }
	.f-raw {
		width: 150rpx; color: var(--primary); font-weight: 600; flex-shrink: 0;
		word-break: break-all;
	}
	.f-val { color: var(--text); word-break: break-all; line-height: 1.5; }
</style>
