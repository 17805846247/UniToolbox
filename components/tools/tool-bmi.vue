<template>
	<view>
		<view class="card">
			<view class="card-title">身体数据</view>
			<view class="label">身高（cm）</view>
			<tb-input class="input" v-model="height" type="digit" placeholder="例如 170" />
			<view class="label">体重（kg）</view>
			<tb-input class="input" v-model="weight" type="digit" placeholder="例如 65" />
			<view class="label">年龄</view>
			<tb-input class="input" v-model="age" type="number" placeholder="例如 30" />
			<view class="label">性别</view>
			<view class="row">
				<view class="chip" :class="{ on: sex === 'male' }" @click="sex = 'male'">男</view>
				<view class="chip" :class="{ on: sex === 'female' }" @click="sex = 'female'">女</view>
			</view>
			<view class="label">日常活动量</view>
			<picker mode="selector" :range="activityNames" :value="activityIdx" @change="onActivity">
				<view class="picker">{{ activityNames[activityIdx] }}</view>
			</picker>
			<view class="hint">BMR 采用 Mifflin-St Jeor 公式，TDEE = BMR × 活动系数；仅供参考，不能替代医学诊断。</view>
		</view>

		<view class="card" v-if="result">
			<view class="card-title">评估结果</view>
			<view class="big-value">{{ result.bmi }}</view>
			<view class="bmi-tag" :style="{ background: tagColor }">{{ result.category }}</view>
			<view class="divider"></view>
			<view class="kv"><text>理想体重（BMI 18.5~23.9）</text><text>{{ result.idealText }}</text></view>
			<view class="kv"><text>与理想区间差值</text><text>{{ result.diff ? result.diff + ' kg' : '已在区间内' }}</text></view>
			<view class="kv"><text>基础代谢 BMR</text><text>{{ result.bmr ? result.bmr + ' kcal/天' : '请填写年龄' }}</text></view>
			<view class="kv"><text>每日总消耗 TDEE</text><text>{{ result.tdee ? result.tdee + ' kcal/天' : '请填写年龄' }}</text></view>
			<view class="kv" v-if="result.tdee"><text>建议减脂摄入</text><text>{{ suggestCalorie }} kcal/天</text></view>
			<view class="hint" style="margin-top:20rpx">{{ result.advice }}</view>
		</view>
		<view class="card" v-if="error"><view class="hint" style="color:var(--danger)">{{ error }}</view></view>

		<view class="card">
			<view class="card-title">中国成人 BMI 参考</view>
			<view class="kv"><text>偏瘦</text><text>&lt; 18.5</text></view>
			<view class="kv"><text>正常</text><text>18.5 ~ 23.9</text></view>
			<view class="kv"><text>超重</text><text>24.0 ~ 27.9</text></view>
			<view class="kv"><text>肥胖</text><text>≥ 28.0</text></view>
		</view>
	</view>
</template>

<script>
	import { calcBmi } from '../../utils/life.js'

	export default {
		data() {
			return {
				height: '170', weight: '65', age: '30', sex: 'male', activityIdx: 2, error: '',
				activities: [
					{ key: 'low', name: '久坐（几乎不运动）' },
					{ key: 'light', name: '轻度活动（每周 1~3 次）' },
					{ key: 'medium', name: '中度活动（每周 3~5 次）' },
					{ key: 'high', name: '高强度（每周 6~7 次）' },
					{ key: 'veryhigh', name: '体力劳动 / 双练' }
				]
			}
		},
		computed: {
			activityNames() { return this.activities.map(a => a.name) },
			result() {
				try {
					this.error = ''
					return calcBmi(this.height, this.weight, this.age, this.sex, this.activities[this.activityIdx].key)
				} catch (e) { this.error = e.message; return null }
			},
			tagColor() {
				if (!this.result) return 'var(--primary)'
				const map = { '偏瘦': 'var(--tone-network)', '正常': 'var(--ok)', '超重': 'var(--warn)', '肥胖': 'var(--danger)' }
				return map[this.result.category] || 'var(--primary)'
			},
			suggestCalorie() {
				return this.result && this.result.tdee ? Math.round(this.result.tdee - 500) : 0
			}
		},
		methods: {
			onActivity(e) { this.activityIdx = Number(e.detail.value) }
		}
	}
</script>

<style scoped>
	.bmi-tag {
		display: block; width: fit-content; margin: -8rpx auto 6rpx; padding: 6rpx 28rpx;
		border-radius: 999rpx; color: #ffffff; font-size: 24rpx;
	}
</style>
