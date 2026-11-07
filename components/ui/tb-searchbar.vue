<template>
	<view class="tb-searchbar">
		<view v-if="mode === 'link'" class="bar" @click="onTap">
			<text class="ico">⌕</text>
			<text class="ph">{{ placeholder }}</text>
			<text v-if="shortcut" class="kbd">{{ shortcut }}</text>
		</view>
		<view v-else class="bar">
			<text class="ico">⌕</text>
			<!--
				非受控输入：不要把外部 value 在每次 @input 后写回 <input>。
				uni-app 的 <input> 是自定义组件，受控回写会在中文输入法组合期间
				重置 DOM 的 value，导致拼音无法上屏（表现为「搜索框打不了中文」）。
				这里只在外部值确实变化时用 :key 重建输入框，清空同理。
			-->
			<input
				:key="inputKey" class="field" type="text" :value="initialValue"
				:placeholder="placeholder" confirm-type="search" placeholder-class="ph-input"
				@input="onInput" @confirm="onConfirm"
			/>
			<text v-if="inner" class="clear" @click="onClear">✕</text>
			<view class="sep"></view>
			<text class="global" @click="onGlobal">全局</text>
		</view>
	</view>
</template>

<script>
	/**
	 * 界面 2.0 统一搜索条。
	 * link   = 纯入口，点击进全屏搜索页（首页用）
	 * filter = 页内实时筛选 + 右侧「全局」进入全屏搜索（工具目录用）
	 * 之前首页一条 + 热门词行、工具页一条 input + 一条 ⌘K 大横幅，
	 * 现在收敛成同一个组件、同一种外观，功能都还在，只是不再互相打架。
	 */
	export default {
		name: 'TbSearchbar',
		props: {
			mode: { type: String, default: 'link' },   // link | filter
			value: { type: String, default: '' },
			placeholder: { type: String, default: '搜索工具' },
			shortcut: { type: String, default: '⌘K' }
		},
		emits: ['tap', 'input', 'global', 'confirm'],
		data() {
			return {
				initialValue: this.value,
				inner: this.value,
				inputKey: 0
			}
		},
		watch: {
			value(v) {
				// 自己刚 emit 出去的值会原样回来，此时绝不重建，避免打断 IME
				if (v === this.inner) return
				this.inner = v
				this.initialValue = v
				this.inputKey++
			}
		},
		methods: {
			onTap() { this.$emit('tap') },
			onInput(e) {
				const v = e.detail.value
				this.inner = v
				this.$emit('input', v)
			},
			onClear() {
				this.inner = ''
				this.initialValue = ''
				this.inputKey++          // 重建输入框，等效于清空且不会残留组合态
				this.$emit('input', '')
			},
			onGlobal() { this.$emit('global') },
			onConfirm() { this.$emit('confirm', this.inner) }
		}
	}
</script>

<style scoped>
	.tb-searchbar { margin-bottom: var(--sp-4); }
	.bar {
		display: flex; flex-direction: row; align-items: center;
		height: 88rpx; box-sizing: border-box;
		padding: 0 22rpx;
		background: var(--card);
		border: 1rpx solid var(--line);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow);
	}
	.bar:active { opacity: .9; }
	.ico { font-size: 38rpx; line-height: 1; color: var(--primary); margin-right: 14rpx; flex-shrink: 0; }
	.ph { flex: 1; font-size: 26rpx; color: var(--text-3); }
	.kbd {
		font-size: 20rpx; color: var(--text-3);
		border: 1rpx solid var(--line); border-radius: 8rpx;
		padding: 4rpx 12rpx; background: var(--input-bg);
	}
	.field {
		flex: 1; min-width: 0; width: 100%; height: 84rpx;
		font-size: 27rpx; color: var(--text);
		-webkit-text-fill-color: var(--text);
		background: transparent; border: none; outline: none;
	}
	.ph-input { color: var(--text-3); font-size: 26rpx; }
	.clear { font-size: 26rpx; color: var(--text-3); padding: 0 14rpx; flex-shrink: 0; }
	.sep { width: 1rpx; height: 34rpx; background: var(--line); margin: 0 4rpx 0 10rpx; flex-shrink: 0; }
	.global { font-size: 25rpx; color: var(--primary); padding: 8rpx 4rpx 8rpx 14rpx; font-weight: 600; flex-shrink: 0; }
</style>
