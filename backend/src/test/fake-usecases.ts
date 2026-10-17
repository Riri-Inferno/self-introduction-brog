import type { PublicUsecases } from '../presentation/routes/public/index.js'

// ルートのテストに渡すユースケース
// 使うものだけを overrides で差し替える。それ以外は、呼ばれたらテストを失敗させる
const notCalled = async () => Promise.reject(new Error('このテストでは呼ばれないはず'))

export function fakeUsecases(overrides: Partial<PublicUsecases> = {}): PublicUsecases {
  return {
    getPublicProfile: notCalled,
    getPublicSkills: notCalled,
    ...overrides,
  }
}
