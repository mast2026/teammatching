import { post } from "../api.js";

export function attachReadState(items) {
  return (items ?? []).map((item) => ({
    ...item,
    read: Boolean(item.read),
  }));
}

export function countUnread(items) {
  return attachReadState(items).filter((item) => !item.read).length;
}

export async function markNotificationsRead(ids) {
  if (!ids?.length) return;
  try {
    await post("/notifications/read", { keys: ids });
  } catch {
    // 읽음 처리 실패 시 UI는 그대로 두고 다음 새로고침에 재시도
  }
}
