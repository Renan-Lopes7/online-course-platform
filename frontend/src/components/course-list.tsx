"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Course, formatPrice, getCourses } from "@/lib/api";

export function CourseList() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCourses().then(setCourses).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Ocorreu um erro ao carregar os cursos.");
    });
  }, []);

  if (error) return <div className="state-card" role="alert"><p>{error}</p><button className="text-button" onClick={() => { setError(""); setCourses(null); getCourses().then(setCourses).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Erro ao carregar os cursos.")); }}>TENTAR NOVAMENTE <span>↗</span></button></div>;
  if (courses === null) return <div className="state-card" aria-live="polite"><span className="loader" /> <p>CARREGANDO CATÁLOGO</p></div>;
  if (courses.length === 0) return <div className="state-card"><p>Nenhum curso disponível no momento.</p></div>;

  return <div className="course-list">
    {courses.map((course) => (
      <Link className="course-row" href={`/cursos/${course.id}`} key={course.id}>
        <div className="course-art" aria-hidden="true"><Image src="/images/stone-course-banner.png" alt="" fill sizes="(max-width: 600px) 100vw, 30vw" /></div>
        <div className="course-copy"><h2>{course.title}</h2><p>{course.description}</p></div>
        <span className="course-price">{formatPrice(course.price)}</span>
        <span className="course-arrow" aria-hidden="true">⟶</span>
      </Link>
    ))}
  </div>;
}
