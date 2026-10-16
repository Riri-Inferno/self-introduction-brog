// ports/ には、複数の機能から使う外部とのインターフェース(ポート)を置く
// 1つの機能でしか使わないものは、その機能のフォルダに置く(例: profile/public-profile-query.ts)
// 置き場所の決まりは docs/backend-api.md の「インターフェースの置き場所」を参照

// 画像の保存先。実装は環境ごとに切り替える(ADR 0011)
// key は DB に保存するオブジェクトキー(例: "projects/gcp-vector-search.png")

export interface ImageStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  delete(key: string): Promise<void>
  /** 画面に表示するための URL を組み立てる(ADR 0008) */
  url(key: string): string
}
