// 業務上のエラー。presentation 層でレスポンスの error.code に変換する(ADR 0015)
// HTTP のステータスはここでは決めない

/** どのデータについてのエラーかを表す */
export interface ErrorTarget {
  /** データの種類。モデル名を使う(例: 'Profile'、'Post') */
  resource: string
  /** データを特定する値。id や slug など。1件に決まらないときは省略する */
  id?: string | number
  /** 既定の文言を使わないときに指定する */
  message?: string
}

export class DomainError extends Error {
  readonly resource: string
  readonly id: string | number | undefined

  constructor(target: ErrorTarget, defaultMessage: string) {
    super(target.message ?? defaultMessage)
    this.name = new.target.name
    this.resource = target.resource
    this.id = target.id
  }
}

/** 「Post (id: hello)」のように、対象を文言に入れる */
const describe = ({ resource, id }: ErrorTarget) =>
  id === undefined ? resource : `${resource} (id: ${id})`

/**
 * 対象のデータがない。
 * 閲覧用 API では、非公開のデータもこのエラーにする。存在するかどうかを外に漏らさないため。
 */
export class NotFoundError extends DomainError {
  constructor(target: ErrorTarget) {
    super(target, `${describe(target)} が見つかりません`)
  }
}

/** 一意の値の重複や、使われているデータの削除など、今のデータと矛盾する */
export class ConflictError extends DomainError {
  constructor(target: ErrorTarget) {
    super(target, `${describe(target)} は今のデータと矛盾するため処理できません`)
  }
}
