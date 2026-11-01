import { SiteHeader } from "@/components/site-header";
import { CourseList } from "@/components/course-list";

export default function HomePage() {
  return <><SiteHeader /><main>
    <section className="hero">
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-content">
        <a className="hero-social" href="https://www.instagram.com/stone_barb021/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Barber Stone">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle className="instagram-dot" cx="17.5" cy="6.5" r="1"/></svg>
          <span>@stone_barb021</span>
        </a>
        <div className="hero-title-row"><h1>ST<em>ONE</em></h1><div className="hero-meta">FORMAÇÃO ONLINE <span>•</span> <em>BARBEARIA</em></div></div>
      </div>
      <span className="hero-vertical">BARBER STONE — FORMAÇÃO DIGITAL</span>
    </section>
    <section className="home-catalog"><div className="section-heading"><h2>CURSOS</h2></div><CourseList /></section>
  </main></>;
}
