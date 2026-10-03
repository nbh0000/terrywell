export async function register() {
  // 로컬 모드: 관리자 계정이 없으면 만들고 .data/admin-login.txt 에 적어 둔다
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureLocalAdmin } = await import("@/lib/auth");
    await ensureLocalAdmin();
  }
}
