import "server-only";

// 관리자 알림 (견적문의 접수 등). 메일 발송은 선택 기능이라 구조만 둔다.
// NOTIFY_WEBHOOK_URL 이 있으면 JSON 으로 보내고, 없으면 서버 로그에만 남긴다.
export async function notifyAdmin(subject: string, body: Record<string, unknown>) {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) {
    console.info(`[notify] ${subject}`, body);
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, ...body }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.warn("[notify] 전송 실패", e);
  }
}
