export type Course = {
  id: number;
  title: string;
  description: string;
  price: number | string;
};

export type Purchase = {
  id: number;
  userId: number;
  cursoId: number;
  status: "PENDENTE" | "PAGO" | "CANCELADO";
  valor: number | string;
  pagamentoId?: string | null;
  createdAt: string;
  pagoEm?: string | null;
  expiraEm?: string | null;
};

export type Lesson = { id: number; title: string; videoId: string; cursoId: number };

export type LessonPlayback = {
  type: string;
  hlsUrl: string | null;
  expiresAt: string;
  blocked?: boolean;
};

export type PixQrCode = {
  compraId: number;
  pagamentoId: string;
  encodedImage: string;
  payload: string;
  expirationDate: string | null;
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      cache: "no-store",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Estamos com uma instabilidade momentânea. Tente novamente em alguns instantes.");
  }

  if (!response.ok) {
    let message = "Não foi possível concluir a operação. Tente novamente.";
    try {
      const data = await response.json() as { message?: string | string[] };
      if (typeof data.message === "string") message = data.message;
      else if (Array.isArray(data.message)) message = data.message.join(" ");
    } catch { /* resposta sem JSON */ }
    if (response.status === 401) {
      if (typeof window !== "undefined") window.dispatchEvent(new Event("session-expired"));
      throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    }
    if (response.status === 403) throw new Error("Acesso não autorizado para esta operação.");
    if (response.status >= 500) throw new Error("A plataforma está temporariamente indisponível. Tente novamente.");
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getCourses() {
  return request<Course[]>("/curso");
}

export async function getCourse(id: number) {
  return request<Course>(`/curso/${id}`);
}

export const authService = {
  login: (data: { email: string; password: string }) => request<{ access_token: string }>("/auth/signin", { method: "POST", body: JSON.stringify(data) }),
  register: (data: { name: string; email: string; password: string }) => request<{ message: string; user: { id: number; name: string; email: string } }>("/user", { method: "POST", body: JSON.stringify(data) }),
};

export type UpdateUserData = { name?: string; email?: string; password?: string; currentPassword?: string };

export const userService = {
  update: (id: number, data: UpdateUserData, token: string) => request<{ message: string }>(`/user/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
};

export const purchaseService = {
  create: (courseId: number, token: string) => request<Purchase>(`/compra/${courseId}`, { method: "POST" }, token),
  list: (token: string) => request<Purchase[]>("/compra", {}, token),
  get: (id: number, token: string) => request<Purchase | null>(`/compra/${id}`, {}, token),
  cancel: (id: number, token: string) => request<Purchase>(`/compra/${id}`, { method: "DELETE" }, token),
};

export const paymentService = {
  createPix: (purchaseId: number, cpfCnpj: string, token: string) => request<{ compraId: number; pagamentoId: string; status: string }>(`/asaas/compra/${purchaseId}/pix`, { method: "POST", body: JSON.stringify({ cpfCnpj }) }, token),
  qrCode: (purchaseId: number, token: string) => request<PixQrCode>(`/asaas/compra/${purchaseId}/pix/qrcode`, {}, token),
};

export const lessonService = {
  list: (courseId: number, token: string) => request<Lesson[]>(`/cursos/${courseId}/aulas`, {}, token),
  get: (lessonId: number, token: string) => request<Lesson>(`/aulas/${lessonId}`, {}, token),
  playback: (lessonId: number, token: string) => request<LessonPlayback>(`/aulas/${lessonId}/playback`, {}, token),
};

export const adminService = {
  createCourse: (data: { title: string; description: string; price: number }, token: string) => request<Course>("/curso", { method: "POST", body: JSON.stringify(data) }, token),
  updateCourse: (id: number, data: Partial<{ title: string; description: string; price: number }>, token: string) => request<Course>(`/curso/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  deleteCourse: (id: number, token: string) => request<Course>(`/curso/${id}`, { method: "DELETE" }, token),
  listCourseLessons: (courseId: number, token: string) => request<Lesson[]>(`/cursos/${courseId}/admin/aulas`, {}, token),
  getLesson: (lessonId: number, token: string) => request<Lesson>(`/aulas/${lessonId}/admin/aula`, {}, token),
  lessonPlayback: (lessonId: number, token: string) => request<LessonPlayback>(`/admin/aulas/${lessonId}/playback`, {}, token),
  createVideasUploadSession: (data: { filename: string; size: number }, token: string) => request<import("./videas-upload").VideasUploadSession>("/admin/videas/upload", { method: "POST", body: JSON.stringify(data) }, token),
  createLesson: (courseId: number, data: { title: string; videoId: string }, token: string) => request<Lesson>(`/cursos/${courseId}/aulas`, { method: "POST", body: JSON.stringify(data) }, token),
  updateLesson: (id: number, data: Partial<{ title: string; videoId: string }>, token: string) => request<Lesson>(`/aulas/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
  deleteLesson: (id: number, token: string) => request<Lesson>(`/aulas/${id}`, { method: "DELETE" }, token),
};

export function formatPrice(price: Course["price"]) {
  const value = typeof price === "string" ? Number(price) : price;
  if (!Number.isFinite(value)) return "Valor indisponível";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
