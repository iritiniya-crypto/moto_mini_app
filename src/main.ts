import 'primeicons/primeicons.css'

import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'

import WebApp from '@twa-dev/sdk'
import PrimeVue from 'primevue/config'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Card from 'primevue/card'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Aura from '@primeuix/themes/aura';
import './style.css'


const app = createApp(App)
const pinia = createPinia()

app.use(PrimeVue, {
  theme: {
    preset: Aura
  },
  options: {
    darkModeSelector: '.dark-mode',
    cssLayer: true,
  },
});

app.use(pinia)
app.component('Avatar', Avatar)
app.component('Button', Button)
app.component('Card', Card)
app.component('DatePicker', DatePicker)
app.component('Dialog', Dialog)
app.component('Divider', Divider)
app.component('Drawer', Drawer)
app.component('InputText', InputText)
app.component('ProgressBar', ProgressBar)
app.component('Select', Select)
app.component('Tag', Tag)
app.component('Textarea', Textarea)

app.mount('#app')

if (typeof WebApp.ready === 'function') {
  WebApp.ready()
}

if (typeof WebApp.expand === 'function') {
  WebApp.expand()
}
