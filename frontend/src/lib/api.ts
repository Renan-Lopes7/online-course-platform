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

/**
 * Only explicitly approved business messages from the API may be shown verbatim.
 * Unknown backend errors are intentionally hidden to avoid exposing implementation
 * details, database errors, stack traces, infrastructure or security information.
 */
const SAFE_BACKEND_MESSAGES = new Set([
  "Usuário não encontrado.",
  "Usuário cadastrado com sucesso.",
  "Usuário atualizado com sucesso",
  "Você não tem acesso a este curso",
  "Credencias inválidas",
]);

const SAFE_VALIDATION_MESSAGES: Record<string, string> = {
  "O nome deve ser um texto.": "Informe um nome válido.",
  "O nome é obrigatório.": "Informe seu nome.",
  "O nome deve ter no mínimo 3 caracteres.": "O nome deve ter no mínimo 3 caracteres.",
  "O nome deve ter no máximo 100 caracteres.": "O nome deve ter no máximo 100 caracteres.",
  "Informe um endereço de e-mail válido.": "Informe um endereço de e-mail válido.",
  "O e-mail é obrigatório.": "Informe seu e-mail.",
  "O e-mail deve ter no máximo 254 caracteres.": "O e-mail deve ter no máximo 254 caracteres.",
  "A senha deve ser um texto.": "Informe uma senha válida.",
  "A senha é obrigatória.": "Informe sua senha.",
  "A senha deve ter no mínimo 8 caracteres.": "A senha deve ter no mínimo 8 caracteres.",
  "A senha deve ter no máximo 72 caracteres.": "A senha deve ter no máximo 72 caracteres.",
  "O título do curso deve ser um texto.": "Informe um título válido para o curso.",
  "O título do curso é obrigatório.": "Informe o título do curso.",
  "O título do curso deve ter no máximo 150 caracteres.": "O título do curso deve ter no máximo 150 caracteres.",
  "A descrição deve ser um texto.": "Informe uma descrição válida.",
  "A descrição do curso é obrigatória.": "Informe a descrição do curso.",
  "A descrição deve ter no máximo 2000 caracteres.": "A descrição deve ter no máximo 2000 caracteres.",
  "O preço deve ser um número com até duas casas decimais.": "Informe um preço válido, com até duas casas decimais.",
  "O preço deve ser maior que zero.": "O preço deve ser maior que zero.",
  "O título deve ser um texto.": "Informe um título válido para a aula.",
  "O título da aula é obrigatório.": "Informe o título da aula.",
  "O título deve ter no máximo 150 caracteres.": "O título da aula deve ter no máximo 150 caracteres.",
  "O ID do vídeo deve ser um texto.": "Não foi possível validar o vídeo selecionado.",
  "O ID do vídeo é obrigatório.": "Selecione um vídeo para a aula.",
  "O ID do vídeo deve ter no máximo 100 caracteres.": "O vídeo selecionado não pode exceder o limite permitido.",
  "O CPF deve ser enviado como texto.": "Informe um CPF válido.",
  "O CPF é obrigatório.": "Informe seu CPF.",
  "O CPF informado é inválido.": "O CPF informado é inválido. Confira os números e tente novamente.",
};

const SAFE_BUSINESS_MESSAGES: Record<string, string> = {
  "Senha atual incorreta": "A senha atual não confere. Confira e tente novamente.",
  "Digite sua senha atual para mudar de senha": "Informe sua senha atual para alterar a senha.",
  "Este e-mail já está cadastrado.": "Este e-mail já está em uso. Tente outro endereço.",
  "Compra não encontrada": "Não foi possível encontrar esta compra. Confira sua área do aluno.",
  "Apenas compras pendentes podem gerar cobrança": "Esta compra não está mais pendente e não pode gerar um novo Pix.",
  "Esta compra já possui uma cobrança associada": "Esta compra já tem uma cobrança Pix. Abra o pagamento para consultar o código.",
  "Esta compra não possui uma cobrança Pix": "Esta compra ainda não tem uma cobrança Pix. Gere o Pix novamente.",
  "Este curso não existe": "Não foi possível encontrar este curso. Atualize a página e tente novamente.",
  "Você já comprou este curso": "Você já tem acesso a este curso. Confira sua área do aluno.",
  "Apenas compras pendentes podem ser canceladas": "Somente compras pendentes podem ser canceladas. Atualize a página para ver o status atual.",
  "Curso não encontrado": "Não foi possível encontrar este curso. Atualize a página e tente novamente.",
  "Aula não encontrada": "Não foi possível encontrar esta aula. Atualize a página e tente novamente.",
  "Essas aulas não existem para esse curso": "Este curso ainda não tem aulas disponíveis.",
  "Esta aula ainda não possui um vídeo cadastrado": "O vídeo desta aula ainda não está disponível.",
  "O vídeo desta aula está temporariamente indisponível": "O vídeo desta aula está temporariamente indisponível. Tente novamente mais tarde.",
  "Este vídeo não está disponível para reprodução": "Este vídeo está temporariamente indisponível. Tente novamente mais tarde.",
  "Acesso não autorizado": "Você não tem acesso a este conteúdo. Confira sua conta e o status da compra.",
};

function getSafeApiMessage(status: number, backendMessage: unknown, path: string): string {
  const messages = typeof backendMessage === "string"
    ? [backendMessage]
    : Array.isArray(backendMessage)
      ? backendMessage.filter((item): item is string => typeof item === "string")
      : [];

  const normalized = messages.map(message => message.trim()).filter(Boolean);
  const isLoginRequest = path === "/auth/signin";

  // Preserve only known, deliberately approved business messages.
  if (isLoginRequest && (status === 401 || status === 404)) {
    return "E-mail ou senha incorretos. Confira seus dados e tente novamente.";
  }

  const safeBusinessMessage = normalized.find(message => SAFE_BUSINESS_MESSAGES[message]);
  if (safeBusinessMessage) return SAFE_BUSINESS_MESSAGES[safeBusinessMessage];

  const safeValidationMessage = normalized.find(message => SAFE_VALIDATION_MESSAGES[message]);
  if (status === 400 && safeValidationMessage) {
    return SAFE_VALIDATION_MESSAGES[safeValidationMessage];
  }

  const approvedMessage = normalized.find(message => SAFE_BACKEND_MESSAGES.has(message));
  if (approvedMessage) {
    // Avoid revealing that an account exists during login.
    if (isLoginRequest && approvedMessage === "Usuário não encontrado.") {
      return "E-mail ou senha incorretos. Confira seus dados e tente novamente.";
    }
    return approvedMessage;
  }

  // Safe generic messages: never return raw unknown server text.
  switch (status) {
    case 400:
      return "Não foi possível validar os dados informados. Confira os campos e tente novamente.";
    case 401:
      return "Sua autenticação não é válida ou expirou. Entre novamente para continuar.";
    case 403:
      return "Não foi possível realizar esta ação com as permissões desta conta.";
    case 404:
      return "Não foi possível encontrar o conteúdo solicitado.";
    case 409:
      return "Esta operação não pode ser concluída porque os dados ou o status foram alterados. Atualize a página e tente novamente.";
    case 422:
      return "Não foi possível processar os dados informados. Confira os campos e tente novamente.";
    case 429:
      return "Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.";
    default:
      if (status >= 500) {
        return "Ocorreu um problema ao processar sua solicitação. Tente novamente mais tarde.";
      }
      return "Não foi possível concluir sua solicitação. Tente novamente.";
  }
}

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
    // Sem resposta HTTP: este aviso é necessariamente gerado pelo frontend.
    throw new Error("Não foi possível conectar à plataforma. Verifique sua conexão e tente novamente.");
  }

  if (!response.ok) {
    let backendMessage: unknown;

    try {
      const data = await response.json() as { message?: unknown };
      backendMessage = data.message;
    } catch {
      // Resposta sem JSON: usar mensagem genérica segura abaixo.
    }

    const isLoginRequest = path === "/auth/signin";
    const isProfilePasswordCheck = path.startsWith("/user/") && options.method === "PATCH";
    if (response.status === 401 && Boolean(token) && !isLoginRequest && !isProfilePasswordCheck) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("session-expired"));
      }
    }

    throw new Error(getSafeApiMessage(response.status, backendMessage, path));
  }

  if (response.status === 204 || response.status === 205) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;

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
