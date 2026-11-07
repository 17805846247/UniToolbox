<template>
	<view>
		<view class="card">
			<view class="card-title">身份证号码</view>
			<tb-input class="input" v-model="id" type="text" placeholder="18 位号码，或 15 位旧版号码" />
			<view class="row" style="margin-top:16rpx">
				<view class="btn btn-sm" @click="id = '11010519491231002X'">填入示例</view>
				<view class="btn btn-sm btn-ghost" @click="id = ''">清空</view>
			</view>
			<view class="hint">仅在本地校验与解析，不会保存、上传或联网；仅支持中国大陆居民身份证格式。</view>
		</view>

		<view class="card" v-if="result">
			<view class="card-title">校验结果</view>
			<view class="status" :style="{ background: result.valid ? 'var(--ok)' : 'var(--danger)' }">
				{{ result.valid ? '✓ 校验码正确' : '✕ 校验码不正确' }}
			</view>
			<view class="divider"></view>
			<view class="kv"><text>规范号码</text><text>{{ result.id }}</text></view>
			<view class="kv"><text>出生日期</text><text>{{ result.birth }}</text></view>
			<view class="kv"><text>性别</text><text>{{ result.gender }}</text></view>
			<view class="kv"><text>年龄</text><text>{{ result.age }} 岁</text></view>
			<view class="kv"><text>发证地区</text><text>{{ result.province }}（{{ result.areaCode }}）</text></view>
			<view class="kv"><text>星座</text><text>{{ result.constellation }}</text></view>
			<view class="kv"><text>校验码</text><text>应为 {{ result.expected }}，实际 {{ result.given }}</text></view>
			<view class="row" style="margin-top:18rpx">
				<view class="btn btn-sm btn-primary" @click="copyText(result.id)">复制号码</view>
			</view>
		</view>
		<view class="card" v-if="error"><view class="hint" style="color:var(--danger)">{{ error }}</view></view>

		<view class="card">
			<view class="card-title">关于校验码</view>
			<view class="hint">18 位身份证第 18 位是按 ISO 7064 MOD 11-2 计算的校验码：前 17 位分别乘以固定权重求和，再对 11 取模映射为 0-9 或 X。15 位旧号码会自动补齐「19」与校验位升级为 18 位。</view>
			<view class="hint">本工具只能判断格式与校验码是否自洽，无法验证号码是否真实存在。</view>
		</view>
	</view>
</template>

<script>
	import { parseIdCard } from '../../utils/life.js'
	import { copyText } from '../../utils/ui.js'

	export default {
		data() { return { id: '', error: '' } },
		computed: {
			result() {
				if (!String(this.id).trim()) { this.error = ''; return null }
				try { this.error = ''; return parseIdCard(this.id) }
				catch (e) { this.error = e.message; return null }
			}
		},
		methods: { copyText }
	}
</script>

<style scoped>
	.status {
		color: #ffffff; font-size: 28rpx; font-weight: 600;
		border-radius: var(--radius-sm); padding: 22rpx; text-align: center;
	}
</style>
