<script>
	import { applyTheme } from './utils/theme.js'

	export default {
		onLaunch: function() {
			console.log('[口袋工具箱] App Launch')
			applyTheme()
			// #ifdef H5
			// 浏览器端全局快捷键：Ctrl / ⌘ + K 随时唤起全局检索
			if (typeof window !== 'undefined' && window.addEventListener) {
				window.addEventListener('keydown', function (e) {
					if (!(e.ctrlKey || e.metaKey) || (e.key !== 'k' && e.key !== 'K')) return
					e.preventDefault()
					try {
						const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
						const cur = pages.length ? (pages[pages.length - 1].route || '') : ''
						if (cur.indexOf('pages/search/search') >= 0) return
						uni.navigateTo({ url: '/pages/search/search' })
					} catch (err) {}
				})
			}
			// #endif
		},
		onShow: function() {
			applyTheme()
		},
		onHide: function() {}
	}
</script>

<style>
	/* ============================================================
	   口袋工具箱 2.0 · 全局设计令牌
	   单一色彩来源：主色 + 5 个「分类语义色」；工具徽标不再各自随机取色。
	   间距 / 圆角 / 字号全部令牌化，页面只引用变量，不再各写一套。
	   ============================================================ */
	page {
		--primary: #4f6ef7;
		--primary-2: #7c5cf5;
		--primary-soft: #eef2ff;
		--primary-line: #dbe3ff;

		--text: #1b2233;
		--text-2: #5a6478;
		--text-3: #98a0b3;
		--line: #e8ecf5;
		--bg: #f4f6fb;
		--card: #ffffff;
		--input-bg: #f7f9fd;
		--chip-bg: #f1f4fa;
		--mask: rgba(20, 28, 50, 0.45);

		--shadow: 0 2rpx 12rpx rgba(31, 45, 90, 0.045);
		--shadow-lg: 0 12rpx 30rpx rgba(31, 45, 90, 0.09);

		--radius: 20rpx;
		--radius-sm: 14rpx;
		--radius-badge: 18rpx;
		--radius-pill: 999rpx;

		--sp-1: 8rpx;
		--sp-2: 12rpx;
		--sp-3: 16rpx;
		--sp-4: 24rpx;
		--sp-5: 32rpx;
		--sp-6: 48rpx;

		--ok: #16a06a;
		--warn: #e8813a;
		--danger: #e05252;
		--ok-soft: #e9f8f1;
		--warn-soft: #fff3e8;
		--danger-soft: #fdeeee;

		/* 分类语义色：convert / file / life / utility / network */
		--tone-convert: #4f6ef7;
		--tone-convert-soft: #eef2ff;
		--tone-convert-line: #dbe3ff;
		--tone-file: #16a06a;
		--tone-file-soft: #e9f8f1;
		--tone-file-line: #cfeede;
		--tone-life: #d9468a;
		--tone-life-soft: #fdeef5;
		--tone-life-line: #f8d9e8;
		--tone-utility: #d97706;
		--tone-utility-soft: #fff4e6;
		--tone-utility-line: #fbe3c2;
		--tone-network: #0284c7;
		--tone-network-soft: #e8f6fd;
		--tone-network-line: #cbeaf9;

		background-color: var(--bg);
		color: var(--text);
		font-size: 28rpx;
	}

	/* 输入框兜底：uni-app H5 把 <input> 编译成 uni-input > input，
	   内层原生 input 的浏览器默认黑色 / -webkit-text-fill-color 会盖掉外层颜色，
	   深色下就会出现「输入了中文但看不见」。这里统一让它继承外层文字色与字体。 */
	input, textarea, uni-input input, uni-textarea textarea {
		font-family: inherit;
		color: inherit;
		-webkit-text-fill-color: inherit;
	}

	/* ===== 深色：只覆盖令牌，组件无需感知 ===== */
	.page-dark {
		--primary: #7d95ff;
		--primary-2: #a98bff;
		--primary-soft: #252e4a;
		--primary-line: #33405f;

		--text: #e9edf7;
		--text-2: #aab4c9;
		--text-3: #7c879e;
		--line: #2b3446;
		--bg: #11151f;
		--card: #1a2130;
		--input-bg: #141b28;
		--chip-bg: #232c3e;
		--mask: rgba(0, 0, 0, 0.6);

		--shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.20);
		--shadow-lg: 0 12rpx 30rpx rgba(0, 0, 0, 0.32);

		--ok: #34c98a;
		--warn: #f0a05a;
		--danger: #f27777;
		--ok-soft: #16302a;
		--warn-soft: #352a1b;
		--danger-soft: #3a2226;

		--tone-convert: #8ba1ff;
		--tone-convert-soft: #232c48;
		--tone-convert-line: #33405f;
		--tone-file: #45c99a;
		--tone-file-soft: #16302a;
		--tone-file-line: #234b3c;
		--tone-life: #f18ab8;
		--tone-life-soft: #35202e;
		--tone-life-line: #56334a;
		--tone-utility: #f0ad63;
		--tone-utility-soft: #352a1b;
		--tone-utility-line: #57422a;
		--tone-network: #56bdea;
		--tone-network-soft: #172b39;
		--tone-network-line: #25475b;

		background-color: var(--bg);
		color: var(--text);
	}

	/* 非受控输入组件占位符：浅/深两档都保证可见 */
	.tb-ph { color: var(--text-3); font-size: 26rpx; }

	/* 二维码 / 条码画布必须保持白底，否则扫不出来 */
	.page-dark .qr-box { background: #ffffff !important; }

	/* ===== 页面容器 ===== */
	.page {
		min-height: 100vh;
		padding: var(--sp-4) var(--sp-4) calc(64rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
		background-color: var(--bg);
	}

	/* ===== 卡片与标题：所有页面共用同一节奏 ===== */
	.card,
	.tb-card {
		background: var(--card);
		border-radius: var(--radius);
		padding: var(--sp-4);
		margin-bottom: var(--sp-4);
		box-shadow: var(--shadow);
		box-sizing: border-box;
	}
	.card-title { font-size: 29rpx; font-weight: 600; color: var(--text); margin-bottom: var(--sp-3); }
	.section-title {
		font-size: 28rpx; font-weight: 600; color: var(--text);
		margin: var(--sp-5) var(--sp-1) var(--sp-3);
	}
	.label { font-size: 25rpx; color: var(--text-2); margin: var(--sp-4) 0 var(--sp-2); }

	/* ===== 表单 ===== */
	.input,
	.textarea,
	.picker {
		width: 100%; box-sizing: border-box;
		background: var(--input-bg);
		border: 1rpx solid var(--line);
		border-radius: var(--radius-sm);
		padding: 18rpx 20rpx;
		font-size: 28rpx; color: var(--text);
	}
	.textarea { height: 260rpx; line-height: 1.6; }
	.textarea.tall { height: 420rpx; }
	.picker { height: 76rpx; line-height: 38rpx; }

	/* ===== 行与按钮：统一间距，按钮宽度随内容自适应，减少换行拥挤 ===== */
	.row { display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; }
	.row > view,
	.row > button { margin: 0 var(--sp-2) var(--sp-2) 0; }
	.grow { flex: 1; min-width: 0; }

	.btn {
		display: flex; align-items: center; justify-content: center;
		min-width: 0; height: 72rpx; padding: 0 24rpx;
		border-radius: var(--radius-sm);
		background: var(--primary-soft); color: var(--primary);
		font-size: 26rpx; box-sizing: border-box; line-height: 1.2;
		transition: transform .12s ease, opacity .12s ease;
	}
	.btn-primary { background: var(--primary); color: #ffffff; }
	.btn-ghost { background: var(--chip-bg); color: var(--text-2); }
	.btn-danger { background: var(--danger); color: #ffffff; }
	.btn-sm { height: 60rpx; padding: 0 20rpx; font-size: 24rpx; border-radius: 12rpx; }
	.btn:active { opacity: 0.75; transform: scale(.97); }

	.chip {
		padding: 12rpx 24rpx; border-radius: var(--radius-pill);
		background: var(--chip-bg); color: var(--text-2);
		font-size: 25rpx; margin: 0 var(--sp-2) var(--sp-2) 0;
	}
	.chip.on { background: var(--primary); color: #ffffff; }

	.result {
		background: var(--input-bg);
		border: 1rpx solid var(--line);
		border-radius: var(--radius-sm);
		padding: 20rpx; margin-top: var(--sp-3);
		font-size: 26rpx; color: var(--text);
		line-height: 1.7; word-break: break-all; white-space: pre-wrap;
	}

	/* 提示文字：降低视觉权重，避免与正文抢注意力 */
	.hint { font-size: 23rpx; color: var(--text-3); line-height: 1.7; margin-top: var(--sp-3); }
	.divider { height: 1rpx; background: var(--line); margin: var(--sp-4) 0; }

	.kv {
		display: flex; flex-direction: row; justify-content: space-between;
		padding: 14rpx 0; border-bottom: 1rpx solid var(--line); font-size: 26rpx;
	}
	.kv:last-child { border-bottom: none; }
	.kv text:first-child { color: var(--text-2); }
	.kv text:last-child { color: var(--text); font-weight: 500; }

	.big-value { font-size: 52rpx; font-weight: 700; color: var(--primary); text-align: center; padding: 20rpx 0; }
	.grid2 { display: flex; flex-direction: row; flex-wrap: wrap; justify-content: space-between; }
	.empty { text-align: center; color: var(--text-3); font-size: 26rpx; padding: 60rpx 0; }

	/* ===== 品牌头图：全站唯一定义（1.x 曾在首页 scoped 里重复定义且值不同） ===== */
	.hero {
		position: relative; overflow: hidden;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%);
		border-radius: var(--radius); padding: 36rpx 32rpx; margin-bottom: var(--sp-4);
		box-shadow: 0 10rpx 28rpx rgba(79, 110, 247, 0.18); color: #ffffff;
	}
	.hero::after {
		content: ''; position: absolute; right: -70rpx; top: -100rpx;
		width: 260rpx; height: 260rpx; border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
	}
	.hero-title { font-size: 40rpx; font-weight: 700; letter-spacing: 1rpx; }
	.hero-sub { font-size: 24rpx; opacity: .86; margin-top: 10rpx; line-height: 1.6; }
	.hero-tag {
		display: inline-block; margin-top: 20rpx; padding: 6rpx 18rpx;
		background: rgba(255, 255, 255, 0.18); border-radius: var(--radius-pill); font-size: 22rpx;
	}
	.hero-link { font-size: 23rpx; opacity: .95; margin-top: 16rpx; text-decoration: underline; }

	/* ===== 深色头图：2.0 只有一套亮紫渐变 + 白字，切深色后顶部仍是一大片亮色 =====
	   这里改成低饱和深色渐变，文字继承深色令牌，浅/深两档都保持同一层级。 */
	.page-dark .hero {
		background: linear-gradient(135deg, #222b45 0%, #34284e 100%);
		color: var(--text);
		border: 1rpx solid var(--primary-line);
		box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.24);
	}
	.page-dark .hero::after { background: rgba(255, 255, 255, 0.045); }
	.page-dark .hero-title,
	.page-dark .app-name,
	.page-dark .mine-title { color: var(--text); }
	.page-dark .hero-sub,
	.page-dark .hero-link,
	.page-dark .app-ver,
	.page-dark .app-slogan,
	.page-dark .mine-sub { color: var(--text-2); opacity: 1; }
	.page-dark .logo,
	.page-dark .mine-avatar { background: rgba(255, 255, 255, 0.10); color: var(--text); }
	.page-dark .hero-tag { background: rgba(255, 255, 255, 0.10); }

	/* H5：page / body / 导航栏的浅色底色由 uni-app 静态配置生成，
	   只靠 setNavigationBarColor 在切换主题时仍可能残留白条，这里用根标记兜底。
	   App 端没有 html/body，规则天然不生效。 */
	html[data-tb-theme="dark"],
	html[data-tb-theme="dark"] body,
	html[data-tb-theme="dark"] uni-page-body { background-color: #11151f !important; }
	html[data-tb-theme="dark"] .uni-page-head { background-color: #1a2130 !important; }
	html[data-tb-theme="dark"] .uni-page-head__title { color: #e9edf7 !important; }
	html[data-tb-theme="dark"] .uni-tabbar { background-color: #1a2130 !important; }

	/* ===== 工具卡片 / 列表行：与 tb-card、tb-badge 对齐同一套尺寸 ===== */
	.tool-grid { display: flex; flex-direction: row; flex-wrap: wrap; justify-content: space-between; }
	.tool-card {
		width: 48.5%; box-sizing: border-box; background: var(--card);
		border-radius: var(--radius); padding: var(--sp-4); margin-bottom: var(--sp-3);
		box-shadow: var(--shadow); transition: transform .12s ease;
	}
	.tool-card:active { transform: scale(.975); }
	.tool-badge {
		width: 68rpx; height: 68rpx; border-radius: var(--radius-badge);
		display: flex; align-items: center; justify-content: center;
		background: var(--primary-soft); color: var(--primary);
		font-size: 27rpx; font-weight: 600; margin-bottom: var(--sp-3);
	}
	.tool-name { font-size: 27rpx; font-weight: 600; color: var(--text); }
	.tool-desc { font-size: 22rpx; color: var(--text-3); margin-top: 8rpx; line-height: 1.5; height: 66rpx; overflow: hidden; }

	.list-row {
		display: flex; flex-direction: row; align-items: center;
		background: var(--card); padding: 22rpx var(--sp-4);
		border-bottom: 1rpx solid var(--line);
	}
	.list-row:active { background: var(--input-bg); }
	.list-icon {
		width: 68rpx; height: 68rpx; border-radius: var(--radius-badge);
		display: flex; align-items: center; justify-content: center;
		background: var(--primary-soft); color: var(--primary);
		font-size: 26rpx; font-weight: 600; margin-right: 20rpx; flex-shrink: 0;
	}
	.list-main { flex: 1; min-width: 0; }
	.list-title { font-size: 28rpx; color: var(--text); font-weight: 500; }
	.list-sub { font-size: 22rpx; color: var(--text-3); margin-top: 6rpx; }
	.list-arrow { color: var(--text-3); font-size: 26rpx; margin-left: 12rpx; }

	.tag-net {
		font-size: 20rpx; color: var(--warn); border: 1rpx solid var(--warn);
		border-radius: 8rpx; padding: 2rpx 8rpx; margin-left: 10rpx;
	}

	.fade-in { animation: tbFade .28s ease both; }
	@keyframes tbFade { from { opacity: 0; transform: translateY(12rpx); } to { opacity: 1; transform: none; } }

	.safe-bottom { height: calc(var(--sp-4) + env(safe-area-inset-bottom)); }
</style>
