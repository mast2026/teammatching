import { PageHeader } from "../components/PageHeader.jsx";

export function NotFound({ admin = false }) {
  return (
    <PageHeader
      title="페이지를 찾을 수 없습니다"
      subtitle={admin ? "왼쪽 메뉴에서 다시 이동하세요" : "상단 메뉴에서 다시 이동하세요"}
    />
  );
}
