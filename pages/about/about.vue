<template>
	<view :class="themeClass" class="fade-in">
		<view class="hero about-hero">
			<view class="logo">口</view>
			<view class="app-name">口袋工具箱</view>
			<view class="app-ver">v{{ version }} · {{ total }} 个工具</view>
			<view class="app-slogan">把常用工具装进口袋，离线也能用</view>
		</view>

		<tb-card title="关于这个应用">
			<view class="para">
				口袋工具箱是一个面向日常使用与开发调试的轻量工具合集，用 uni-app 开发，可运行于 Android，也可编译成 H5 在浏览器里使用。
			</view>
			<view class="para">
				{{ total }} 个工具覆盖格式转换、文件编辑、生活计算、日常工具与联网调试：图片换格式、JSON 格式化、二维码与哈希校验、智能识别、Cron 表达式、密码强度、摩斯电码、贷款与个税计算、AA 分账、农历生肖、文本 Diff、单位与日期换算，以及能随手记事的文件管理器与文本编辑器。
			</view>
			<view class="para">
				2.0 版本重做了界面：统一分类色彩与卡片节奏、把首页精简为搜索与分类导航、完整目录集中到「工具」标签。2.1 修复了引导页空白、搜索框中文输入与深色主题下的头图显示，并从开源工具箱社区汲取灵感，新增智能识别、Cron 表达式、密码强度、摩斯电码与 AA 分账等离线工具。
			</view>
			<view class="para">
				设计上坚持三条原则：<text class="strong">离线优先</text>（{{ offline }} 个工具完全本地计算）、<text class="strong">零依赖</text>（不引第三方 SDK、不接后端）、<text class="strong">隐私可控</text>（联网默认关闭，只有你主动开启并点击时才会发请求）。
			</view>
		</tb-card>

		<tb-card title="功能概览" subtitle="按分类统计，点「工具」标签可逐个试用">
			<view class="kv" v-for="c in categories" :key="c.key">
				<text>{{ c.name }}</text><text>{{ c.count }} 个</text>
			</view>
			<view class="kv"><text>其中纯离线工具</text><text>{{ offline }} 个</text></view>
			<view class="kv"><text>联网功能</text><text>{{ online }} 个（默认关闭）</text></view>
		</tb-card>

		<tb-card title="开发团队">
			<view class="dev-row">
				<view class="avatar ai">AI</view>
				<view class="grow">
					<view class="dev-name">主开发 · WorkBuddy AI 助手</view>
					<view class="dev-role">需求拆解 / 架构设计 / 全量编码 / 自动化测试</view>
				</view>
			</view>
			<view class="dev-row">
				<view class="avatar ez">EZ</view>
				<view class="grow">
					<view class="dev-name">协作开发 · Ezer Zheng</view>
					<view class="dev-role">需求定义 / 产品构思 / 体验设计</view>
				</view>
			</view>
			<view class="divider"></view>
			<view class="para">
				开发者简介：本项目由 WorkBuddy AI 助手承担主要的工程实现工作——从项目骨架、{{ total }} 个工具的算法与界面，到深浅色主题、联网层、离线农历数据与全量回归测试；Ezer Zheng 作为协作开发，提出产品方向、功能取舍与体验要求，并参与验收。我们希望用尽量少的代码、尽量少的权限，做出一个真正省心的小工具。
			</view>
		</tb-card>

		<tb-card title="联系我们">
			<view class="mail" @click="copyText(EMAIL)">
				<view class="mail-icon">@</view>
				<view class="grow">
					<view class="mail-label">邮箱（点击复制）</view>
					<view class="mail-value">{{ EMAIL }}</view>
				</view>
			</view>
			<view class="row" style="margin-top: 20rpx">
				<tb-btn type="primary" size="sm" @click="copyText(EMAIL)">复制邮箱</tb-btn>
				<tb-btn type="plain" size="sm" @click="sendMail">发邮件</tb-btn>
			</view>
			<view class="hint">欢迎反馈问题、提出想加的工具，或聊聊协作开发。</view>
		</tb-card>

		<tb-card title="隐私与联网说明">
			<view class="bullet">· {{ offline }} 个离线工具不会发起任何请求，输入内容只留在本机。</view>
			<view class="bullet">· 联网默认关闭；开启后也只在你点击按钮时请求对应公开接口，不上传文件、草稿或剪贴板。</view>
			<view class="bullet">· 搜索历史、最近使用与收藏只存本机，可在「我的 → 清理使用记录」一键清除；文件在应用私有目录，卸载即清除。</view>
			<view class="bullet">· 无账号体系、无广告、无统计上报、无后台常驻服务。</view>
		</tb-card>

		<tb-card title="技术与致谢">
			<view class="kv"><text>框架</text><text>uni-app (Vue 3) / HBuilderX</text></view>
			<view class="kv"><text>哈希算法</text><text>MD5 / SHA-1 / SHA-256 本地实现</text></view>
			<view class="kv"><text>二维码 / 条码</text><text>QR Code 矩阵、EAN-13 编码</text></view>
			<view class="kv"><text>农历数据</text><text>1900-2100 离线表，构建期由 ICU 校验</text></view>
			<view class="kv"><text>网络数据</text><text>免 Key 公开接口，多源容错</text></view>
			<view class="hint">感谢 DCloud 与 uni-app 社区提供的开发工具与文档。</view>
		</tb-card>

		<view class="copyright">口袋工具箱 v{{ version }} · 主开发 WorkBuddy AI 助手 · 协作开发 Ezer Zheng</view>
		<view class="safe-bottom"></view>
	</view>
</template>

<script>
	import { themeMixin } from '../../utils/theme.js'
	import { CATEGORIES, TOOLS, toolsOf } from '../../utils/tools.js'
	import { copyText, toast } from '../../utils/ui.js'
	import TbCard from '../../components/ui/tb-card.vue'
	import TbBtn from '../../components/ui/tb-btn.vue'

	const EMAIL = '17805846247@163.com'
	const VERSION = '2.2.1'

	export default {
		components: { TbCard, TbBtn },
		mixins: [themeMixin],
		data() { return { EMAIL, version: VERSION } },
		computed: {
			categories() {
				return CATEGORIES.map(c => ({ key: c.key, name: c.name, count: toolsOf(c.key).length }))
			},
			total() { return TOOLS.length },
			offline() { return TOOLS.filter(t => !t.net).length },
			online() { return TOOLS.filter(t => t.net).length }
		},
		methods: {
			copyText,
			sendMail() {
				// #ifdef APP-PLUS
				try { plus.runtime.openURL('mailto:' + EMAIL) } catch (e) { toast('本机没有可用的邮件应用') }
				// #endif
				// #ifdef H5
				try { window.location.href = 'mailto:' + EMAIL } catch (e) { toast('请手动复制邮箱') }
				// #endif
			}
		}
	}
</script>

<style scoped>
	.about-hero { text-align: center; padding: 50rpx 34rpx 44rpx; }
	.logo {
		width: 120rpx; height: 120rpx; border-radius: 34rpx; margin: 0 auto 24rpx;
		background: rgba(255, 255, 255, .22); color: #ffffff; font-size: 56rpx;
		font-weight: 700; display: flex; align-items: center; justify-content: center;
	}
	.app-name { font-size: 40rpx; font-weight: 700; }
	.app-ver { font-size: 24rpx; opacity: .9; margin-top: 12rpx; }
	.app-slogan { font-size: 24rpx; opacity: .82; margin-top: 16rpx; }
	.para { font-size: 26rpx; color: var(--text-2); line-height: 1.95; margin-bottom: 18rpx; }
	.para:last-child { margin-bottom: 0; }
	.strong { color: var(--primary); font-weight: 600; }
	.dev-row { display: flex; flex-direction: row; align-items: center; margin-bottom: 24rpx; }
	.avatar {
		width: 84rpx; height: 84rpx; border-radius: 24rpx; margin-right: 22rpx;
		display: flex; align-items: center; justify-content: center;
		color: #ffffff; font-size: 28rpx; font-weight: 600;
	}
	.avatar.ai { background: linear-gradient(135deg, #4f6ef7, #7c5cf5); }
	.avatar.ez { background: linear-gradient(135deg, #16a06a, #0ea5e9); }
	.dev-name { font-size: 28rpx; font-weight: 600; color: var(--text); }
	.dev-role { font-size: 23rpx; color: var(--text-3); margin-top: 8rpx; }
	.mail { display: flex; flex-direction: row; align-items: center; }
	.mail-icon {
		width: 76rpx; height: 76rpx; border-radius: 20rpx; margin-right: 22rpx;
		background: var(--primary-soft); color: var(--primary); font-size: 34rpx;
		display: flex; align-items: center; justify-content: center;
	}
	.mail-label { font-size: 23rpx; color: var(--text-3); }
	.mail-value { font-size: 28rpx; color: var(--primary); font-weight: 600; margin-top: 8rpx; }
	.bullet { font-size: 25rpx; color: var(--text-2); line-height: 1.9; margin-bottom: 10rpx; }
	.copyright { text-align: center; font-size: 22rpx; color: var(--text-3); padding: 20rpx 0 10rpx; line-height: 1.7; }
</style>
