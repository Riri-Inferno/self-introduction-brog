// 画像の保存先。実装は環境ごとに切り替える(ADR 0011)
// key は DB に保存するオブジェクトキー(例: "projects/gcp-vector-search.png")

export interface ImageStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  delete(key: string): Promise<void>
  /** 画面に表示するための URL を組み立てる(ADR 0008) */
  url(key: string): string
}
