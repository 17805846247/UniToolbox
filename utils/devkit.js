/**
 * 开发 / 设备类纯函数：IPv4 子网计算、EAN-13 商品条码编码、开发者速查表、传感器角度。
 * 全部离线，可直接用 Node 单元测试。
 */
const r1 = n => Math.round(n * 10) / 10

/* ================= IPv4 / CIDR ================= */
export function ipToInt(ip) {
	const parts = String(ip || '').trim().split('.')
	if (parts.length !== 4) throw new Error('IPv4 地址需为 4 段，例如 192.168.1.1')
	const nums = parts.map(p => {
		if (!/^\d{1,3}$/.test(p)) throw new Error('IP 段必须是 0~255 的数字')
		const n = Number(p)
		if (n > 255) throw new Error('IP 段不能超过 255')
		return n
	})
	return (((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0)
}
export function intToIp(n) {
	const v = Number(n) >>> 0
	return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.')
}
export function maskFromPrefix(prefix) {
	const p = Number(prefix)
	if (!Number.isInteger(p) || p < 0 || p > 32) throw new Error('掩码位需在 0~32 之间')
	return p === 0 ? 0 : ((0xFFFFFFFF << (32 - p)) >>> 0)
}

export function parseCidr(input) {
	const s = String(input || '').trim()
	if (!s) throw new Error('请输入 IP 或 CIDR，例如 192.168.1.10/24')
	const [ipPart, maskPart] = s.split('/')
	const ipInt = ipToInt(ipPart)
	let prefix
	if (maskPart === undefined || maskPart === '') prefix = 32
	else if (/^\d{1,2}$/.test(maskPart)) prefix = Number(maskPart)
	else {
		const m = ipToInt(maskPart)
		const inv = (~m) >>> 0
		// 必须是连续 1 的合法掩码
		if (((inv + 1) & inv) !== 0) throw new Error('子网掩码不合法（必须为连续的 1）')
		prefix = 32 - Math.round(Math.log2(inv + 1))
	}
	if (prefix < 0 || prefix > 32) throw new Error('掩码位需在 0~32 之间')
	const mask = maskFromPrefix(prefix)
	const wildcard = (~mask) >>> 0
	const network = (ipInt & mask) >>> 0
	const broadcast = (network | wildcard) >>> 0
	const usableFirst = prefix >= 31 ? network : ((network + 1) >>> 0)
	const usableLast = prefix >= 31 ? broadcast : ((broadcast - 1) >>> 0)
	const hostCount = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2
	const firstOctet = (ipInt >>> 24) & 255
	const ipClass = firstOctet < 128 ? 'A' : firstOctet < 192 ? 'B' : firstOctet < 224 ? 'C' : firstOctet < 240 ? 'D（组播）' : 'E（保留）'
	const isPrivate = (firstOctet === 10) ||
		(firstOctet === 172 && ((ipInt >>> 16) & 255) >= 16 && ((ipInt >>> 16) & 255) <= 31) ||
		(firstOctet === 192 && ((ipInt >>> 16) & 255) === 168)
	let kind = '公网地址'
	if (isPrivate) kind = '私有地址（RFC1918）'
	else if (firstOctet === 127) kind = '回环地址'
	else if (firstOctet === 169 && ((ipInt >>> 16) & 255) === 254) kind = '链路本地地址'
	else if (firstOctet >= 224 && firstOctet < 240) kind = '组播地址'
	else if (firstOctet === 0) kind = '保留地址'
	return {
		ip: intToIp(ipInt), prefix, cidr: intToIp(network) + '/' + prefix,
		mask: intToIp(mask), wildcard: intToIp(wildcard),
		network: intToIp(network), broadcast: intToIp(broadcast),
		firstHost: intToIp(usableFirst), lastHost: intToIp(usableLast),
		hostCount, ipClass, kind, isPrivate,
		binary: [ipInt, mask, network, broadcast].map(n => (n >>> 0).toString(2).padStart(32, '0').replace(/(.{8})/g, '$1 ').trim())
	}
}

/* ================= EAN-13 商品条码 ================= */
const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
const EAN_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

export function ean13CheckDigit(first12) {
	const s = String(first12 || '')
	if (!/^\d{12}$/.test(s)) throw new Error('请输入 12 位数字（不含校验位）')
	let sum = 0
	for (let i = 0; i < 12; i++) sum += Number(s.charAt(i)) * (i % 2 === 0 ? 1 : 3)
	return (10 - (sum % 10)) % 10
}

/** 输入 12 或 13 位数字，输出 95 模块的 0/1 条空序列 */
export function ean13Encode(input) {
	let s = String(input || '').replace(/\s|-/g, '')
	if (/^\d{12}$/.test(s)) s += ean13CheckDigit(s)
	if (!/^\d{13}$/.test(s)) throw new Error('请输入 12 位或 13 位数字')
	const check = ean13CheckDigit(s.slice(0, 12))
	const valid = Number(s.charAt(12)) === check
	const parity = EAN_PARITY[Number(s.charAt(0))]
	let bits = '101'
	for (let i = 0; i < 6; i++) {
		const d = Number(s.charAt(i + 1))
		bits += (parity.charAt(i) === 'L' ? EAN_L : EAN_G)[d]
	}
	bits += '01010'
	for (let i = 0; i < 6; i++) bits += EAN_R[Number(s.charAt(i + 7))]
	bits += '101'
	return { digits: s, checkDigit: check, valid, bits, modules: bits.length }
}

/* ================= 开发者速查 ================= */
export const CHEATS = [
	{
		key: 'http', name: 'HTTP 状态码', items: [
			['200', 'OK 请求成功'], ['201', 'Created 已创建'], ['204', 'No Content 无响应体'],
			['206', 'Partial Content 断点续传'], ['301', 'Moved Permanently 永久重定向'],
			['302', 'Found 临时重定向'], ['304', 'Not Modified 缓存未变'],
			['400', 'Bad Request 参数错误'], ['401', 'Unauthorized 未登录'], ['403', 'Forbidden 无权限'],
			['404', 'Not Found 资源不存在'], ['405', 'Method Not Allowed 方法不允许'],
			['408', 'Request Timeout 请求超时'], ['409', 'Conflict 资源冲突'], ['413', 'Payload Too Large 请求体过大'],
			['415', 'Unsupported Media Type 类型不支持'], ['418', "I'm a teapot 彩蛋"],
			['422', 'Unprocessable Entity 语义错误'], ['429', 'Too Many Requests 限流'],
			['500', 'Internal Server Error 服务端错误'], ['501', 'Not Implemented 未实现'],
			['502', 'Bad Gateway 网关错误'], ['503', 'Service Unavailable 服务不可用'],
			['504', 'Gateway Timeout 网关超时']
		]
	},
	{
		key: 'mime', name: 'MIME 类型', items: [
			['.html', 'text/html'], ['.css', 'text/css'], ['.js', 'application/javascript'],
			['.json', 'application/json'], ['.xml', 'application/xml'], ['.txt', 'text/plain'],
			['.md', 'text/markdown'], ['.csv', 'text/csv'], ['.pdf', 'application/pdf'],
			['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.gif', 'image/gif'],
			['.webp', 'image/webp'], ['.svg', 'image/svg+xml'], ['.ico', 'image/x-icon'],
			['.mp3', 'audio/mpeg'], ['.mp4', 'video/mp4'], ['.webm', 'video/webm'],
			['.zip', 'application/zip'], ['.gz', 'application/gzip'],
			['.woff2', 'font/woff2'], ['.apk', 'application/vnd.android.package-archive'],
			['form', 'application/x-www-form-urlencoded'], ['multipart', 'multipart/form-data']
		]
	},
	{
		key: 'port', name: '常用端口', items: [
			['20 / 21', 'FTP 数据 / 控制'], ['22', 'SSH / SFTP'], ['23', 'Telnet'], ['25', 'SMTP'],
			['53', 'DNS'], ['80', 'HTTP'], ['110', 'POP3'], ['143', 'IMAP'], ['443', 'HTTPS'],
			['445', 'SMB'], ['1080', 'SOCKS 代理'], ['1433', 'SQL Server'], ['1521', 'Oracle'],
			['3000', 'Node 开发常用'], ['3306', 'MySQL'], ['3389', '远程桌面 RDP'],
			['5173', 'Vite 开发'], ['5432', 'PostgreSQL'], ['6379', 'Redis'],
			['8080', 'HTTP 备用 / Tomcat'], ['8443', 'HTTPS 备用'], ['8888', '常见管理后台'],
			['9200', 'Elasticsearch'], ['27017', 'MongoDB']
		]
	},
	{
		key: 'header', name: 'HTTP 请求头', items: [
			['Accept', '可接受的响应类型'], ['Authorization', '身份凭证 / Token'],
			['Content-Type', '请求体类型'], ['User-Agent', '客户端标识'],
			['Cookie', '会话 Cookie'], ['Referer', '来源页面'],
			['Cache-Control', '缓存策略'], ['If-None-Match', 'ETag 条件请求'],
			['X-Requested-With', '标记 Ajax 请求'], ['Origin', '跨域来源']
		]
	},
	{
		key: 'regex', name: '正则速查', items: [
			['.', '任意单个字符'], ['\\d / \\D', '数字 / 非数字'], ['\\w / \\W', '单词字符 / 非单词'],
			['\\s / \\S', '空白 / 非空白'], ['^ / $', '行首 / 行尾'],
			['* + ?', '0+ / 1+ / 0或1 次'], ['{n,m}', '重复 n~m 次'],
			['[abc] / [^abc]', '字符集合 / 取反'], ['(x) / (?:x)', '捕获组 / 非捕获组'],
			['a|b', '或'], ['(?=x) / (?!x)', '正向 / 负向预查'],
			['\\b', '单词边界'], ['g i m s', '全局 / 忽略大小写 / 多行 / 点匹配换行']
		]
	},
	{
		key: 'git', name: 'Git 常用', items: [
			['git init', '初始化仓库'], ['git clone <url>', '克隆仓库'],
			['git status', '查看状态'], ['git add .', '暂存全部改动'],
			['git commit -m "msg"', '提交'], ['git push / pull', '推送 / 拉取'],
			['git branch / checkout -b', '分支 / 新建并切换'], ['git merge <b>', '合并分支'],
			['git log --oneline', '简洁日志'], ['git reset --soft HEAD~1', '撤销上次提交(保留改动)'],
			['git stash / pop', '暂存 / 恢复工作区'], ['git diff', '查看差异']
		]
	}
]

export function searchCheats(query, groups) {
	const q = String(query || '').trim().toLowerCase()
	return (groups || CHEATS).map(g => ({
		key: g.key, name: g.name,
		items: q ? g.items.filter(it => (it[0] + ' ' + it[1]).toLowerCase().includes(q)) : g.items
	})).filter(g => g.items.length)
}

/* ================= 传感器 / 方向 ================= */
export function tiltFromAcceleration(x, y, z) {
	const ax = Number(x) || 0, ay = Number(y) || 0, az = Number(z) || 0
	const pitch = Math.atan2(ax, Math.sqrt(ay * ay + az * az)) * 180 / Math.PI
	const roll = Math.atan2(ay, Math.sqrt(ax * ax + az * az)) * 180 / Math.PI
	const norm = Math.sqrt(ax * ax + ay * ay + az * az)
	const angle = norm ? Math.acos(Math.min(1, Math.abs(az) / norm)) * 180 / Math.PI : 0
	return { pitch: r1(pitch), roll: r1(roll), angle: r1(angle), level: angle < 3 }
}

const DIRECTIONS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
export function directionName(deg) {
	const d = ((Number(deg) || 0) % 360 + 360) % 360
	return DIRECTIONS[Math.round(d / 45) % 8]
}
