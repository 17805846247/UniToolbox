<template>
	<view class="card">
		<view class="card-title">原文（A）</view>
		<tb-textarea class="textarea" v-model="a" placeholder="粘贴原始文本" ></tb-textarea>
		<view class="row" style="margin-top: 12rpx">
			<view class="btn btn-sm" @click="swap">交换 A / B</view>
			<view class="btn btn-sm btn-ghost" @click="sample">填入示例</view>
			<view class="btn btn-sm btn-ghost" @click="a = ''; b = ''">清空</view>
		</view>
		<view class="label">新文（B）</view>
		<tb-textarea class="textarea" v-model="b" placeholder="粘贴修改后的文本" ></tb-textarea>
		<view class="hint">按行做 LCS 差异对比，纯本地计算，单次最多 400 行。</view>
	</view>

	<view class="card">
		<view class="card-title">差异结果</view>
		<view v-if="error" class="hint" style="color: var(--danger)">{{ error }}</view>
		<view v-else>
			<view class="row stat-row">
				<view class="stat same">相同 {{ diff.stats.same }}</view>
				<view class="stat add">新增 {{ diff.stats.add }}</view>
				<view class="stat del">删除 {{ diff.stats.del }}</view>
			</view>
			<view class="diff-box">
				<view v-for="(r, i) in diff.rows" :key="i" class="diff-line" :class="'d-' + r.type">
					<text class="sign">{{ r.type === 'add' ? '+' : (r.type === 'del' ? '-' : ' ') }}</text>
					<text class="txt">{{ r.text || ' ' }}</text>
				</view>
			</view>
			<view class="hint">绿色为新增行，红色为删除行，无标记为相同行。</view>
		</view>
	</view>
</template>

<script>
	import { diffLines } from '../../utils/format-extra.js'

	export default {
		data() {
			return {
				a: '第一行\n第二行\n第三行\n第四行',
				b: '第一行\n第二行改了\n第三行\n第五行',
				error: ''
			}
		},
		computed: {
			diff() {
				try {
					const d = diffLines(this.a, this.b)
					this.error = ''
					return d
				} catch (e) {
					this.error = e.message
					return { rows: [], stats: { same: 0, add: 0, del: 0 } }
				}
			}
		},
		methods: {
			swap() { const t = this.a; this.a = this.b; this.b = t },
			sample() {
				this.a = 'name: 口袋工具箱\nversion: 1.0.0\noffline: true\ntools: 18'
				this.b = 'name: 口袋工具箱\nversion: 2.2.0\noffline: true\nnetwork: optional\ntools: 49'
			}
		}
	}
</script>

<style scoped>
	.stat-row { margin-bottom: 16rpx; }
	.stat { font-size: 23rpx; padding: 8rpx 18rpx; border-radius: 10rpx; }
	.stat.same { background: var(--chip-bg); color: var(--text-2); }
	.stat.add { background: rgba(22, 160, 106, .14); color: var(--ok); }
	.stat.del { background: rgba(224, 82, 82, .14); color: var(--danger); }
	.diff-box { border: 1rpx solid var(--line); border-radius: var(--radius-sm); overflow: auto; max-height: 620rpx; }
	.diff-line { display: flex; flex-direction: row; padding: 8rpx 16rpx; }
	.d-add { background: rgba(22, 160, 106, .12); }
	.d-del { background: rgba(224, 82, 82, .12); }
	.sign { width: 30rpx; color: var(--text-3); font-size: 24rpx; }
	.txt { flex: 1; color: var(--text); font-size: 24rpx; word-break: break-all; }
</style>
