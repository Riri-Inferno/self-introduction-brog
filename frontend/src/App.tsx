import { useEffect, useState } from 'react'

// 動作確認用のページ。Tailwind と、/api のプロキシが効いているかを確かめる
// 本物の画面を作るときに置き換える

export function App() {
  // 状態(Vue の ref に当たる)。値を変えるときは必ず set 関数を使う
  const [profile, setProfile] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  // 最初の表示のあとに1回だけ動く(Vue の onMounted に当たる)
  // 第2引数の [] を忘れると、描き直すたびに動いてしまう
  useEffect(() => {
    fetch('/api/public/profile')
      .then((res) => res.json())
      .then((body) => setProfile(body))
      .catch((e: unknown) => setError(String(e)))
  }, [])

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-red-600">これは見本です</h1>

      <h2 className="mt-6 text-xl">GET /api/public/profile</h2>
      {/* v-if / v-else の代わりに三項演算子で書き分ける */}
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <pre className="mt-2 rounded bg-gray-100 p-4 text-sm">
          {profile ? JSON.stringify(profile, null, 2) : '読み込み中...'}
        </pre>
      )}
    </main>
  )
}
