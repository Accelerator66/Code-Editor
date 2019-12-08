import Vue from 'vue'
import App from './App.vue'

import "prismjs"
// import "prismjs/themes/prism.css"
import "prismjs/components/prism-java.js"
import "prismjs/themes/prism-tomorrow.css"
import "vue-prism-editor/dist/VuePrismEditor.css"

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
