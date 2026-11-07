/**
 * 把工具组件与编辑器里的原生 <input>/<textarea> 替换为非受控组件 tb-input/tb-textarea。
 * 设计规范（见 components/ui/tb-input.vue）：
 *   - 只处理 components/tools/*.vue 与 pages/editor/editor.vue
 *   - 排除 components/ui（已有 tb-searchbar 的非受控实现）与 pages/search（已非受控）
 *   - type/password/placeholder/class/style/maxlength 等属性随透传进入根元素，无需改写
 *   - v-model 在 Vue3 编译为 modelValue，组件已支持
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function walk(dir, out) {
	for (const f of fs.readdirSync(dir)) {
		const p = path.join(dir, f)
		const st = fs.statSync(p)
		if (st.isDirectory()) walk(p, out)
		else if (f.endsWith('.vue')) out.push(p)
	}
}

const targets = []
walk(path.join(ROOT, 'components', 'tools'), targets)
targets.push(path.join(ROOT, 'pages', 'editor', 'editor.vue'))

// 仅匹配原生标签：<input ...> 或 <input .../> ；不匹配已生成的 <tb-input
const inputRe = /<input\b([^>]*)(\/?>)/g
const taOpenRe = /<textarea\b([^>]*)>/g
const taCloseRe = /<\/textarea>/g

let changed = 0
for (const file of targets) {
	let s = fs.readFileSync(file, 'utf8')
	const before = s
	s = s.replace(inputRe, '<tb-input$1$2')
	s = s.replace(taOpenRe, '<tb-textarea$1>')
	s = s.replace(taCloseRe, '</tb-textarea>')
	if (s !== before) {
		fs.writeFileSync(file, s)
		changed++
		console.log('updated', path.relative(ROOT, file))
	}
}
console.log('changed files:', changed)
