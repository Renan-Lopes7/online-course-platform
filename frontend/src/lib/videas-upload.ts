export type VideasUploadSession = {
  uploadId: string;
  assetId: string;
  uploadUrl: string;
  uploadToken: string;
  maxPutBytes: number;
  expiresAt: string;
};

const MAX_TUS_CHUNK_BYTES = 32 * 1024 * 1024;
const MIN_TUS_CHUNK_BYTES = 5 * 1024 * 1024;

function assertUploadUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "api.videas.com") {
    throw new Error("O Videas retornou um endereço de upload inválido.");
  }
  return url.toString();
}

function transfer(
  url: string,
  method: "PUT" | "HEAD" | "PATCH",
  token: string,
  options: { file?: File; start?: number; end?: number; offset?: number; onProgress?: (loaded: number) => void } = {},
) {
  return new Promise<XMLHttpRequest>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("X-Upload-Token", token);
    if (method === "PATCH") {
      xhr.setRequestHeader("Tus-Resumable", "1.0.0");
      xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");
      xhr.setRequestHeader("Upload-Offset", String(options.offset));
    } else if (method === "HEAD") {
      xhr.setRequestHeader("Tus-Resumable", "1.0.0");
    }
    xhr.onload = () => {
      const expectedStatus = method === "HEAD" ? 200 : 204;
      if (xhr.status === expectedStatus) resolve(xhr);
      else if (xhr.status === 409) reject(new Error("O Videas informou que o arquivo já recebeu dados. Tente iniciar o envio novamente."));
      else if (xhr.status === 401 || xhr.status === 403) reject(new Error("A autorização temporária do upload expirou. Gere uma nova sessão e tente novamente."));
      else reject(new Error(`O Videas não aceitou o envio do arquivo (código ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Não foi possível conectar ao Videas durante o envio. Verifique sua conexão e tente novamente."));
    xhr.onabort = () => reject(new Error("O envio do vídeo foi interrompido."));
    xhr.upload.onprogress = event => {
      if (event.lengthComputable && options.onProgress) options.onProgress(event.loaded);
    };
    if (method === "HEAD") xhr.send();
    else if (method === "PUT") xhr.send(options.file!);
    else xhr.send(options.file!.slice(options.start, options.end));
  });
}

/** Sends the file directly to the capability URL returned by the backend. */
export async function uploadToVideas(
  file: File,
  session: VideasUploadSession,
  onProgress: (percent: number) => void,
) {
  const url = assertUploadUrl(session.uploadUrl);
  if (!session.uploadToken || !session.assetId) {
    throw new Error("A sessão de upload não retornou os dados necessários. Tente novamente.");
  }
  const maxPutBytes = Number(session.maxPutBytes);
  if (!Number.isSafeInteger(maxPutBytes) || maxPutBytes <= 0) {
    throw new Error("O Videas não informou o limite de envio desta sessão.");
  }

  if (file.size <= maxPutBytes) {
    await transfer(url, "PUT", session.uploadToken, {
      file,
      onProgress: loaded => onProgress(Math.min(99, Math.round((loaded / file.size) * 100))),
    });
    onProgress(100);
    return session.assetId;
  }

  if (maxPutBytes < MIN_TUS_CHUNK_BYTES) {
    throw new Error("O limite informado pelo Videas é pequeno demais para enviar este arquivo em partes.");
  }
  const chunkSize = Math.min(maxPutBytes, MAX_TUS_CHUNK_BYTES);
  let head = await transfer(url, "HEAD", session.uploadToken);
  let offset = Number(head.getResponseHeader("Upload-Offset"));
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > file.size) {
    throw new Error("Não foi possível confirmar a posição do envio no Videas.");
  }

  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size);
    const chunkStart = offset;
    const result = await transfer(url, "PATCH", session.uploadToken, {
      file,
      start: chunkStart,
      end,
      offset: chunkStart,
      onProgress: loaded => onProgress(Math.min(99, Math.round(((chunkStart + loaded) / file.size) * 100))),
    });
    const confirmedOffset = result.getResponseHeader("Upload-Offset");
    offset = confirmedOffset === null ? Number.NaN : Number(confirmedOffset);
    if (offset !== end) throw new Error("O Videas não confirmou todos os dados enviados. Tente novamente.");
    onProgress(Math.min(99, Math.round((offset / file.size) * 100)));
  }

  // Confirm the final TUS offset before exposing the returned asset id in the form.
  head = await transfer(url, "HEAD", session.uploadToken);
  const finalOffset = Number(head.getResponseHeader("Upload-Offset"));
  if (finalOffset !== file.size) throw new Error("O Videas ainda não confirmou o recebimento completo do arquivo.");
  onProgress(100);
  return session.assetId;
}
