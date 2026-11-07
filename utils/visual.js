/**
 * 界面 2.0 的视觉映射层（纯展示用，不参与任何业务计算）。
 *
 * 1.x 时每个工具各带一个高饱和 color，44 个工具 = 44 种颜色，
 * 首页 / 工具 / 搜索 / 详情四处都是彩色块，是界面杂乱的主要来源。
 * 2.0 把色彩收敛为「分类语义色」：沿用 CATEGORIES 已有的 5 个分类色，
 * 以 CSS 变量形式在 App.vue 定义浅色 / 深色两套，徽标统一为「淡底 + 分类色字」。
 *
 * 这样既保留分类辨识度，又能让主题切换自动生效、四页视觉完全一致。
 * 本文件不修改 TOOLS 的任何字段，不改检索、收藏、排序等逻辑。
 */

const CAT_TONE = {
	convert: 'convert',
	file: 'file',
	life: 'life',
	utility: 'utility',
	network: 'network'
}

export const TONE_KEYS = ['convert', 'file', 'life', 'utility', 'network']

/** 工具（或分类 key）→ 色调名。未知分类回退到 utility，保证不会出现无样式徽标。 */
export function toneKey(tool) {
	// 支持三种入参：分类 key 字符串、CATEGORIES 条目（用 key）、TOOLS 条目（用 cat）
	const cat = typeof tool === 'string' ? tool : (tool && (tool.cat || tool.key))
	return CAT_TONE[cat] || 'utility'
}

/** 返回可直接用于 :style 的 CSS 变量引用（主题切换自动生效） */
export function toneOf(tool) {
	const k = toneKey(tool)
	return {
		tone: k,
		color: 'var(--tone-' + k + ')',
		bg: 'var(--tone-' + k + '-soft)',
		border: 'var(--tone-' + k + '-line)'
	}
}

/** 徽标样式：淡底 + 分类色字，不再是实心高饱和色块 */
export function badgeStyle(tool) {
	const t = toneOf(tool)
	return { color: t.color, background: t.bg }
}

/** 分类卡片左侧色条 / 小圆点用 */
export function accentStyle(tool) {
	return { background: toneOf(tool).color }
}
