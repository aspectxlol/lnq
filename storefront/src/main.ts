import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@fontsource/inter'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'

import '@fontsource/cormorant-garamond'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'

import App from './App.vue'
import router from './router'

import '@/assets/main.css'
import '@/assets/theme.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
