<template>
	<!--
		引导页 2.1 修复：
		原先用 swiper 组件 + flex:1 拉伸，但 uni-app 的 swiper 必须有明确 height，
		而父容器只有 min-height，flex 基准为 0 → swiper 高度塌陷，三屏内容全看不见。
		这里改为「确定高度的普通容器 + 单页渲染 + 左右滑动手势」，内容必定可见。
	-->
	<view :class="[isDark ? 'page-dark' : '', 'intro']" :style="{ paddingTop: statusBar + 'px' }"
		@touchstart="onTouchStart" @touchend="onTouchEnd">
		<view class="skip" :style="{ top: (statusBar + 14) + 'px' }" @click.stop="finish">跳过</view>

		<view class="slide-wrap">
			<view class="slide" :key="cur">
				<view class="art" :style="{ background: current.bg }">
					<view class="art-ring"></view>
					<view class="art-badge">{{ current.badge }}</view>
				</view>
				<view class="slide-title">{{ current.title }}</view>
				<view class="slide-desc">{{ current.desc }}</view>
				<view class="slide-tags">
					<text class="tag" v-for="(t, j) in current.tags" :key="j">{{ t }}</text>
				</view>
			</view>
		</view>

		<view class="footer">
			<view class="dots">
				<view class="dot" v-for="(p, i) in pages" :key="i" :class="{ on: cur === i }" @click="cur = i"></view>
			</view>
			<view class="btn-main" @click="next">{{ cur === pages.length - 1 ? '开始使用' : '下一步' }}</view>
			<view class="foot-hint">首次使用引导 · 可在「我的 - 回看功能介绍」再次打开</view>
		</view>
	</view>
</template>

<script>
	import { themeMixin } from '../../utils/theme.js'

	export default {
		mixins: [themeMixin],
		data() {
			return {
				cur: 0,
				statusBar: 20,
				startX: 0,
				startY: 0,
				pages: [
					{
						badge: '49', title: '把常用工具装进口袋',
						desc: '49 个小工具覆盖格式转换、文件编辑、生活计算、日常工具与开发调试。不用再为一句话转码、一张图换格式而到处找网站。',
						tags: ['格式转换', '文件编辑', '实用工具', '网络调试'],
						bg: 'linear-gradient(135deg,#4f6ef7,#7c5cf5)'
					},
					{
						badge: '离', title: '离线优先，隐私放心',
						desc: '其中 44 个工具完全在本机计算，不联网、不上传文件。联网功能默认关闭，只有你主动开启并点击时才会发起请求。',
						tags: ['本地计算', '默认不联网', '无广告', '零依赖'],
						bg: 'linear-gradient(135deg,#16a06a,#0ea5e9)'
					},
					{
						badge: '简', title: '清爽界面，一眼找到',
						desc: '2.x 重做信息层级：首页只留搜索、最近使用与分类导航，完整目录收进「工具」标签；拼音检索、智能识别、文件管理与深浅色主题全都保留。',
						tags: ['分类导航', '全局检索', '深浅主题', '工具收藏'],
						bg: 'linear-gradient(135deg,#e8813a,#db2777)'
					}
				]
			}
		},
		computed: {
			current() { return this.pages[this.cur] || this.pages[0] }
		},
		onLoad() {
			try { this.statusBar = uni.getSystemInfoSync().statusBarHeight || 20 } catch (e) {}
		},
		methods: {
			onTouchStart(e) {
				const t = e.touches && e.touches[0]
				if (t) { this.startX = t.clientX; this.startY = t.clientY }
			},
			onTouchEnd(e) {
				const t = e.changedTouches && e.changedTouches[0]
				if (!t) return
				const dx = t.clientX - this.startX
				const dy = t.clientY - this.startY
				if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
				if (dx < 0 && this.cur < this.pages.length - 1) this.cur++
				else if (dx > 0 && this.cur > 0) this.cur--
			},
			next() {
				if (this.cur < this.pages.length - 1) this.cur++
				else this.finish()
			},
			finish() {
				try { uni.setStorageSync('tb_intro_shown', true) } catch (e) {}
				const pages = getCurrentPages()
				if (pages.length > 1) uni.navigateBack()
				else uni.switchTab({ url: '/pages/index/index' })
			}
		}
	}
</script>

<style scoped>
	.intro {
		/* 用 height 而非 min-height：给 flex 子项一个确定的高度基准 */
		height: 100vh; min-height: 100vh; box-sizing: border-box;
		padding-left: 0; padding-right: 0; padding-bottom: 0;
		background: var(--bg); color: var(--text);
		display: flex; flex-direction: column; overflow: hidden;
	}
	.skip {
		position: absolute; right: 36rpx; z-index: 5;
		font-size: 26rpx; color: var(--text-2); padding: 10rpx 20rpx;
	}
	.slide-wrap { flex: 1; min-height: 0; display: flex; align-items: center; }
	.slide {
		width: 100%; box-sizing: border-box; padding: 40rpx 56rpx 20rpx; text-align: center;
		animation: tbSlide .3s ease both;
	}
	@keyframes tbSlide { from { opacity: 0; transform: translateX(26rpx); } to { opacity: 1; transform: none; } }
	.art {
		width: 260rpx; height: 260rpx; border-radius: 72rpx; margin: 0 auto 70rpx;
		display: flex; align-items: center; justify-content: center;
		position: relative; overflow: hidden; box-shadow: 0 20rpx 60rpx rgba(79, 110, 247, .28);
	}
	.intro.page-dark .art { box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, .4); }
	.art-ring {
		position: absolute; width: 340rpx; height: 340rpx; border-radius: 50%;
		border: 2rpx solid rgba(255, 255, 255, .22);
	}
	.art-badge { color: #ffffff; font-size: 92rpx; font-weight: 700; z-index: 1; }
	.slide-title { font-size: 44rpx; font-weight: 700; color: var(--text); }
	.slide-desc { font-size: 27rpx; color: var(--text-2); line-height: 1.9; margin-top: 26rpx; }
	.slide-tags { margin-top: 36rpx; display: flex; flex-direction: row; flex-wrap: wrap; justify-content: center; }
	.tag {
		font-size: 23rpx; color: var(--primary); background: var(--primary-soft);
		padding: 10rpx 22rpx; border-radius: 999rpx; margin: 8rpx 10rpx;
	}
	.footer { padding: 20rpx 56rpx 70rpx; flex-shrink: 0; }
	.dots { display: flex; flex-direction: row; justify-content: center; margin-bottom: 40rpx; }
	.dot { width: 14rpx; height: 14rpx; border-radius: 999rpx; background: var(--line); margin: 0 8rpx; transition: width .2s; }
	.dot.on { width: 44rpx; background: var(--primary); }
	.btn-main {
		height: 92rpx; border-radius: 22rpx; background: var(--primary); color: #ffffff;
		font-size: 30rpx; font-weight: 600; display: flex; align-items: center; justify-content: center;
		box-shadow: 0 12rpx 30rpx rgba(79, 110, 247, .28);
	}
	.btn-main:active { opacity: .85; }
	.foot-hint { text-align: center; font-size: 22rpx; color: var(--text-3); margin-top: 26rpx; }
</style>
