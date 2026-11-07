<template>
	<view>
		<view class="card">
			<view class="card-title">设备传感器工具</view>
			<view class="row">
				<view class="chip" :class="{ on: mode === 'compass' }" @click="mode = 'compass'">指南针</view>
				<view class="chip" :class="{ on: mode === 'level' }" @click="mode = 'level'">水平仪</view>
			</view>
			<view class="row" style="margin-top:20rpx">
				<view class="btn btn-sm btn-primary" @click="start">{{ running ? '重新校准' : '开始测量' }}</view>
				<view class="btn btn-sm" @click="stop">停止</view>
			</view>
			<view class="hint" v-if="!supported">当前是浏览器预览环境，没有方向 / 加速度传感器。请用 HBuilderX「运行到手机」在真机上体验；真机若提示授权请允许。</view>
		</view>

		<view class="card" v-if="mode === 'compass'">
			<view class="card-title">指南针</view>
			<view class="compass-wrap">
				<view class="compass-dial" :style="{ transform: 'rotate(' + (-deg) + 'deg)' }">
					<text class="dir n">北</text><text class="dir e">东</text>
					<text class="dir s">南</text><text class="dir w">西</text>
					<view class="needle"></view>
				</view>
				<view class="compass-pin"></view>
			</view>
			<view class="big-value" style="font-size:44rpx">{{ degText }}° {{ dirName }}</view>
			<view class="hint" style="text-align:center;margin-top:-6rpx">{{ running ? '正在读取方向传感器' : '点「开始测量」启动' }}</view>
		</view>

		<view class="card" v-if="mode === 'level'">
			<view class="card-title">水平仪</view>
			<view class="level-wrap">
				<view class="level-cross h"></view>
				<view class="level-cross v"></view>
				<view class="level-bubble" :style="{ transform: 'translate(' + bubbleX + 'rpx,' + bubbleY + 'rpx)' }"></view>
			</view>
			<view class="kv"><text>倾斜角</text><text>{{ tilt.angle }}°</text></view>
			<view class="kv"><text>俯仰 Pitch</text><text>{{ tilt.pitch }}°</text></view>
			<view class="kv"><text>横滚 Roll</text><text>{{ tilt.roll }}°</text></view>
			<view class="kv"><text>状态</text><text :style="{ color: tilt.level ? 'var(--ok)' : 'var(--warn)' }">{{ tilt.level ? '已放平' : '尚未水平' }}</text></view>
			<view class="hint">把手机平放在待测平面上，气泡居中（倾斜角 &lt; 3°）即表示水平。{{ running ? '' : '点「开始测量」启动。' }}</view>
		</view>
	</view>
</template>

<script>
	import { tiltFromAcceleration, directionName } from '../../utils/devkit.js'
	import { toast } from '../../utils/ui.js'

	export default {
		data() {
			return {
				mode: 'compass', running: false, deg: 0,
				supported: typeof plus !== 'undefined',
				tilt: { pitch: 0, roll: 0, angle: 0, level: true }
			}
		},
		computed: {
			degText() { return Math.round(this.deg) },
			dirName() { return directionName(this.deg) },
			bubbleX() { return Math.max(-110, Math.min(110, this.tilt.roll * 2.2)) },
			bubbleY() { return Math.max(-110, Math.min(110, this.tilt.pitch * 2.2)) }
		},
		beforeUnmount() { this.stop() },
		methods: {
			start() {
				this.stop()
				if (!this.supported) return toast('浏览器预览不支持传感器，请真机运行')
				if (this.mode === 'compass') {
					uni.onCompassChange(res => { this.deg = Number(res.direction) || 0 })
					uni.startCompass({
						fail: () => toast('无法启动指南针，请检查设备是否支持')
					})
				} else {
					uni.onAccelerometerChange(res => {
						this.tilt = tiltFromAcceleration(res.x, res.y, res.z)
					})
					uni.startAccelerometer({
						interval: 'normal',
						fail: () => toast('无法启动加速度传感器')
					})
				}
				this.running = true
			},
			stop() {
				if (!this.running) return
				try { uni.stopCompass() } catch (e) {}
				try { uni.stopAccelerometer() } catch (e) {}
				this.running = false
			}
		}
	}
</script>

<style scoped>
	.compass-wrap {
		position: relative; width: 380rpx; height: 380rpx; margin: 26rpx auto 40rpx;
		border-radius: 50%; border: 6rpx solid var(--line); background: var(--input-bg);
	}
	.compass-dial { position: absolute; inset: 0; transition: transform .18s linear; }
	.dir { position: absolute; font-size: 26rpx; font-weight: 700; color: var(--text-2); }
	.dir.n { top: 16rpx; left: 50%; transform: translateX(-50%); color: var(--danger); }
	.dir.s { bottom: 16rpx; left: 50%; transform: translateX(-50%); }
	.dir.e { right: 18rpx; top: 50%; transform: translateY(-50%); }
	.dir.w { left: 18rpx; top: 50%; transform: translateY(-50%); }
	.needle {
		position: absolute; left: 50%; top: 12%; width: 8rpx; height: 76%;
		margin-left: -4rpx; background: linear-gradient(var(--danger) 0 50%, #ffffff 50% 100%);
		border-radius: 8rpx;
	}
	.compass-pin {
		position: absolute; left: 50%; top: 50%; width: 20rpx; height: 20rpx;
		margin: -10rpx 0 0 -10rpx; border-radius: 50%; background: var(--primary);
	}
	.level-wrap {
		position: relative; width: 340rpx; height: 340rpx; margin: 26rpx auto;
		border-radius: 50%; border: 6rpx solid var(--line); background: var(--input-bg); overflow: hidden;
	}
	.level-cross { position: absolute; background: var(--line); }
	.level-cross.h { left: 10%; right: 10%; top: 50%; height: 2rpx; }
	.level-cross.v { top: 10%; bottom: 10%; left: 50%; width: 2rpx; }
	.level-bubble {
		position: absolute; left: 50%; top: 50%; width: 60rpx; height: 60rpx;
		margin: -30rpx 0 0 -30rpx; border-radius: 50%;
		background: var(--primary); opacity: .75; transition: transform .12s linear;
	}
</style>
