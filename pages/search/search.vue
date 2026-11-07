<template>
	<view :class="themeClass" class="search-page fade-in">
		<view class="bar">
			<view class="bar-input">
				<text class="ico">⌕</text>
				<!-- 非受控输入：中文输入法组合期间不回写 value，避免拼音被打断 -->
				<tb-input class="input-flex" type="text" v-model="kw" :focus="focused"
					confirm-type="search" placeholder="搜索工具、拼音首字母或别名"
					placeholder-class="ph-input" @confirm="openFirst" />
				<text v-if="kw" class="clear" @click="clearKw">✕</text>
			</view>
			<text class="cancel" @click="goBack">取消</text>
		</view>

		<view class="chips">
			<view class="chip" :class="{ on: cat === 'all' }" @click="cat = 'all'">全部</view>
			<view class="chip" v-for="c in cats" :key="c.key" :class="{ on: cat === c.key }" @click="cat = c.key">{{ c.name }}</view>
		</view>

		<view v-if="!kw" class="blocks">
			<view class="block" v-if="history.length">
				<view class="block-head">搜索历史<text class="block-act" @click="clearAll">清空</text></view>
				<view class="row">
					<view class="tag" v-for="h in history" :key="h" @click="useWord(h)">
						{{ h }}<text class="tag-x" @click.stop="delWord(h)">✕</text>
					</view>
				</view>
			</view>

			<view class="block">
				<view class="block-head">热门搜索</view>
				<view class="row">
					<view class="tag hot" v-for="h in hotWords" :key="h" @click="useWord(h)">{{ h }}</view>
				</view>
			</view>

			<view class="block" v-if="recentTools.length">
				<view class="block-head">最近使用</view>
				<view class="mini-row" v-for="t in recentTools" :key="t.key" @click="open(t)">
					<tb-badge :tool="t" size="sm" style="margin-right: 18rpx" />
					<text class="mini-name">{{ t.name }}</text>
					<text class="mini-arrow">›</text>
				</view>
			</view>

			<view class="tip-card">
				<view class="tip-title">⌕ 检索技巧</view>
				<view class="tip-line">拼音首字母 <text class="tip-k">ewm</text> → 二维码；中文别名「房贷」「阴历」同样可搜</view>
				<view class="tip-line">空格分隔多关键词 · <text class="tip-k">#life</text> 限定分类 · 回车打开最佳结果 · <text class="tip-k">Ctrl/⌘+K</text> 唤起</view>
			</view>
		</view>

		<view v-else class="blocks">
			<view class="result-head">
				找到 {{ results.length }} 个工具
				<text class="enter-tip" v-if="results.length" @click="openFirst">⏎ 打开第一个</text>
			</view>
			<view class="result-list">
				<view class="result-row" v-for="(t, i) in results" :key="t.key" @click="open(t)">
					<tb-badge :tool="t" size="md" style="margin-right: 22rpx" />
					<view class="result-main">
						<view class="result-name">
							<text v-for="(s, j) in hl(t.name)" :key="j" :class="{ hit: s.hit }">{{ s.t }}</text>
							<text v-if="i === 0" class="best">最佳</text>
							<text v-if="t.net" class="tag-net">联网</text>
						</view>
						<view class="result-sub">{{ t.desc }}</view>
						<view class="result-cat">{{ catName(t.cat) }}</view>
					</view>
					<view class="result-fav" @click.stop="toggleFav(t.key)">{{ isFav(t.key) ? '★' : '☆' }}</view>
				</view>
			</view>
			<view v-if="!results.length" class="empty-box">
				<view class="empty-icon">⌕</view>
				<view class="empty-title">没有找到「{{ kw }}」</view>
				<view class="empty-sub">试试工具名、拼音首字母或别名，例如 ewm / dk / 汇率</view>
				<view class="btn btn-sm btn-primary" @click="clearKw">清空重搜</view>
			</view>
		</view>
		<view class="safe-bottom"></view>
	</view>
</template>

<script>
	import { themeMixin } from '../../utils/theme.js'
	import { TOOLS, CATEGORIES, SEARCH_INDEX, catName, isTabPage } from '../../utils/tools.js'
	import {
		smartSearch, highlight, HOT_WORDS,
		getHistory, pushHistory, removeHistory, clearHistory
	} from '../../utils/search.js'
	import { toast } from '../../utils/ui.js'
	import TbBadge from '../../components/ui/tb-badge.vue'

	export default {
		components: { TbBadge },
		mixins: [themeMixin],
		data() {
			return {
				kw: '', cat: 'all', focused: true,
				cats: CATEGORIES, hotWords: HOT_WORDS,
				history: [], favs: [], recent: []
			}
		},
		computed: {
			results() {
				return smartSearch(this.kw, SEARCH_INDEX, {
					cat: this.cat === 'all' ? '' : this.cat,
					favs: this.favs, recent: this.recent
				})
			},
			recentTools() {
				return this.recent.map(k => TOOLS.find(t => t.key === k)).filter(Boolean).slice(0, 5)
			}
		},
		onLoad(options) {
			this.kw = (options && options.q) || ''
			this.load()
		},
		onShow() { this.load() },
		mounted() {
			// #ifdef H5
			if (typeof document !== 'undefined') {
				this._onKey = e => {
					if (e.key === 'Escape') this.goBack()
					if (e.key === '/' && document.activeElement && document.activeElement.tagName !== 'INPUT') {
						e.preventDefault()
						this.focused = false
						this.$nextTick(() => { this.focused = true })
					}
				}
				document.addEventListener('keydown', this._onKey)
			}
			// #endif
		},
		beforeUnmount() {
			// #ifdef H5
			if (this._onKey && typeof document !== 'undefined') document.removeEventListener('keydown', this._onKey)
			// #endif
		},
		methods: {
			catName,
			hl(text) { return highlight(text, this.kw) },
			load() {
				this.history = getHistory()
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
				toast(this.isFav(k) ? '已收藏' : '已取消')
			},
			saveRecent(k) {
				try {
					const arr = [k].concat(this.recent.filter(x => x !== k)).slice(0, 8)
					this.recent = arr
					uni.setStorageSync('utool_recent', arr)
				} catch (e) {}
			},
		useWord(w) { this.kw = w },
		clearKw() { this.kw = '' },
			delWord(w) { this.history = removeHistory(w) },
			clearAll() { this.history = clearHistory() },
			openFirst() { if (this.kw && this.results.length) this.open(this.results[0]) },
			open(t) {
				if (!t) return
				if (this.kw) pushHistory(this.kw)
				this.saveRecent(t.key)
				const url = t.page || ('/pages/tool/tool?key=' + t.key)
				if (isTabPage(url)) uni.switchTab({ url: t.page })
				else uni.navigateTo({ url })
			},
			goBack() {
				uni.navigateBack({
					fail: () => uni.switchTab({ url: '/pages/index/index' })
				})
			}
		}
	}
</script>

<style scoped>
	.search-page { min-height: 100vh; padding: var(--sp-3) var(--sp-4) 60rpx; box-sizing: border-box; }
	.bar { display: flex; flex-direction: row; align-items: center; }
	.bar-input {
		flex: 1; display: flex; flex-direction: row; align-items: center;
		background: var(--card); border: 1rpx solid var(--line);
		border-radius: var(--radius-pill); padding: 0 22rpx; height: 88rpx;
		box-shadow: var(--shadow); box-sizing: border-box;
	}
	.ico { font-size: 40rpx; color: var(--primary); margin-right: 12rpx; line-height: 1; flex-shrink: 0; }
	.input-flex {
		flex: 1; min-width: 0; width: 100%; height: 80rpx;
		font-size: 28rpx; color: var(--text);
		-webkit-text-fill-color: var(--text);
		background: transparent; border: none; outline: none;
	}
	.ph-input { color: var(--text-3); font-size: 26rpx; }
	.clear { color: var(--text-3); font-size: 26rpx; padding: 0 8rpx; flex-shrink: 0; }
	.cancel { color: var(--primary); font-size: 27rpx; margin-left: 22rpx; }
	.chips { display: flex; flex-direction: row; flex-wrap: wrap; margin: var(--sp-3) 0 6rpx; }
	.blocks { margin-top: var(--sp-2); }
	.block {
		background: var(--card); border-radius: var(--radius);
		padding: 24rpx 26rpx; margin-bottom: 20rpx; box-shadow: var(--shadow);
	}
	.block-head { font-size: 26rpx; font-weight: 600; color: var(--text); margin-bottom: 18rpx; }
	.block-act { float: right; font-size: 23rpx; color: var(--text-3); font-weight: 400; }
	.tag {
		display: inline-flex; flex-direction: row; align-items: center;
		background: var(--chip-bg); color: var(--text-2); font-size: 24rpx;
		padding: 12rpx 22rpx; border-radius: 999rpx; margin: 0 14rpx 14rpx 0;
	}
	.tag.hot { background: var(--primary-soft); color: var(--primary); }
	.tag-x { color: var(--text-3); font-size: 20rpx; margin-left: 14rpx; }
	.mini-row { display: flex; flex-direction: row; align-items: center; padding: 14rpx 0; border-bottom: 1rpx solid var(--line); }
	.mini-row:last-child { border-bottom: none; }
	.mini-name { flex: 1; font-size: 26rpx; color: var(--text); }
	.mini-arrow { color: var(--text-3); font-size: 28rpx; }
	.tip-card {
		background: var(--primary-soft); border-radius: var(--radius);
		padding: var(--sp-4); margin-bottom: var(--sp-3);
	}
	.tip-title { font-size: 26rpx; font-weight: 600; color: var(--primary); margin-bottom: var(--sp-2); }
	.tip-line { font-size: 23rpx; color: var(--text-2); line-height: 1.8; }
	.tip-k { color: var(--primary); font-weight: 600; }
	.result-head { font-size: 24rpx; color: var(--text-3); margin: 6rpx 8rpx 16rpx; }
	.enter-tip { float: right; color: var(--primary); }
	.result-list { border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
	.result-row {
		display: flex; flex-direction: row; align-items: center;
		background: var(--card); padding: 24rpx 26rpx; border-bottom: 1rpx solid var(--line);
	}
	.result-row:last-child { border-bottom: none; }
	.result-row:active { background: var(--input-bg); }
	.result-main { flex: 1; min-width: 0; }
	.result-name { font-size: 28rpx; color: var(--text); font-weight: 600; }
	.result-name .hit { color: var(--primary); background: var(--primary-soft); border-radius: 4rpx; }
	.best {
		font-size: 19rpx; color: #ffffff; background: var(--primary);
		border-radius: 8rpx; padding: 2rpx 10rpx; margin-left: 12rpx; font-weight: 400;
	}
	.result-sub { font-size: 22rpx; color: var(--text-3); margin-top: 8rpx; }
	.result-cat { font-size: 20rpx; color: var(--text-3); margin-top: 8rpx; }
	.result-fav { color: #f5b301; font-size: 34rpx; padding-left: 12rpx; }
	.empty-box { text-align: center; padding: 100rpx 30rpx; }
	.empty-icon { font-size: 90rpx; color: var(--text-3); line-height: 1; }
	.empty-title { font-size: 28rpx; color: var(--text); margin: 26rpx 0 12rpx; }
	.empty-sub { font-size: 23rpx; color: var(--text-3); margin-bottom: 30rpx; }
</style>
