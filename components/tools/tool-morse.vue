<template>
	<view>
		<view class="card">
			<view class="card-title">转换方向</view>
			<view class="row">
				<view class="chip" :class="{ on: mode === 'encode' }" @click="setMode('encode')">文字 → 电码</view>
				<view class="chip" :class="{ on: mode === 'decode' }" @click="setMode('decode')">电码 → 文字</view>
			</view>
			<view class="label">{{ mode === 'encode' ? '输入文字' : '输入电码（点 . 划 -，空格分字母，/ 分单词）' }}</view>
			<tb-textarea class="textarea" v-model="text" :placeholder="mode === 'encode' ? '例如 HELLO WORLD 或 SOS' : '例如 ... --- ...'" />
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm" @click="fillSample">填入示例</view>
				<view class="btn btn-sm btn-ghost" @click="text = ''">清空</view>
			</view>
			<view class="hint">标准 ITU 码表，支持 A-Z、0-9 与常见标点；中文字符会列出为「不支持」。</view>
		</view>

		<view class="card">
			<view class="card-title">{{ mode === 'encode' ? '电码结果' : '解码结果' }}</view>
			<view class="result out">{{ output || '—' }}</view>
			<view v-if="warnings.length" class="hint" style="color:var(--warn)">
				{{ mode === 'encode' ? '未收录字符' : '无法识别的码' }}：{{ warnings.join(' ') }}
			</view>
			<view class="row" style="margin-top:20rpx">
				<view class="btn btn-sm btn-primary" @click="copyText(output)">复制结果</view>
				<view class="btn btn-sm" @click="togglePlay">{{ playing ? '停止节拍' : '播放节拍' }}</view>
			</view>
		</view>

		<view v-if="symbols.length" class="card">
			<view class="card-title">节拍预览 <text class="beat-tip">· 短 / − 长 / 空格停顿</text></view>
			<view class="beats">
				<view v-for="(s, i) in symbols" :key="i" class="beat"
					:class="{ dot: s.ch === '.', dash: s.ch === '-', gap: s.gap, on: playing && i === idx }"></view>
			</view>
			<view class="hint">用高亮顺序模拟发报节奏，纯视觉、无声音与权限要求。</view>
		</view>

		<view class="card">
			<view class="card-title" @click="showTable = !showTable">码表 {{ showTable ? '（收起）' : '（展开）' }}</view>
			<view v-if="showTable" class="table">
				<view class="cell" v-for="(v, k) in table" :key="k">
					<text class="cell-k">{{ k }}</text><text class="cell-v">{{ v }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { morseEncode, morseDecode, MORSE_TABLE } from '../../utils/gadget.js'
	import { copyText, toast } from '../../utils/ui.js'

	export default {
		data() {
			return { mode: 'encode', text: 'SOS', showTable: false, playing: false, idx: -1, timer: null }
		},
		computed: {
			table() {
				const o = {}
				for (const k of Object.keys(MORSE_TABLE)) {
					if (/^[A-Z0-9]$/.test(k)) o[k] = MORSE_TABLE[k]
				}
				return o
			},
			output() {
				return this.mode === 'encode' ? morseEncode(this.text).code : morseDecode(this.text).text
			},
			warnings() {
				return this.mode === 'encode' ? morseEncode(this.text).unsupported : morseDecode(this.text).invalid
			},
			beatCode() { return this.mode === 'encode' ? this.output : this.text },
			symbols() {
				const out = []
				for (const token of String(this.beatCode || '').trim().split(/\s+/)) {
					if (!token) continue
					if (token === '/') { out.push({ ch: '/', gap: true }); continue }
					for (const ch of token) {
						if (ch === '.' || ch === '-') out.push({ ch, gap: false })
					}
					out.push({ ch: ' ', gap: true })
				}
				return out.slice(0, 120)
			}
		},
		beforeUnmount() { this.stop() },
		methods: {
			copyText,
			setMode(m) {
				this.stop()
				this.mode = m
				this.text = m === 'encode' ? 'SOS' : '... --- ...'
			},
			fillSample() {
				this.text = this.mode === 'encode' ? 'HELLO WORLD 2026' : '.... . .-.. .-.. --- / .-- --- .-. .-.. -..'
			},
			togglePlay() { this.playing ? this.stop() : this.play() },
			play() {
				if (!this.symbols.length) return toast('没有可播放的节拍')
				this.stop()
				this.idx = 0
				this.playing = true
				this.timer = setInterval(() => {
					this.idx++
					if (this.idx >= this.symbols.length) this.stop()
				}, 240)
			},
			stop() {
				if (this.timer) { clearInterval(this.timer); this.timer = null }
				this.playing = false
				this.idx = -1
			}
		}
	}
</script>

<style scoped>
	.out { font-size: 30rpx; letter-spacing: 2rpx; font-weight: 600; }
	.beat-tip { font-size: 21rpx; color: var(--text-3); font-weight: 400; }
	.beats { display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; }
	.beat {
		height: 22rpx; border-radius: 6rpx; background: var(--line); margin: 6rpx 8rpx 6rpx 0;
		transition: background .12s ease, transform .12s ease;
	}
	.beat.dot { width: 22rpx; background: var(--text-3); }
	.beat.dash { width: 58rpx; background: var(--text-3); }
	.beat.gap { width: 14rpx; background: transparent; }
	.beat.on { background: var(--primary); transform: scaleY(1.5); }
	.table { display: flex; flex-direction: row; flex-wrap: wrap; }
	.cell {
		width: 25%; box-sizing: border-box; display: flex; flex-direction: row; align-items: center;
		padding: 10rpx 8rpx; font-size: 23rpx;
	}
	.cell-k { width: 44rpx; color: var(--primary); font-weight: 600; }
	.cell-v { color: var(--text-2); }
</style>
