<template>
	<view :class="themeClass">
		<view class="head" v-if="tool">
			<view class="head-main">
				<tb-badge :tool="tool" size="lg" style="margin-right: 22rpx" />
				<view class="grow">
					<view class="head-name">
						{{ tool.name }}
						<text v-if="tool.net" class="tag-net">联网</text>
					</view>
					<view class="head-desc">{{ tool.desc }}</view>
				</view>
			</view>
			<view v-if="tool.net" class="net-bar">
				<text>联网{{ netOn ? '已开启' : '默认关闭' }} · 仅在点击时请求</text>
				<text class="net-bar-link" @click="goSettings">设置 ›</text>
			</view>
		</view>
		<view class="card" v-if="!tool"><view class="empty">工具不存在，请返回首页重新选择</view></view>
		<view class="card" v-else-if="tool.dev"><view class="empty">⚙️ 该工具（{{ tool.name }}）待开发中，敬请期待</view></view>

		<tool-image v-else-if="key === 'image'" />
		<tool-encoding v-else-if="key === 'encoding'" />
		<tool-json v-else-if="key === 'json'" />
		<tool-table v-else-if="key === 'table'" />
		<tool-radix v-else-if="key === 'radix'" />
		<tool-color v-else-if="key === 'color'" />
		<tool-timestamp v-else-if="key === 'timestamp'" />
		<tool-markdown v-else-if="key === 'markdown'" />
		<tool-url v-else-if="key === 'url'" />
		<tool-jwt v-else-if="key === 'jwt'" />
		<tool-text v-else-if="key === 'text'" />
		<tool-unit v-else-if="key === 'unit'" />
		<tool-hash v-else-if="key === 'hash'" />
		<tool-password v-else-if="key === 'password'" />
		<tool-qrcode v-else-if="key === 'qrcode'" />
		<tool-random v-else-if="key === 'random'" />
		<tool-timer v-else-if="key === 'timer'" />
		<tool-datecalc v-else-if="key === 'datecalc'" />
		<tool-calc v-else-if="key === 'calc'" />
		<tool-regex v-else-if="key === 'regex'" />
		<tool-uuid v-else-if="key === 'uuid'" />
		<tool-diff v-else-if="key === 'diff'" />
		<tool-rmb v-else-if="key === 'rmb'" />
		<tool-scan v-else-if="key === 'scan'" />
		<tool-nethttp v-else-if="key === 'nethttp'" />
		<tool-netinfo v-else-if="key === 'netinfo'" />
		<tool-netrate v-else-if="key === 'netrate'" />
		<tool-netquote v-else-if="key === 'netquote'" />
		<tool-netupdate v-else-if="key === 'netupdate'" />
		<tool-watermark v-else-if="key === 'watermark'" />
		<tool-imagebase64 v-else-if="key === 'imagebase64'" />
		<tool-loan v-else-if="key === 'loan'" />
		<tool-tax v-else-if="key === 'tax'" />
		<tool-bmi v-else-if="key === 'bmi'" />
		<tool-percent v-else-if="key === 'percent'" />
		<tool-lunar v-else-if="key === 'lunar'" />
		<tool-idcard v-else-if="key === 'idcard'" />
		<tool-timezone v-else-if="key === 'timezone'" />
		<tool-barcode v-else-if="key === 'barcode'" />
		<tool-ipcalc v-else-if="key === 'ipcalc'" />
		<tool-cheatsheet v-else-if="key === 'cheatsheet'" />
		<tool-compass v-else-if="key === 'compass'" />
		<tool-morse v-else-if="key === 'morse'" />
		<tool-split v-else-if="key === 'split'" />
		<tool-detect v-else-if="key === 'detect'" />
		<tool-cron v-else-if="key === 'cron'" />
		<tool-pwdstrength v-else-if="key === 'pwdstrength'" />
	</view>
</template>

<script>
	import { themeMixin } from '../../utils/theme.js'
	import { getTool } from '../../utils/tools.js'
	import { isNetEnabled } from '../../utils/net.js'
	import TbBadge from '../../components/ui/tb-badge.vue'

	import ToolImage from '../../components/tools/tool-image.vue'
	import ToolEncoding from '../../components/tools/tool-encoding.vue'
	import ToolJson from '../../components/tools/tool-json.vue'
	import ToolTable from '../../components/tools/tool-table.vue'
	import ToolRadix from '../../components/tools/tool-radix.vue'
	import ToolColor from '../../components/tools/tool-color.vue'
	import ToolTimestamp from '../../components/tools/tool-timestamp.vue'
	import ToolText from '../../components/tools/tool-text.vue'
	import ToolUnit from '../../components/tools/tool-unit.vue'
	import ToolHash from '../../components/tools/tool-hash.vue'
	import ToolPassword from '../../components/tools/tool-password.vue'
	import ToolQrcode from '../../components/tools/tool-qrcode.vue'
	import ToolRandom from '../../components/tools/tool-random.vue'
	import ToolTimer from '../../components/tools/tool-timer.vue'
	import ToolDatecalc from '../../components/tools/tool-datecalc.vue'
	import ToolCalc from '../../components/tools/tool-calc.vue'
	import ToolMarkdown from '../../components/tools/tool-markdown.vue'
	import ToolUrl from '../../components/tools/tool-url.vue'
	import ToolJwt from '../../components/tools/tool-jwt.vue'
	import ToolRegex from '../../components/tools/tool-regex.vue'
	import ToolUuid from '../../components/tools/tool-uuid.vue'
	import ToolDiff from '../../components/tools/tool-diff.vue'
	import ToolRmb from '../../components/tools/tool-rmb.vue'
	import ToolScan from '../../components/tools/tool-scan.vue'
	import ToolNethttp from '../../components/tools/tool-nethttp.vue'
	import ToolNetinfo from '../../components/tools/tool-netinfo.vue'
	import ToolNetrate from '../../components/tools/tool-netrate.vue'
	import ToolNetquote from '../../components/tools/tool-netquote.vue'
	import ToolNetupdate from '../../components/tools/tool-netupdate.vue'
	import ToolWatermark from '../../components/tools/tool-watermark.vue'
	import ToolImagebase64 from '../../components/tools/tool-imagebase64.vue'
	import ToolLoan from '../../components/tools/tool-loan.vue'
	import ToolTax from '../../components/tools/tool-tax.vue'
	import ToolBmi from '../../components/tools/tool-bmi.vue'
	import ToolPercent from '../../components/tools/tool-percent.vue'
	import ToolLunar from '../../components/tools/tool-lunar.vue'
	import ToolIdcard from '../../components/tools/tool-idcard.vue'
	import ToolTimezone from '../../components/tools/tool-timezone.vue'
	import ToolBarcode from '../../components/tools/tool-barcode.vue'
	import ToolIpcalc from '../../components/tools/tool-ipcalc.vue'
	import ToolCheatsheet from '../../components/tools/tool-cheatsheet.vue'
	import ToolCompass from '../../components/tools/tool-compass.vue'
	import ToolMorse from '../../components/tools/tool-morse.vue'
	import ToolSplit from '../../components/tools/tool-split.vue'
	import ToolDetect from '../../components/tools/tool-detect.vue'
	import ToolCron from '../../components/tools/tool-cron.vue'
	import ToolPwdstrength from '../../components/tools/tool-pwdstrength.vue'

	export default {
		mixins: [themeMixin],
		components: {
			TbBadge,
			ToolImage, ToolEncoding, ToolJson, ToolTable, ToolRadix, ToolColor, ToolTimestamp,
			ToolText, ToolUnit, ToolHash, ToolPassword, ToolQrcode, ToolRandom, ToolTimer,
			ToolDatecalc, ToolCalc, ToolMarkdown, ToolUrl, ToolJwt, ToolRegex, ToolUuid,
			ToolDiff, ToolRmb, ToolScan, ToolNethttp, ToolNetinfo, ToolNetrate, ToolNetquote, ToolNetupdate,
			ToolWatermark, ToolImagebase64, ToolLoan, ToolTax, ToolBmi, ToolPercent, ToolLunar,
			ToolIdcard, ToolTimezone, ToolBarcode, ToolIpcalc, ToolCheatsheet, ToolCompass,
			ToolMorse, ToolSplit, ToolDetect, ToolCron, ToolPwdstrength
		},
		data() {
			return { key: '', tool: null, netOn: false }
		},
		onLoad(options) {
			this.key = (options && options.key) || ''
			this.tool = getTool(this.key)
			uni.setNavigationBarTitle({ title: this.tool ? this.tool.name : '工具' })
		},
		onShow() { this.netOn = isNetEnabled() },
		onShareAppMessage() {
			return { title: this.tool ? this.tool.name + ' - 口袋工具箱' : '口袋工具箱' }
		},
		methods: {
			goSettings() { uni.switchTab({ url: '/pages/mine/mine' }) }
		}
	}
</script>

<style scoped>
	.head {
		background: var(--card); border-radius: var(--radius);
		padding: var(--sp-4); margin-bottom: var(--sp-4); box-shadow: var(--shadow);
	}
	.head-main { display: flex; flex-direction: row; align-items: center; }
	.head-name { font-size: 31rpx; font-weight: 600; color: var(--text); }
	.head-desc { font-size: 23rpx; color: var(--text-3); margin-top: 8rpx; }
	.net-bar {
		display: flex; flex-direction: row; align-items: center;
		margin-top: var(--sp-3); padding-top: var(--sp-3);
		border-top: 1rpx solid var(--line);
		font-size: 23rpx; color: var(--text-2);
	}
	.net-bar-link { margin-left: auto; color: var(--primary); font-weight: 600; }
</style>
