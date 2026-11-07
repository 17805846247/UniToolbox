<template>
	<view :class="themeClass">
		<view class="card">
			<view class="file-bar">
				<text class="file-name">{{ name || '未命名（点保存起名）' }}</text>
				<text class="state" :class="{ dirty: dirty }">{{ dirty ? '未保存' : '已保存' }}</text>
			</view>
			<view class="row" style="margin-top: var(--sp-3)">
				<view class="btn btn-primary btn-sm" @click="save">保存</view>
				<view class="btn btn-sm btn-ghost" @click="saveAs">另存为</view>
				<view class="btn btn-sm btn-ghost" @click="showFind = !showFind">查找替换</view>
				<view class="btn btn-sm btn-ghost" @click="copyAll">复制全文</view>
				<view class="btn btn-sm btn-danger" @click="clearAll">清空</view>
			</view>
		</view>

		<view class="card" v-if="showFind">
			<view class="card-title">查找与替换</view>
			<tb-input class="input" v-model="findText" placeholder="要查找的内容" />
			<tb-input class="input" v-model="replaceText" placeholder="替换为（留空则删除）" style="margin-top: 14rpx" />
			<view class="row" style="margin-top: 12rpx">
				<view class="btn btn-sm" @click="replaceAll">全部替换</view>
				<text class="hint" style="margin: 0">匹配 {{ matchCount }} 处</text>
			</view>
		</view>

		<view class="card edit-card">
			<tb-textarea class="textarea edit-area" v-model="content" placeholder="在这里输入内容…"
				:auto-height="false" :show-confirm-bar="false" @input="onInput" ></tb-textarea>
			<view class="status">
				<text>{{ stats.chars }} 字 · {{ stats.lines }} 行 · {{ stats.bytes }} 字节</text>
				<text>{{ name ? '自动存草稿' : '新文件' }}</text>
			</view>
		</view>

		<view class="card">
			<view class="card-title">快捷处理</view>
			<view class="row">
				<view class="btn btn-sm btn-ghost" @click="insertTime">插入日期时间</view>
				<view class="btn btn-sm btn-ghost" @click="insertLine">插入分隔线</view>
				<view class="btn btn-sm btn-ghost" @click="transform('upper')">全转大写</view>
				<view class="btn btn-sm btn-ghost" @click="transform('lower')">全转小写</view>
				<view class="btn btn-sm btn-ghost" @click="transform('empty')">去空行</view>
				<view class="btn btn-sm btn-ghost" @click="transform('dedupe')">行去重</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { themeMixin } from '../../utils/theme.js'
	import { readFile, writeFile, safeName } from '../../utils/fs.js'
	import { textStats, textTransform, formatDate } from '../../utils/convert.js'

	export default {
		mixins: [themeMixin],
		data() {
			return {
				name: '', content: '', dirty: false, showFind: false,
				findText: '', replaceText: '', timer: null
			}
		},
		computed: {
			stats() { return textStats(this.content) },
			matchCount() {
				if (!this.findText) return 0
				return this.content.split(this.findText).length - 1
			}
		},
		onLoad(options) {
			const n = options && options.name ? decodeURIComponent(options.name) : ''
			if (n) {
				this.name = n
				this.load()
			} else {
				this.content = uni.getStorageSync('utool_draft_new') || ''
			}
		},
		onUnload() {
			if (this.timer) clearTimeout(this.timer)
			this.saveDraft()
		},
		methods: {
			async load() {
				try {
					this.content = await readFile(this.name)
					this.dirty = false
					uni.setNavigationBarTitle({ title: this.name })
				} catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
			},
			draftKey() { return 'utool_draft_' + (this.name || 'new') },
			saveDraft() {
				try { uni.setStorageSync(this.draftKey(), this.content) } catch (e) { /* 忽略存储已满 */ }
			},
			onInput() {
				this.dirty = true
				if (this.timer) clearTimeout(this.timer)
				this.timer = setTimeout(() => this.saveDraft(), 600)
			},
			askName() {
				return new Promise(resolve => {
					uni.showModal({
						title: '文件名', editable: true, placeholderText: '例如 笔记.txt',
						success: r => resolve(r.confirm && r.content ? String(r.content).trim() : ''),
						fail: () => resolve('')
					})
				})
			},
			async save() {
				try {
					if (!this.name) {
						const n = await this.askName()
						if (!n) return
						this.name = safeName(n)
					}
					await writeFile(this.name, this.content)
					this.dirty = false
					this.saveDraft()
					uni.setNavigationBarTitle({ title: this.name })
					uni.showToast({ title: '保存成功', icon: 'success' })
				} catch (e) { uni.showToast({ title: e.message, icon: 'none' }) }
			},
			async saveAs() {
				const n = await this.askName()
				if (!n) return
				this.name = safeName(n)
				await this.save()
			},
			replaceAll() {
				if (!this.findText) return uni.showToast({ title: '请先输入查找内容', icon: 'none' })
				const count = this.matchCount
				this.content = this.content.split(this.findText).join(this.replaceText)
				this.onInput()
				uni.showToast({ title: '已替换 ' + count + ' 处', icon: 'none' })
			},
			copyAll() {
				if (!this.content) return uni.showToast({ title: '内容为空', icon: 'none' })
				uni.setClipboardData({ data: this.content })
			},
			clearAll() {
				uni.showModal({
					title: '清空内容', content: '确定清空编辑区吗？',
					success: r => { if (r.confirm) { this.content = ''; this.onInput() } }
				})
			},
			transform(op) { this.content = textTransform(this.content, op); this.onInput() },
			insertTime() { this.content += '\n' + formatDate(new Date()) + '\n'; this.onInput() },
			insertLine() { this.content += '\n------------------------\n'; this.onInput() }
		}
	}
</script>

<style scoped>
	.file-bar { display: flex; justify-content: space-between; align-items: center; }
	.file-name { font-size: 28rpx; font-weight: 600; color: var(--text); word-break: break-all; }
	.state { font-size: 22rpx; color: var(--ok); background: var(--ok-soft); padding: 6rpx 16rpx; border-radius: var(--radius-pill); }
	.state.dirty { color: var(--warn); background: var(--warn-soft); }
	.edit-card { padding: 20rpx; }
	.edit-area { height: 620rpx; border: none; background: var(--input-bg); font-size: 27rpx; }
	.status { display: flex; justify-content: space-between; font-size: 22rpx; color: var(--text-3); padding: 12rpx 8rpx 0; }
</style>
