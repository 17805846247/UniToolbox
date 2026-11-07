/**
 * 文件存储层（双端）
 *  - App(5+/Android)：plus.io.PRIVATE_DOC/toolbox/，应用私有目录，无需任何权限
 *  - H5（HBuilderX 运行到浏览器预览）：localStorage 模拟，支持导入/下载
 * 所有接口统一返回 Promise。写操作只作用于应用自己的目录，不触碰系统文件。
 */
const KEY = 'utool_files_v1'

export const isNative = () => typeof plus !== 'undefined' && !!plus.io && !!plus.io.PRIVATE_DOC
export const storageDesc = () => isNative() ? '应用私有目录 _doc/toolbox/' : '浏览器本地存储（预览模式）'

export function safeName(name) {
	const s = String(name || '').trim().replace(/[\\/:*?"<>|]/g, '_')
	if (!s) throw new Error('文件名不能为空')
	if (s.length > 80) throw new Error('文件名不能超过 80 个字')
	return s
}

function whenPlusReady() {
	return new Promise((resolve, reject) => {
		if (isNative()) return resolve()
		let done = false
		const finish = ok => { if (!done) { done = true; ok ? resolve() : reject(new Error('5+ 运行环境尚未就绪')) } }
		try {
			document.addEventListener('plusready', () => finish(true), false)
			setTimeout(() => finish(false), 5000)
		} catch (e) { reject(new Error('当前环境不支持文件读写')) }
	})
}

function appDir() {
	return whenPlusReady().then(() => new Promise((resolve, reject) => {
		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, fs => {
			fs.root.getDirectory('toolbox', { create: true, exclusive: false }, resolve,
				e => reject(new Error('无法创建目录：' + (e && e.message || '未知错误'))))
		}, e => reject(new Error('无法访问文件系统：' + (e && e.message || '未知错误'))))
	}))
}

function readMap() {
	try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { return {} }
}
function saveMap(map) {
	localStorage.setItem(KEY, JSON.stringify(map))
	return true
}
const now = () => Date.now()

/* ==================== 列表 / 读 / 写 / 删 / 改名 ==================== */

export async function listFiles() {
	if (!isNative()) {
		const map = readMap()
		return Object.keys(map).map(name => ({
			name, size: map[name].content.length, time: map[name].time || now()
		})).sort((a, b) => b.time - a.time)
	}
	const dir = await appDir()
	return new Promise((resolve, reject) => {
		dir.createReader().readEntries(entries => {
			Promise.all(entries.filter(e => e.isFile).map(e => new Promise(res => {
				e.file(f => {
					e.getMetadata(m => res({ name: e.name, size: f.size, time: m && m.modificationTime ? new Date(m.modificationTime).getTime() : now() }),
						() => res({ name: e.name, size: f.size, time: now() }))
				}, () => res({ name: e.name, size: 0, time: now() }))
			}))).then(list => resolve(list.sort((a, b) => b.time - a.time)))
		}, e => reject(new Error('读取文件列表失败')))
	})
}

export async function readFile(name) {
	const n = safeName(name)
	if (!isNative()) {
		const map = readMap()
		if (!map[n]) throw new Error('文件不存在：' + n)
		return map[n].content
	}
	const dir = await appDir()
	return new Promise((resolve, reject) => {
		dir.getFile(n, { create: false }, entry => {
			entry.file(file => {
				const reader = new plus.io.FileReader()
				reader.onloadend = ev => resolve(ev.target && ev.target.result !== undefined ? ev.target.result : '')
				reader.onerror = () => reject(new Error('读取失败'))
				try { reader.readAsText(file, 'utf-8') } catch (e) { reject(new Error('读取失败：' + e.message)) }
			}, () => reject(new Error('无法打开文件')))
		}, () => reject(new Error('文件不存在：' + n)))
	})
}

export async function writeFile(name, content) {
	const n = safeName(name)
	const text = String(content === undefined ? '' : content)
	if (!isNative()) {
		const map = readMap()
		map[n] = { content: text, time: now() }
		saveMap(map)
		return n
	}
	const dir = await appDir()
	return new Promise((resolve, reject) => {
		// 先删除旧文件再重建，避免 FileWriter 覆盖写入残留旧内容
		const create = () => dir.getFile(n, { create: true, exclusive: false }, entry => {
			entry.createWriter(writer => {
				let done = false
				writer.onwrite = () => { if (!done) { done = true; resolve(n) } }
				writer.onerror = () => reject(new Error('写入失败'))
				try { writer.write(text) } catch (e) { reject(new Error('写入失败：' + e.message)) }
			}, () => reject(new Error('无法创建文件')))
		}, () => reject(new Error('无法创建文件')))
		dir.getFile(n, { create: false }, entry => entry.remove(create, create), create)
	})
}

export async function removeFile(name) {
	const n = safeName(name)
	if (!isNative()) {
		const map = readMap()
		if (!map[n]) throw new Error('文件不存在')
		delete map[n]; saveMap(map)
		return n
	}
	const dir = await appDir()
	return new Promise((resolve, reject) => {
		dir.getFile(n, { create: false }, entry => entry.remove(() => resolve(n), () => reject(new Error('删除失败'))),
			() => reject(new Error('文件不存在')))
	})
}

export async function renameFile(oldName, newName) {
	const from = safeName(oldName), to = safeName(newName)
	if (from === to) return to
	if (!isNative()) {
		const map = readMap()
		if (!map[from]) throw new Error('原文件不存在')
		if (map[to]) throw new Error('目标文件名已存在')
		map[to] = map[from]; map[to].time = now()
		delete map[from]; saveMap(map)
		return to
	}
	const dir = await appDir()
	return new Promise((resolve, reject) => {
		dir.getFile(from, { create: false }, entry => {
			entry.moveTo(dir, to, () => resolve(to), () => reject(new Error('重命名失败（目标可能已存在）')))
		}, () => reject(new Error('原文件不存在')))
	})
}

/* ==================== 导入 / 导出 ==================== */

/** 导出到手机公共 Documents 目录（App）或浏览器下载（H5） */
export async function exportFile(name) {
	const content = await readFile(name)
	if (!isNative()) {
		const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url; a.download = name; document.body.appendChild(a); a.click()
		document.body.removeChild(a)
		setTimeout(() => URL.revokeObjectURL(url), 2000)
		return '已下载到浏览器默认下载目录'
	}
	return whenPlusReady().then(() => new Promise((resolve, reject) => {
		plus.io.requestFileSystem(plus.io.PUBLIC_DOCUMENTS, fs => {
			fs.root.getFile(safeName(name), { create: true, exclusive: false }, entry => {
				entry.createWriter(w => {
					w.onwrite = () => resolve(entry.fullPath || ('Documents/' + name))
					w.onerror = () => reject(new Error('导出写入失败'))
					w.write(content)
				}, () => reject(new Error('无法创建导出文件')))
			}, () => reject(new Error('无法创建导出文件')))
		}, () => reject(new Error('无法访问公共文档目录，请改用「复制内容」')))
	}))
}

/** 预览模式：从电脑选择文本文件导入 */
export function pickLocalFile() {
	return new Promise((resolve, reject) => {
		try {
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = '.txt,.md,.json,.csv,.yaml,.yml,.xml,.js,.css,.html,.log,.ini,.sql,.py'
			input.onchange = () => {
				const f = input.files && input.files[0]
				if (!f) return reject(new Error('未选择文件'))
				if (f.size > 2 * 1024 * 1024) return reject(new Error('文件超过 2MB，文本编辑器不适合打开'))
				const reader = new FileReader()
				reader.onload = () => resolve({ name: safeName(f.name), content: String(reader.result || '') })
				reader.onerror = () => reject(new Error('读取文件失败'))
				reader.readAsText(f, 'utf-8')
			}
			input.click()
		} catch (e) { reject(new Error('当前环境不支持选择文件')) }
	})
}
