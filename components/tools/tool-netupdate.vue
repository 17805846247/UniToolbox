<template>
	<tb-net-gate>
		<view class="card">
			<view class="card-title">版本信息</view>
			<view class="kv"><text>当前版本</text><text>v{{ current }}</text></view>
			<view class="kv"><text>应用名称</text><text>口袋工具箱</text></view>
			<view class="kv"><text>联网状态</text><text>{{ netOn ? '已开启' : '已关闭' }}</text></view>
		</view>

		<view class="card">
			<view class="card-title">版本文件地址</view>
			<tb-input class="input" v-model="updateUrl" placeholder="https://example.com/version.json" />
			<view class="row" style="margin-top: 16rpx">
				<view class="btn btn-sm" @click="saveUrl">保存地址</view>
				<view class="btn btn-sm btn-ghost" @click="clearUrl">清空</view>
			</view>
			<view class="hint">版本文件是一个公开 JSON，格式示例：</view>
			<view class="result">{"version":"2.2.0","note":"新增工具","url":"https://…/app.apk"}</view>
			<view class="hint">留空时不做任何请求。此功能仅做版本比对，不会自动下载或安装 APK。</view>
		</view>

		<view class="card">
			<view class="btn btn-primary" :class="{ off: loading }" @click="check">{{ loading ? '检查中…' : '检查更新' }}</view>

			<view class="status" v-if="status !== 'idle'" :class="'st-' + status">
				<view class="st-ico">{{ stIcon }}</view>
				<view class="st-body">
					<view class="st-title">{{ stTitle }}</view>
					<view class="st-sub" v-if="stSub">{{ stSub }}</view>
				</view>
			</view>

			<view class="hint" style="margin-top: 18rpx" v-if="lastCheckText">上次检查：{{ lastCheckText }}</view>
		</view>

		<view class="card" v-if="status === 'hasupdate' && result">
			<view class="card-title">发现新版本</view>
			<view class="kv"><text>最新版本</text><text>v{{ result.version }}</text></view>
			<view class="kv"><text>当前版本</text><text>v{{ result.current }}</text></view>
			<view class="kv"><text>数据源</text><text>{{ result.source }}</text></view>
			<view class="label" v-if="result.note">更新说明</view>
			<view class="result" v-if="result.note">{{ result.note }}</view>
			<view class="row" style="margin-top: 16rpx" v-if="result.url">
				<view class="btn btn-sm" @click="copyText(result.url)">复制下载地址</view>
			</view>
		</view>
	</tb-net-gate>
</template>

<script>
	import TbNetGate from '../ui/tb-net-gate.vue'
	import { checkUpdate, isNetEnabled } from '../../utils/net.js'
	import { getUpdateUrl, setUpdateUrl } from '../../utils/net-config.js'
	import { APP_VERSION } from '../../utils/version.js'
	import { copyText, toast } from '../../utils/ui.js'

	export default {
		components: { TbNetGate },
		data() {
			return {
				current: APP_VERSION,
				updateUrl: '',
				loading: false,
				status: 'idle',     // idle | checking | uptodate | hasupdate | error
				result: null,
				error: '',
				lastCheck: 0,
				netOn: false
			}
		},
		mounted() {
			this.updateUrl = getUpdateUrl()
			this.netOn = isNetEnabled()
		},
		computed: {
			stIcon() {
				return { idle: '⌕', checking: '⏳', uptodate: '✅', hasupdate: '🆕', error: '⚠️' }[this.status] || '⌕'
			},
			stTitle() {
				if (this.status === 'checking') return '正在检查更新…'
				if (this.status === 'uptodate') return '已是最新版本'
				if (this.status === 'hasupdate') return '发现新版本 v' + (this.result ? this.result.version : '')
				if (this.status === 'error') return '检查失败'
				return ''
			},
			stSub() {
				if (this.status === 'uptodate') return '当前已是最新（v' + this.current + '）'
				if (this.status === 'hasupdate' && this.result && this.result.note) return this.result.note
				if (this.status === 'error') return this.error
				return ''
			},
			lastCheckText() {
				if (!this.lastCheck) return ''
				try {
					const d = new Date(this.lastCheck)
					const p = n => (n < 10 ? '0' + n : '' + n)
					return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
				} catch (e) { return '' }
			}
		},
		methods: {
			copyText,
			saveUrl() {
				setUpdateUrl(this.updateUrl)
				toast('地址已保存')
			},
			clearUrl() {
				this.updateUrl = ''
				setUpdateUrl('')
				toast('已清空')
			},
			async check() {
				if (this.loading) return
				if (this.updateUrl.trim() !== getUpdateUrl()) setUpdateUrl(this.updateUrl)
				this.loading = true
				this.status = 'checking'
				this.error = ''
				this.lastCheck = Date.now()
				try {
					const r = await checkUpdate(this.current)
					this.result = r
					this.status = r.hasUpdate ? 'hasupdate' : 'uptodate'
				} catch (e) {
					this.error = e.message || '检查失败，请稍后重试'
					this.status = 'error'
				} finally {
					this.loading = false
				}
			}
		}
	}
</script>

<style scoped>
	.btn.off { opacity: .6; }
	.status {
		display: flex; flex-direction: row; align-items: flex-start;
		margin-top: 22rpx; padding: 20rpx; border-radius: 14rpx;
		background: var(--input-bg); border: 1rpx solid var(--line);
	}
	.st-ico { font-size: 38rpx; line-height: 1.2; margin-right: 16rpx; flex-shrink: 0; }
	.st-body { flex: 1; min-width: 0; }
	.st-title { font-size: 27rpx; font-weight: 600; color: var(--text); }
	.st-sub { font-size: 23rpx; color: var(--text-2); margin-top: 8rpx; line-height: 1.6; }
	.st-uptodate .st-ico { color: var(--ok); }
	.st-hasupdate .st-ico { color: var(--primary); }
	.st-error .st-ico { color: var(--danger); }
	.st-checking .st-ico { color: var(--text-2); }
</style>
