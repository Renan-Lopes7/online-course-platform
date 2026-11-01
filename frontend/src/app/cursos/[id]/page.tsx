import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { CourseDetail } from "@/components/course-detail";
import { getCourse } from "@/lib/api";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId) || courseId < 1) notFound();

  let course;
  try { course = await getCourse(courseId); }
  catch {
    return <><SiteHeader showHomeLink /><main className="page-shell detail-shell"><div className="state-card" role="alert"><p>Não foi possível carregar este curso agora.</p></div></main></>;
  }

  return <><SiteHeader showHomeLink /><CourseDetail initialCourse={course} /></>;
}
