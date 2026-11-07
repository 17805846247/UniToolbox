<template>
	<view :class="themeClass" class="fade-in">
		<!-- 品牌头：只保留一句定位与一个介绍入口，统计数字不再到处重复 -->
		<view class="hero">
			<view class="hero-title">口袋工具箱</view>
			<view class="hero-sub">把常用工具装进口袋，离线也能用</view>
			<view class="hero-link" @click="goIntro">认识这个 App ›</view>
		</view>

		<!-- 全站唯一的主搜索入口 -->
		<tb-searchbar mode="link" :placeholder="'搜索 ' + total + ' 个工具 · 支持拼音首字母'" @tap="goSearch('')" />

		<tb-section v-if="recentTools.length" title="最近使用" action="全部工具 ›" @action="goCategory('')">
			<scroll-view scroll-x class="quick-scroll">
				<view class="quick-item" v-for="t in recentTools" :key="t.key" @click="open(t)">
					<tb-badge :tool="t" size="sm" />
					<text class="quick-name">{{ t.name }}</text>
				</view>
			</scroll-view>
		</tb-section>

		<tb-section v-if="favTools.length" title="我的收藏" action="管理 ›" @action="goCategory('fav')">
			<scroll-view scroll-x class="quick-scroll">
				<view class="quick-item" v-for="t in favTools" :key="t.key" @click="open(t)">
					<tb-badge :tool="t" size="sm" />
					<text class="quick-name">{{ t.name }}</text>
				</view>
			</scroll-view>
		</tb-section>

		<tb-section title="按分类浏览" desc="5 个分类，完整目录在「工具」标签" action="全部工具 ›" @action="goCategory('')">
			<view class="cat-grid">
				<view class="cat-card" v-for="c in catCards" :key="c.key" @click="goCategory(c.key)">
					<view class="cat-accent" :style="accentStyle(c.key)"></view>
					<view class="cat-top">
						<tb-badge :tool="c" size="sm" />
						<text class="cat-count">{{ c.count }} 个</text>
					</view>
					<view class="cat-name">{{ c.name }}</view>
					<view class="cat-desc">{{ c.desc }}</view>
				</view>
			</view>
		</tb-section>

		<tb-section title="常用工具" action="查看全部 ›" @action="goCategory('')">
			<view class="grid2">
				<view class="tile" :class="{ 'is-dev': t.dev }" v-for="t in featured" :key="t.key" @click="open(t)">
					<view class="tile-top">
						<tb-badge :tool="t" size="md" />
						<view class="fav" @click.stop="toggleFav(t.key)">{{ isFav(t.key) ? '★' : '☆' }}</view>
					</view>
					<view class="tile-name">{{ t.name }}<text v-if="t.net" class="tag-net">联网</text><text v-if="t.dev" class="tag-dev">待开发</text></view>
					<view class="tile-desc">{{ t.desc }}</view>
				</view>
			</view>
		</tb-section>

		<view class="home-foot">口袋工具箱 2.1 · 完整 {{ total }} 个工具见「工具」标签</view>
		<view class="safe-bottom"></view>
	</view>
</template>

<script>
	import { themeMixin } from '../../utils/theme.js'
	import { CATEGORIES, TOOLS, toolsOf, isTabPage } from '../../utils/tools.js'
	import { accentStyle } from '../../utils/visual.js'
	import { toast } from '../../utils/ui.js'
	import TbSection from '../../components/ui/tb-section.vue'
	import TbBadge from '../../components/ui/tb-badge.vue'
	import TbSearchbar from '../../components/ui/tb-searchbar.vue'

	// 首页只放 8 个高频工具，完整目录统一交给「工具」标签，避免一次铺 49 张卡片
	const FEATURED_KEYS = ['qrcode', 'image', 'json', 'hash', 'detect', 'loan', 'unit', 'password']

	export default {
		components: { TbSection, TbBadge, TbSearchbar },
		mixins: [themeMixin],
		data() {
			return {
				total: TOOLS.length,
				favs: [], recent: [], introChecked: false
			}
		},
		computed: {
			catCards() {
				return CATEGORIES.map(c => Object.assign({}, c, { count: toolsOf(c.key).length }))
			},
			featured() {
				return FEATURED_KEYS.map(k => TOOLS.find(t => t.key === k)).filter(Boolean)
			},
			recentTools() {
				return this.recent.map(k => TOOLS.find(t => t.key === k)).filter(Boolean).slice(0, 8)
			},
			favTools() {
				return this.favs.map(k => TOOLS.find(t => t.key === k)).filter(Boolean)
			}
		},
		onShow() {
			this.load()
			if (this.introChecked) return
			this.introChecked = true
			try {
				if (!uni.getStorageSync('tb_intro_shown')) {
					uni.setStorageSync('tb_intro_shown', true)
					uni.navigateTo({ url: '/pages/intro/intro' })
				}
			} catch (e) {}
		},
		methods: {
			accentStyle,
			load() {
				try {
					const f = uni.getStorageSync('utool_favs')
					const r = uni.getStorageSync('utool_recent')
					this.favs = Array.isArray(f) ? f : []
					this.recent = Array.isArray(r) ? r : []
				} catch (e) {}
			},
			isFav(k) { return this.favs.indexOf(k) >= 0 },
			toggleFav(k) {
				this.favs = this.isFav(k) ? this.favs.filter(x => x !== k) : this.favs.concat([k])
				try { uni.setStorageSync('utool_favs', this.favs) } catch (e) {}
				uni.showToast({ title: this.isFav(k) ? '已收藏' : '已取消', icon: 'none' })
			},
			goSearch(q) {
				uni.navigateTo({ url: '/pages/search/search' + (q ? '?q=' + encodeURIComponent(q) : '') })
			},
			goCategory(key) {
				try { uni.setStorageSync('tb_cat_preset', key || 'all') } catch (e) {}
				uni.switchTab({ url: '/pages/category/category' })
			},
		open(t) {
			if (t && t.dev) { toast('该工具待开发中'); return }
			try {
					const arr = [t.key].concat(this.recent.filter(k => k !== t.key)).slice(0, 8)
					this.recent = arr
					uni.setStorageSync('utool_recent', arr)
				} catch (e) {}
				const url = t.page || ('/pages/tool/tool?key=' + t.key)
				if (isTabPage(url)) uni.switchTab({ url: t.page })
				else uni.navigateTo({ url })
			},
			goIntro() { uni.navigateTo({ url: '/pages/intro/intro' }) }
		}
	}
</script>

<style scoped>
	/* 头图基础样式由 App.vue 全局提供，这里只做首页专属的微调 */
	.hero { padding: 34rpx 32rpx 30rpx; }
	.quick-scroll { white-space: nowrap; width: 100%; }
	.quick-item {
		display: inline-flex; flex-direction: column; align-items: center;
		width: 140rpx; margin-right: var(--sp-2); padding: var(--sp-3) var(--sp-1);
		background: var(--card); border-radius: var(--radius); font-size: 23rpx;
		color: var(--text-2); vertical-align: top; white-space: normal;
		box-shadow: var(--shadow);
	}
	.quick-name { margin-top: 10rpx; line-height: 1.3; text-align: center; }

	.cat-grid { display: flex; flex-direction: row; flex-wrap: wrap; justify-content: space-between; }
	.cat-card {
		position: relative; overflow: hidden;
		width: 48.5%; box-sizing: border-box;
		background: var(--card); border-radius: var(--radius);
		padding: var(--sp-3) var(--sp-3) var(--sp-4); margin-bottom: var(--sp-3);
		box-shadow: var(--shadow); transition: transform .12s ease;
	}
	.cat-card:active { transform: scale(.975); }
	.cat-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 6rpx; }
	.cat-top { display: flex; flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: var(--sp-3); }
	.cat-count { font-size: 22rpx; color: var(--text-3); }
	.cat-name { font-size: 28rpx; font-weight: 600; color: var(--text); }
	.cat-desc { font-size: 21rpx; color: var(--text-3); line-height: 1.5; margin-top: 6rpx; height: 62rpx; overflow: hidden; }

	.tile {
		width: 48%; margin-bottom: var(--sp-3); box-sizing: border-box;
		background: var(--card); border-radius: var(--radius); padding: var(--sp-3);
		box-shadow: var(--shadow); transition: transform .12s ease;
	}
	.tile:active { transform: scale(.975); }
	.tile-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--sp-3); }
	.fav { font-size: 32rpx; color: #f5b301; padding: 0 6rpx; }
	.tile-name { font-size: 27rpx; font-weight: 600; color: var(--text); }
	.tile-desc { font-size: 22rpx; color: var(--text-3); line-height: 1.5; margin-top: 8rpx; min-height: 62rpx; }

	.home-foot { text-align: center; font-size: 22rpx; color: var(--text-3); margin-top: var(--sp-5); }
</style>
