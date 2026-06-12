export function HeroBanner({ user }) {
  const name = user?.name ?? "회원";

  return (
    <section className="hero-banner hero-banner-compact">
      <div className="hero-banner-content">
        <p className="hero-eyebrow">내 대시보드</p>
        <h2>{name}님, 지금 참여할 공모전을 찾아보세요</h2>
        <p className="hero-sub">공모전 탐색, 팀 매칭, 지원 현황을 한 곳에서 관리하세요</p>
      </div>
      <div className="hero-banner-visual" aria-hidden="true">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
      </div>
    </section>
  );
}
