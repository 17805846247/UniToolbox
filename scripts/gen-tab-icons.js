/**
 * 生成 tabBar 所需的 8 张 81x81 透明 PNG 图标（纯 Node，无任何依赖）。
 * 用法：node scripts/gen-tab-icons.js
 * 灰度 = 未选中，品牌蓝 = 选中。改配色只需改 OFF / ON。
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const OFF = [152, 160, 179]
const ON = [79, 110, 247]
const OUT = path.join(__dirname, '..', 'static', 'tab')

// ---------- 极简像素画布 ----------
class Canvas {
	constructor(w, h) {
		this.w = w; this.h = h
		this.buf = Buffer.alloc(w * h * 4)
	}
	dot(x, y, c, a = 255) {
		x = Math.round(x); y = Math.round(y)
		if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
		const i = (y * this.w + x) * 4
		const src = a / 255, dst = this.buf[i + 3] / 255
		const out = src + dst * (1 - src)
		if (out <= 0) return
		for (let k = 0; k < 3; k++) {
			this.buf[i + k] = Math.round((c[k] * src + this.buf[i + k] * dst * (1 - src)) / out)
		}
		this.buf[i + 3] = Math.round(out * 255)
	}
	fillRect(x, y, w, h, c) {
		for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.dot(i, j, c)
	}
	strokeRect(x, y, w, h, t, c) {
		this.fillRect(x, y, w, t, c)
		this.fillRect(x, y + h - t, w, t, c)
		this.fillRect(x, y, t, h, c)
		this.fillRect(x + w - t, y, t, h, c)
	}
	line(x0, y0, x1, y1, t, c) {
		const dx = x1 - x0, dy = y1 - y0
		const len2 = dx * dx + dy * dy
		const minX = Math.floor(Math.min(x0, x1) - t), maxX = Math.ceil(Math.max(x0, x1) + t)
		const minY = Math.floor(Math.min(y0, y1) - t), maxY = Math.ceil(Math.max(y0, y1) + t)
		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				let u = len2 === 0 ? 0 : ((x - x0) * dx + (y - y0) * dy) / len2
				u = Math.max(0, Math.min(1, u))
				const px = x0 + u * dx, py = y0 + u * dy
				if ((x - px) * (x - px) + (y - py) * (y - py) <= (t / 2) * (t / 2)) this.dot(x, y, c)
			}
		}
	}
	ring(cx, cy, r, t, c) {
		for (let y = cy - r - t; y <= cy + r + t; y++) {
			for (let x = cx - r - t; x <= cx + r + t; x++) {
				const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
				if (d <= r + t / 2 && d >= r - t / 2) this.dot(x, y, c)
			}
		}
	}
	png() {
		const w = this.w, h = this.h
		const crcTable = []
		for (let n = 0; n < 256; n++) {
			let c = n
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
			crcTable[n] = c >>> 0
		}
		const crc32 = b => {
			let c = 0xffffffff
			for (const v of b) c = crcTable[(c ^ v) & 0xff] ^ (c >>> 8)
			return (c ^ 0xffffffff) >>> 0
		}
		const chunk = (type, data) => {
			const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
			const t = Buffer.from(type, 'ascii')
			const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
			return Buffer.concat([len, t, data, crc])
		}
		const ihdr = Buffer.alloc(13)
		ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
		ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
		const stride = w * 4
		const raw = Buffer.alloc((stride + 1) * h)
		for (let y = 0; y < h; y++) {
			raw[y * (stride + 1)] = 0
			this.buf.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
		}
		return Buffer.concat([
			Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
			chunk('IHDR', ihdr),
			chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
			chunk('IEND', Buffer.alloc(0))
		])
	}
}

// ---------- 四个图标 ----------
function draw(name, c) {
	const cv = new Canvas(81, 81)
	const T = 5
	if (name === 'home') {
		cv.line(13, 39, 40, 16, T, c)
		cv.line(40, 16, 68, 39, T, c)
		cv.line(20, 36, 20, 66, T, c)
		cv.line(20, 66, 61, 66, T, c)
		cv.line(61, 36, 61, 66, T, c)
		cv.fillRect(35, 47, 11, 19, c)
	} else if (name === 'tools') {
		const boxes = [[15, 15], [45, 15], [15, 45], [45, 45]]
		for (const [x, y] of boxes) cv.strokeRect(x, y, 21, 21, T, c)
	} else if (name === 'files') {
		cv.fillRect(14, 21, 25, 8, c)
		cv.strokeRect(13, 28, 55, 37, T, c)
		cv.line(22, 44, 59, 44, 4, c)
	} else if (name === 'mine') {
		cv.ring(40, 27, 12, T, c)
		cv.line(17, 66, 23, 48, T, c)
		cv.line(23, 48, 57, 48, T, c)
		cv.line(57, 48, 64, 66, T, c)
		cv.line(17, 66, 64, 66, T, c)
	}
	return cv.png()
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })
const names = ['home', 'tools', 'files', 'mine']
let count = 0
for (const n of names) {
	fs.writeFileSync(path.join(OUT, n + '.png'), draw(n, OFF))
	fs.writeFileSync(path.join(OUT, n + '-on.png'), draw(n, ON))
	count += 2
}
console.log('已生成 ' + count + ' 张图标 -> ' + OUT)
