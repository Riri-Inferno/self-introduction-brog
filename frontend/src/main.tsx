import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

// 入口。index.html の <div id="root"> に App を描く
// Vue の main.ts の createApp(App).mount('#app') に当たる
//
// StrictMode は開発中だけ、うっかりを見つけるために処理を2回流す(useEffect も2回動く)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
