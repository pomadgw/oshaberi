import './cmarked'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './style.css'
import App from './NewApp.vue'

const pinia = createPinia()

createApp(App).use(pinia).mount('#app')
