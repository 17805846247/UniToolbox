/**
 * 应用版本号。与 manifest.json 的 versionName 保持一致，打包前手动同步。
 * 检查更新等场景从这里读取「当前版本」，避免在各处硬编码导致漏改。
 */
export const APP_VERSION = '2.2.0'

/** 取纯数字版本号（去掉前导 v），便于展示与比较。 */
export function getVersionName() {
	return APP_VERSION
}
