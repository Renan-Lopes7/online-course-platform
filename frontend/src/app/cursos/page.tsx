import { SiteHeader } from "@/components/site-header";
import { CourseList } from "@/components/course-list";

export default function CoursesPage() {
  return <><SiteHeader /><main className="page-shell"><div className="section-heading page-title"><h1>CATÁLOGO</h1><span>CURSOS DISPONÍVEIS</span></div><p className="page-lede">Formação em barbearia, com conteúdo carregado diretamente da plataforma.</p><CourseList /></main><footer className="site-footer"><span>ESCOLA DE BARBEARIA</span><span>CATÁLOGO DE CURSOS</span></footer></>;
}
