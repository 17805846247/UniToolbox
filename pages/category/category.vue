<template>
	<view :class="themeClass" class="fade-in">
		<!-- 页内筛选 + 右侧「全局」进入全屏检索：1.x 的独立输入框与 ⌘K 大横幅合并为一处 -->
		<tb-searchbar mode="filter" :value="kw" :placeholder="'在 ' + total + ' 个工具中筛选…'"
			@input="onInput" @global="goSearch" @confirm="goSearch" />

		<view class="row cats">
			<view class="chip" :class="{ on: active === 'all' }" @click="active = 'all'">全部</view>
			<view class="chip" :class="{ on: active === 'fav' }" @click="active = 'fav'">★ 收藏</view>
			<view class="chip" v-for="c in categories" :key="c.key" :class="{ on: active === c.key }" @click="active = c.key">
				{{ c.name }}
			</view>
		</view>

		<view v-if="showNetTip" class="net-tip">
			<text>联网工具默认关闭</text>
			<text class="net-link" @click="goSettings">去开启 ›</text>
		</view>

		<block v-for="g in groups" :key="g.key">
			<tb-section :title="g.name" :action="g.tools.length + ' 个'"></tb-section>
			<view class="group">
				<view class="list-row" v-for="t in g.tools" :key="t.key" @click="open(t)">
					<tb-badge :tool="t" size="md" />
					<view class="list-main">
						<view class="list-title">
							{{ t.name }}
							<text v-if="t.net" class="tag-net">联网</text>
						</view>
						<view class="list-sub">{{ t.desc }}</view>
					</view>
					<view class="fav" @click.stop="toggleFav(t.key)">{{ isFav(t.key) ? '★' : '☆' }}</view>
					<view class="list-arrow">›</view>
				</view>
			</view>
		</block>

		<view v-if="!groups.length" class="empty">
			{{ active === 'fav' ? '还没有收藏工具，点列表右侧的 ☆ 收藏' : '没有找到相关工具，换个关键词或点搜索条右侧「全局」' }}
		</view>
		<view class="safe-bottom"></view>
	</view>
</template>

<script>
	import { themeMixin } from '../../utils/theme.js'
	import { CATEGORIES, TOOLS, SEARCH_INDEX, smartSearch, isTabPage } from '../../utils/tools.js'
	import { toast } from '../../utils/ui.js'
	import TbSection from '../../components/ui/tb-section.vue'
	import TbBadge from '../../components/ui/tb-badge.vue'
	import TbSearchbar from '../../components/ui/tb-searchbar.vue'

	export default {
		components: { TbSection, TbBadge, TbSearchbar },
		mixins: [themeMixin],
		data() {
			return {
				kw: '', active: 'all', categories: CATEGORIES, favs: [], recent: [],
				total: TOOLS.length
			}
		},
		computed: {
			matched() {
				let arr
				if (!this.kw) arr = TOOLS
				else arr = smartSearch(this.kw, SEARCH_INDEX, { favs: this.favs, recent: this.recent })
					.map(t => TOOLS.find(x => x.key === t.key))
					.filter(Boolean)
				// 收藏筛选从首页移到目录页，在完整目录里筛选更顺手
				if (this.active === 'fav') arr = arr.filter(t => this.favs.indexOf(t.key) >= 0)
				return arr
			},
			showNetTip() {
				return this.active === 'network' || (this.kw && this.matched.some(t => t.net))
			},
			groups() {
				return this.categories
					.filter(c => this.active === 'all' || this.active === 'fav' || this.active === c.key)
					.map(c => ({ key: c.key, name: c.name, tools: this.matched.filter(t => t.cat === c.key) }))
					.filter(g => g.tools.length > 0)
			}
		},
		onShow() {
			this.loadFavs()
			// 首页分类卡片跳转时带的预设分类（switchTab 不支持 query，用一次性存储传递）
			try {
				const preset = uni.getStorageSync('tb_cat_preset')
				if (preset) {
					this.active = preset
					uni.removeStorageSync('tb_cat_preset')
				}
			} catch (e) {}
		},
		methods: {
			loadFavs() {
				try {
					const f = uni.getStorageSync('utool_favs')
					const r = uni.getStorageSync('utool_recent')
					this.favs = Array.isArray(f) ? f : []
					this.recent = Array.isArray(r) ? r : []
				} catch (e) { this.favs = []; this.recent = [] }
			},
			onInput(v) { this.kw = v },
			isFav(k) { return this.favs.indexOf(k) >= 0 },
			toggleFav(k) {
				this.favs = this.isFav(k) ? this.favs.filter(x => x !== k) : this.favs.concat([k])
				try { uni.setStorageSync('utool_favs', this.favs) } catch (e) {}
				toast(this.isFav(k) ? '已收藏' : '已取消')
			},
			open(t) {
				try {
					const r = uni.getStorageSync('utool_recent')
					const old = Array.isArray(r) ? r : []
					uni.setStorageSync('utool_recent', [t.key].concat(old.filter(k => k !== t.key)).slice(0, 8))
				} catch (e) {}
				const url = t.page || ('/pages/tool/tool?key=' + t.key)
				if (isTabPage(url)) uni.switchTab({ url: t.page })
				else uni.navigateTo({ url })
			},
			goSearch() { uni.navigateTo({ url: '/pages/search/search' }) },
			goSettings() { uni.switchTab({ url: '/pages/mine/mine' }) }
		}
	}
</script>

<style scoped>
	.cats { margin-bottom: var(--sp-1); }
	.net-tip {
		display: flex; flex-direction: row; align-items: center;
		background: var(--primary-soft); color: var(--primary);
		border-radius: var(--radius-sm); padding: 16rpx var(--sp-4);
		font-size: 23rpx; margin-bottom: var(--sp-2);
	}
	.net-link { font-weight: 600; margin-left: auto; }
	.group { border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); margin-bottom: var(--sp-2); }
	.group .list-row:last-child { border-bottom: none; }
	.list-main { margin-left: 20rpx; }
	.fav { color: #f5b301; font-size: 32rpx; margin-right: var(--sp-2); }
</style>
