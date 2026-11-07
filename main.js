import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
import TbInput from './components/ui/tb-input.vue'
import TbTextarea from './components/ui/tb-textarea.vue'
export function createApp() {
	const app = createSSRApp(App)
	// 全局注册非受控输入组件：彻底解决中文输入法在受控回写下被打断的问题
	app.component('tb-input', TbInput)
	app.component('tb-textarea', TbTextarea)
	return {
		app
	}
}
// #endif
