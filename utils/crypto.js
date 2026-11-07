/**
 * 纯 JS 摘要算法：MD5 / SHA-1 / SHA-256
 * 无依赖、无 eval、无 Web Crypto，兼容老版本 Android WebView。
 * 输入可以是字符串（按 UTF-8 编码）或 Uint8Array / ArrayBuffer（按原始字节）。
 */
const rotl = (x, n) => (((x << n) | (x >>> (32 - n))) >>> 0)
const rotr = (x, n) => (((x >>> n) | (x << (32 - n))) >>> 0)

function toBytes(input) {
	if (input instanceof ArrayBuffer) return new Uint8Array(input)
	if (ArrayBuffer.isView && ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
	if (Array.isArray(input)) return Uint8Array.from(input)
	const s = String(input)
	const out = []
	for (let i = 0; i < s.length; i++) {
		let c = s.charCodeAt(i)
		if (c < 0x80) out.push(c)
		else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
		else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
			const c2 = s.charCodeAt(++i)
			const cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00)
			out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
		} else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
	}
	return Uint8Array.from(out)
}

export function toHex(bytes) {
	let s = ''
	for (const b of bytes) s += ('0' + (b & 255).toString(16)).slice(-2)
	return s
}

function wordsToHexLE(words) {
	let s = ''
	for (const w of words) {
		for (let i = 0; i < 4; i++) s += ('0' + ((w >>> (i * 8)) & 255).toString(16)).slice(-2)
	}
	return s
}
function wordsToHexBE(words) {
	return words.map(w => ('00000000' + (w >>> 0).toString(16)).slice(-8)).join('')
}

function padLE(bytes) {
	const len = bytes.length
	const bitLo = (len * 8) >>> 0
	const bitHi = Math.floor(len / 0x20000000)
	const after = len + 1
	const zeros = (after % 64 <= 56) ? 56 - after % 64 : 120 - after % 64
	const buf = new Uint8Array(after + zeros + 8)
	buf.set(bytes)
	buf[len] = 0x80
	const p = buf.length - 8
	for (let i = 0; i < 4; i++) { buf[p + i] = (bitLo >>> (i * 8)) & 255; buf[p + 4 + i] = (bitHi >>> (i * 8)) & 255 }
	return buf
}

function padBE(bytes) {
	const len = bytes.length
	const bitLo = (len * 8) >>> 0
	const bitHi = Math.floor(len / 0x20000000)
	const after = len + 1
	const zeros = (after % 64 <= 56) ? 56 - after % 64 : 120 - after % 64
	const buf = new Uint8Array(after + zeros + 8)
	buf.set(bytes)
	buf[len] = 0x80
	const p = buf.length - 8
	for (let i = 0; i < 4; i++) { buf[p + 3 - i] = (bitHi >>> (i * 8)) & 255; buf[p + 7 - i] = (bitLo >>> (i * 8)) & 255 }
	return buf
}

export function md5(input) {
	const data = padLE(toBytes(input))
	const K = []
	for (let i = 0; i < 64; i++) K.push(Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0)
	const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
		5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
		4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
		6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
	let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476
	for (let off = 0; off < data.length; off += 64) {
		const M = []
		for (let j = 0; j < 16; j++) {
			const k = off + j * 4
			M.push((data[k] | (data[k + 1] << 8) | (data[k + 2] << 16) | (data[k + 3] << 24)) >>> 0)
		}
		let A = h0, B = h1, C = h2, D = h3
		for (let i = 0; i < 64; i++) {
			let F, g
			if (i < 16) { F = (B & C) | (~B & D); g = i }
			else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
			else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
			else { F = C ^ (B | ~D); g = (7 * i) % 16 }
			F = (F + A + K[i] + M[g]) >>> 0
			A = D; D = C; C = B
			B = (B + rotl(F, S[i])) >>> 0
		}
		h0 = (h0 + A) >>> 0; h1 = (h1 + B) >>> 0; h2 = (h2 + C) >>> 0; h3 = (h3 + D) >>> 0
	}
	return wordsToHexLE([h0, h1, h2, h3])
}

export function sha1(input) {
	const data = padBE(toBytes(input))
	let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
	for (let off = 0; off < data.length; off += 64) {
		const W = new Array(80)
		for (let t = 0; t < 16; t++) {
			const k = off + t * 4
			W[t] = ((data[k] << 24) | (data[k + 1] << 16) | (data[k + 2] << 8) | data[k + 3]) >>> 0
		}
		for (let t = 16; t < 80; t++) W[t] = rotl(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1)
		let a = h0, b = h1, c = h2, d = h3, e = h4
		for (let t = 0; t < 80; t++) {
			let f, k
			if (t < 20) { f = (b & c) | (~b & d); k = 0x5a827999 }
			else if (t < 40) { f = b ^ c ^ d; k = 0x6ed9eba1 }
			else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc }
			else { f = b ^ c ^ d; k = 0xca62c1d6 }
			const temp = (rotl(a, 5) + f + e + k + W[t]) >>> 0
			e = d; d = c; c = rotl(b, 30); b = a; a = temp
		}
		h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0
	}
	return wordsToHexBE([h0, h1, h2, h3, h4])
}

const SHA256_K = [
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]

export function sha256(input) {
	const data = padBE(toBytes(input))
	const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
	for (let off = 0; off < data.length; off += 64) {
		const W = new Array(64)
		for (let t = 0; t < 16; t++) {
			const k = off + t * 4
			W[t] = ((data[k] << 24) | (data[k + 1] << 16) | (data[k + 2] << 8) | data[k + 3]) >>> 0
		}
		for (let t = 16; t < 64; t++) {
			const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3)
			const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10)
			W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0
		}
		let [a, b, c, d, e, f, g, h] = H
		for (let t = 0; t < 64; t++) {
			const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
			const ch = (e & f) ^ (~e & g)
			const t1 = (h + S1 + ch + SHA256_K[t] + W[t]) >>> 0
			const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
			const maj = (a & b) ^ (a & c) ^ (b & c)
			const t2 = (S0 + maj) >>> 0
			h = g; g = f; f = e; e = (d + t1) >>> 0
			d = c; c = b; b = a; a = (t1 + t2) >>> 0
		}
		H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0
		H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0
	}
	return wordsToHexBE(H)
}

export function hashText(text, algo = 'md5') {
	const a = String(algo).toLowerCase()
	if (a === 'md5') return md5(text)
	if (a === 'sha1') return sha1(text)
	if (a === 'sha256') return sha256(text)
	throw new Error('不支持的算法：' + algo)
}
