<template>
	<view :class="themeClass" class="fade-in">
		<view class="hero mine-hero">
			<view class="mine-avatar">{{ account.avatar }}</view>
			<view class="grow">
				<view class="mine-title">{{ account.name }}</view>
				<view class="mine-sub">{{ isGuest(account) ? '游客模式 · 无需登录即可使用全部功能' : '已登录（本机账号）' }}</view>
			</view>
			<view class="mine-badge" v-if="isGuest(account)">游客</view>
		</view>

		<tb-section title="账号" desc="游客模式默认可用，登录仅为本机身份">
			<view class="group">
				<view class="list-row" @click="setNickname">
					<view class="list-icon">名</view>
					<view class="list-main">
						<view class="list-title">设置昵称 / 头像</view>
						<view class="list-sub">当前：{{ account.name }} {{ account.avatar }}</view>
					</view>
					<view class="list-arrow">›</view>
				</view>
				<view class="list-row" @click="toggleLogin">
					<view class="list-icon">{{ isGuest(account) ? '登' : '退' }}</view>
					<view class="list-main">
						<view class="list-title">{{ isGuest(account) ? '登录（设为我的账号）' : '退出登录（回到游客）' }}</view>
						<view class="list-sub">{{ isGuest(account) ? '登录只标记本机身份，不上传任何信息' : '退出后将回到游客模式' }}</view>
					</view>
					<view class="list-arrow">›</view>
				</view>
			</view>
			<view class="hint" style="margin: 16rpx 8rpx">账号仅保存在本机，用于云端备份时标识文件归属；不登录也能使用全部工具与备份。</view>
		</tb-section>

		<tb-section title="外观" desc="主题会同步到状态栏与底部导航">
			<tb-card :flat="true">
				<view class="row">
					<view class="chip" v-for="t in themeOptions" :key="t.key" :class="{ on: themeMode === t.key }" @click="changeTheme(t.key)">
						{{ t.name }}
					</view>
				</view>
				<view class="hint">{{ themeDesc }}</view>
			</tb-card>
		</tb-section>

		<tb-section title="联网功能" desc="默认关闭，只在需要时手动开启">
			<tb-card :flat="true">
				<view class="setting-row">
					<view class="grow">
						<view class="setting-title">允许联网</view>
						<view class="setting-sub">开启后，联网工具在你点击按钮时才会发请求</view>
					</view>
					<switch :key="switchKey" :checked="netOn" color="#4f6ef7" @change="onNetToggle" />
				</view>
				<view class="hint">当前{{ netOn ? '已开启' : '已关闭（推荐）' }} · 关闭时应用不会发出任何请求，切换立即生效。</view>
			</tb-card>
		</tb-section>

		<tb-section title="常用">
			<view class="group">
				<view class="list-row" @click="goSearch">
					<view class="list-icon">搜</view>
					<view class="list-main"><view class="list-title">全局快速检索</view><view class="list-sub">支持拼音首字母、别名、历史与热门词</view></view>
					<view class="list-arrow">›</view>
				</view>
				<view class="list-row" @click="goIntro">
					<view class="list-icon">介</view>
					<view class="list-main"><view class="list-title">回看功能介绍</view><view class="list-sub">3 页快速了解这个 App</view></view>
					<view class="list-arrow">›</view>
				</view>
				<view class="list-row" @click="goAbout">
					<view class="list-icon">关</view>
					<view class="list-main"><view class="list-title">关于我们</view><view class="list-sub">开发团队、联系方式与隐私说明</view></view>
					<view class="list-arrow">›</view>
				</view>
				<view class="list-row" @click="goTool('netupdate')">
					<view class="list-icon">版</view>
					<view class="list-main"><view class="list-title">检查更新 / 版本地址</view><view class="list-sub">配置版本 JSON 后比对新版本</view></view>
					<view class="list-arrow">›</view>
				</view>
			</view>
		</tb-section>

		<tb-section title="数据">
			<view class="group">
				<view class="list-row" @click="clearCache">
					<view class="list-icon">清</view>
					<view class="list-main"><view class="list-title">清理使用记录</view><view class="list-sub">最近使用、收藏、搜索历史、扫码历史、一言收藏</view></view>
					<view class="list-arrow">›</view>
				</view>
			</view>
			<view class="hint" style="margin: 16rpx 8rpx">不会删除文件管理器里的文件、编辑器草稿、主题与联网设置。</view>
		</tb-section>

		<view class="copyright">口袋工具箱 v2.2.1 · 主开发 WorkBuddy AI 助手 · 协作开发 Ezer Zheng</view>
		<view class="safe-bottom"></view>
	</view>
</template>

<script>
	import { themeMixin, THEME_OPTIONS, getThemeMode, setThemeMode } from '../../utils/theme.js'
	import { isNetEnabled, setNetEnabled } from '../../utils/net.js'
	import { TOOLS } from '../../utils/tools.js'
	import { confirm, toast, ok } from '../../utils/ui.js'
	import { getAccount, isGuest, updateProfile, login, logout, AVATARS } from '../../utils/account.js'
	import TbCard from '../../components/ui/tb-card.vue'
	import TbSection from '../../components/ui/tb-section.vue'

	const CACHE_KEYS = ['utool_recent', 'utool_favs', 'tb_search_history', 'tb_scan_history', 'tb_quote_favs', 'tb_qr_prefill']

	export default {
		components: { TbCard, TbSection },
		mixins: [themeMixin],
		data() {
			return {
				themeOptions: THEME_OPTIONS,
				themeMode: 'light',
				netOn: false,
				switchKey: 0,
				offline: TOOLS.filter(t => !t.net).length,
				account: { name: '游客', avatar: '🙂', id: '', type: 'guest' }
			}
		},
		computed: {
			themeDesc() {
				const t = this.themeOptions.find(x => x.key === this.themeMode)
				return t ? t.desc : ''
			}
		},
		onShow() {
			this.themeMode = getThemeMode()
			this.netOn = isNetEnabled()
			this.account = getAccount()
		},
		methods: {
			// 模板里调用了 isGuest(account)。Vue3 Options API 的模板只能访问组件实例属性，
			// 单纯 import 的函数不会自动暴露，不挂到 methods 会在渲染时抛
			// "isGuest is not a function" 并导致整页白屏。
			isGuest,
			changeTheme(k) {
				this.themeMode = setThemeMode(k)
				toast('已切换为' + (this.themeOptions.find(x => x.key === k) || {}).name)
			},
			promptName(def) {
				return new Promise(resolve => {
					uni.showModal({
						title: '设置昵称', editable: true, placeholderText: '给账号起个名字',
						content: def || '',
						success: r => resolve(r.confirm ? String(r.content || '').trim() : null),
						fail: () => resolve(null)
					})
				})
			},
			setNickname() {
				const def = this.account.name === '游客' ? '' : this.account.name
				this.promptName(def).then(name => {
					if (name === null) return
					uni.showActionSheet({
						title: '选择头像',
						itemList: AVATARS,
						success: r => {
							updateProfile({ name, avatar: AVATARS[r.tapIndex] })
							this.account = getAccount()
							toast('已更新')
						},
						fail: () => {
							updateProfile({ name })
							this.account = getAccount()
							toast('已更新')
						}
					})
				})
			},
			toggleLogin() {
				if (isGuest(this.account)) {
					this.promptName('').then(name => {
						if (name === null) return
						login(name)
						this.account = getAccount()
						toast('已登录（本机账号）')
					})
				} else {
					uni.showModal({
						title: '退出登录', content: '将回到游客模式，昵称会保留以便下次使用。确定吗？',
						success: r => {
							if (r.confirm) {
								logout()
								this.account = getAccount()
								toast('已退出到游客模式')
							}
						}
					})
				}
			},
			async onNetToggle(e) {
				const v = e.detail.value
				if (v) {
					const yes = await confirm(
						'开启后，只有联网工具在你主动点击按钮时才会访问公开接口；其余 ' + this.offline + ' 个工具依然完全离线。关闭开关可随时停止所有请求。',
						'开启联网功能'
					)
					if (!yes) { this.netOn = false; this.switchKey++; return }
					setNetEnabled(true)
					this.netOn = true
					ok('已开启联网')
				} else {
					setNetEnabled(false)
					this.netOn = false
					toast('已关闭联网')
				}
			},
			goSearch() { uni.navigateTo({ url: '/pages/search/search' }) },
			goIntro() { uni.navigateTo({ url: '/pages/intro/intro' }) },
			goAbout() { uni.navigateTo({ url: '/pages/about/about' }) },
			goTool(k) { uni.navigateTo({ url: '/pages/tool/tool?key=' + k }) },
			async clearCache() {
				if (!await confirm('将清除最近使用、工具收藏、搜索历史、扫码历史与一言收藏。文件与草稿保留，确定继续？', '清理使用记录')) return
				for (const k of CACHE_KEYS) {
					try { uni.removeStorageSync(k) } catch (e) {}
				}
				ok('已清理')
			}
		}
	}
</script>

<style scoped>
	.mine-hero { display: flex; flex-direction: row; align-items: center; }
	.mine-badge { font-size: 20rpx; color: #fff; background: rgba(255, 255, 255, .22); padding: 6rpx 16rpx; border-radius: 999rpx; flex-shrink: 0; margin-left: 16rpx; }
	.mine-avatar {
		width: 100rpx; height: 100rpx; border-radius: 28rpx; margin-right: 24rpx;
		background: rgba(255, 255, 255, .22); color: #ffffff; font-size: 40rpx;
		font-weight: 700; display: flex; align-items: center; justify-content: center;
	}
	.mine-title { font-size: 34rpx; font-weight: 700; }
	.mine-sub { font-size: 23rpx; opacity: .88; margin-top: 12rpx; }
	.group { border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); margin-bottom: 8rpx; }
	.group .list-row:last-child { border-bottom: none; }
	.setting-row { display: flex; flex-direction: row; align-items: center; }
	.setting-title { font-size: 28rpx; color: var(--text); font-weight: 500; }
	.setting-sub { font-size: 23rpx; color: var(--text-3); margin-top: 8rpx; }
	.copyright { text-align: center; font-size: 22rpx; color: var(--text-3); padding: 30rpx 0 10rpx; line-height: 1.7; }
</style>
