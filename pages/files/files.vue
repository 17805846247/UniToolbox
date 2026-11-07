<template>
	<view :class="themeClass">
		<view class="card">
			<view class="card-title">我的文件</view>
			<view class="hint">存放位置：{{ desc }} · 可导出到公共 Documents，或复制内容到剪贴板</view>
			<view class="row btns">
				<view class="btn btn-primary" @click="createFile">新建</view>
				<view class="btn btn-ghost" @click="doImport">导入</view>
				<view class="btn btn-ghost" @click="fromClipboard">粘贴新建</view>
				<view class="btn btn-ghost" @click="refresh">刷新</view>
			</view>
		</view>

		<tb-section title="文件列表" :action="files.length + ' 个'"></tb-section>
		<view class="card file" v-for="f in files" :key="f.name">
			<view class="file-main" @click="open(f)">
				<view class="file-icon">文</view>
				<view class="grow">
					<view class="file-name">{{ f.name }}</view>
					<view class="file-meta">{{ formatBytes(f.size) }} · {{ formatTime(f.time) }}</view>
				</view>
				<view class="list-arrow">›</view>
			</view>
			<view class="row ops">
				<view class="btn btn-sm btn-primary" @click="open(f)">编辑</view>
				<view class="btn btn-sm btn-ghost" @click="rename(f)">改名</view>
				<view class="btn btn-sm btn-ghost" @click="doExport(f)">导出</view>
				<view class="btn btn-sm btn-ghost" @click="copyContent(f)">复制</view>
				<view class="btn btn-sm" @click="uploadFile(f)">上传</view>
				<view class="btn btn-sm btn-danger" @click="remove(f)">删除</view>
			</view>
		</view>
		<view v-if="!files.length" class="empty">还没有文件，点「新建」创建一个吧</view>

		<view class="card cloud">
			<view class="card-title">云端备份</view>
			<view class="kv"><text>云端地址</text><text class="grow cloud-ep">{{ cloudEndpoint || '未设置' }}</text></view>
			<view class="row" style="margin-top: 14rpx">
				<view class="btn btn-sm" @click="setCloud">设置云端地址</view>
			</view>
			<view class="hint">免费把文件 POST 到你的云端端点（接收 {"name","content","owner","time"} 的 JSON）。需先在「我的」开启联网，每次上传都会先询问你。</view>
			<view v-if="uploads.length">
				<view class="label">最近上传</view>
				<view class="up-row" v-for="(u, i) in uploads" :key="i">
					<text class="up-name">{{ u.name }}</text>
					<text class="up-time">{{ u.timeText }}</text>
				</view>
			</view>
		</view>

		<view class="foot-link" @click="openEditor">或 直接打开空白编辑器 ›</view>
		<view class="safe-bottom"></view>
	</view>
</template>

<script>
	import { themeMixin } from '../../utils/theme.js'
	import { listFiles, readFile, writeFile, removeFile, renameFile, exportFile, pickLocalFile, isNative, storageDesc, safeName } from '../../utils/fs.js'
	import { formatBytes, formatDate } from '../../utils/convert.js'
	import { getAccount, getUploads, addUpload } from '../../utils/account.js'
	import { getCloudEndpoint, setCloudEndpoint } from '../../utils/net-config.js'
	import { isNetEnabled } from '../../utils/net.js'
	import { confirm, toast, ok } from '../../utils/ui.js'
	import TbSection from '../../components/ui/tb-section.vue'

	export default {
		components: { TbSection },
		mixins: [themeMixin],
		data() {
			return {
				files: [], desc: storageDesc(),
				cloudEndpoint: '', uploads: []
			}
		},
		onShow() {
			this.refresh()
			this.cloudEndpoint = getCloudEndpoint()
			this.uploads = getUploads()
		},
		methods: {
			formatBytes,
			formatTime(t) {
				try { return formatDate(new Date(t)) } catch (e) { return '-' }
			},
			async refresh() {
				try { this.files = await listFiles() } catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
			},
			askName(title) {
				return new Promise(resolve => {
					uni.showModal({
						title: title, editable: true, placeholderText: '例如 笔记.txt',
						success: r => resolve(r.confirm && r.content ? String(r.content).trim() : ''),
						fail: () => resolve('')
					})
				})
			},
			async createFile() {
				const n = await this.askName('新建文件')
				if (!n) return
				try {
					const name = safeName(n)
					await writeFile(name, '')
					await this.refresh()
					this.open({ name })
				} catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
			},
			async doImport() {
				if (isNative()) {
					uni.showModal({
						title: '导入文件', showCancel: false,
						content: 'App 端请使用「粘贴新建」把文本存成文件；如需导入手机里的文件，可先用系统文件管理器打开并复制文本内容。'
					})
					return
				}
				try {
					const f = await pickLocalFile()
					await writeFile(f.name, f.content)
					await this.refresh()
					uni.showToast({ title: '导入成功', icon: 'success' })
				} catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
			},
			async fromClipboard() {
				try {
					const res = await uni.getClipboardData()
					const r = Array.isArray(res) ? res[1] : res
					const text = r && r.data ? String(r.data) : ''
					if (!text) return uni.showToast({ title: '剪贴板是空的', icon: 'none' })
					const n = await this.askName('粘贴为文件')
					if (!n) return
					await writeFile(safeName(n), text)
					await this.refresh()
					uni.showToast({ title: '已保存', icon: 'success' })
				} catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
			},
			open(f) {
				uni.navigateTo({ url: '/pages/editor/editor?name=' + encodeURIComponent(f.name) })
			},
			openEditor() {
				uni.navigateTo({ url: '/pages/editor/editor' })
			},
			async rename(f) {
				const n = await this.askName('重命名（输入新文件名）')
				if (!n) return
				try { await renameFile(f.name, safeName(n)); await this.refresh() }
				catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
			},
			remove(f) {
				uni.showModal({
					title: '删除文件', content: '确定删除「' + f.name + '」吗？此操作不可恢复。',
					success: async r => {
						if (!r.confirm) return
						try { await removeFile(f.name); await this.refresh(); uni.showToast({ title: '已删除', icon: 'success' }) }
						catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
					}
				})
			},
			async doExport(f) {
				try {
					const p = await exportFile(f.name)
					uni.showModal({ title: '导出成功', content: '保存位置：' + p, showCancel: false })
				} catch (e) { uni.showModal({ title: '导出失败', content: e.message, showCancel: false }) }
			},
			async copyContent(f) {
				try {
					const text = await readFile(f.name)
					await uni.setClipboardData({ data: text })
					uni.showToast({ title: '内容已复制', icon: 'success' })
				} catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
			},
			promptEndpoint() {
				return new Promise(resolve => {
					uni.showModal({
						title: '设置云端地址', editable: true, placeholderText: 'https://your-server/upload',
						content: this.cloudEndpoint || '',
						success: r => {
							if (!r.confirm) return resolve(null)
							const v = String(r.content || '').trim()
							if (!v) return resolve(null)
							setCloudEndpoint(v)
							this.cloudEndpoint = v
							resolve(v)
						},
						fail: () => resolve(null)
					})
				})
			},
			setCloud() { this.promptEndpoint() },
			fmtUploadTime(t) {
				try {
					const d = new Date(t)
					const p = n => (n < 10 ? '0' + n : '' + n)
					return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
				} catch (e) { return '' }
			},
			async uploadFile(f) {
				if (!isNetEnabled()) {
					uni.showToast({ title: '请先在「我的」开启联网', icon: 'none' })
					return
				}
				const yes = await confirm('将文件「' + f.name + '」上传到云端（免费），是否继续？', '上传到云端')
				if (!yes) return
				let ep = this.cloudEndpoint
				if (!ep) {
					ep = await this.promptEndpoint()
					if (!ep) return
				}
				try {
					const content = await readFile(f.name)
					const account = getAccount()
					const time = Date.now()
					const res = await uni.request({
						url: ep,
						method: 'POST',
						header: { 'content-type': 'application/json' },
						data: {
							name: f.name, content,
							owner: account.id,
							avatar: account.avatar,
							displayName: account.name,
							time
						}
					})
					const status = res && res.statusCode
					if (status && status >= 200 && status < 300) {
						addUpload({ name: f.name, endpoint: ep, time, timeText: this.fmtUploadTime(time) })
						this.uploads = getUploads()
						ok('已上传到云端')
					} else {
						uni.showToast({ title: '上传失败（HTTP ' + (status || '?') + '）', icon: 'none' })
					}
				} catch (e) {
					uni.showToast({ title: '上传失败：' + ((e && (e.message || e.errMsg)) || '网络错误'), icon: 'none' })
				}
			}
		}
	}
</script>

<style scoped>
	.btns { margin-top: var(--sp-3); }
	.file { padding: var(--sp-3) var(--sp-4); }
	.file-main { display: flex; align-items: center; }
	.file-icon {
		width: 68rpx; height: 68rpx; border-radius: var(--radius-badge);
		background: var(--primary-soft); color: var(--primary);
		display: flex; align-items: center; justify-content: center;
		font-size: 26rpx; margin-right: 20rpx; flex-shrink: 0;
	}
	.file-name { font-size: 28rpx; font-weight: 600; word-break: break-all; }
	.file-meta { font-size: 22rpx; color: var(--text-3); margin-top: 8rpx; }
	.ops { margin-top: var(--sp-3); border-top: 1rpx solid var(--line); padding-top: var(--sp-3); }
	.foot-link { text-align: center; font-size: 24rpx; color: var(--primary); margin-top: var(--sp-4); }
	.cloud-ep { text-align: right; color: var(--text-2); word-break: break-all; font-size: 24rpx; }
	.up-row { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; border-bottom: 1rpx solid var(--line); font-size: 24rpx; }
	.up-row:last-child { border-bottom: none; }
	.up-name { color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.up-time { color: var(--text-3); margin-left: 16rpx; flex-shrink: 0; }
</style>
