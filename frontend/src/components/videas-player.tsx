"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adminService, lessonService, LessonPlayback } from "@/lib/api";

type Props = {
  lessonId: number;
  token: string;
  admin?: boolean;
};

function resolveStreamUrl(value: string) {
  const streamUrl = value.trim();
  if (!streamUrl) return null;

  try {
    const parsed = new URL(streamUrl);
    if (parsed.protocol !== "https:") return null;

    // Use the signed URL exactly as returned so its query parameters stay intact.
    return streamUrl;
  } catch {
    return null;
  }
}

function friendlyPlaybackError(error: unknown, admin: boolean) {
  if (error instanceof Error && error.message.includes("Acesso não autorizado")) {
    return admin
      ? "Não foi possível autorizar a reprodução. Entre novamente com uma conta administradora."
      : "Esta aula está disponível para alunos com pagamento confirmado. Confira o status da compra na sua área do aluno.";
  }
  return error instanceof Error ? error.message : "Não foi possível carregar o vídeo. Tente novamente.";
}

function hlsPlaybackError(type: string, detail: string, status?: number) {
  if (status === 401 || status === 403) {
    return "Não foi possível autorizar a reprodução deste vídeo. Atualize o streaming e tente novamente.";
  }
  if (status === 404) {
    return "Este vídeo não está disponível no momento. Confira se ele foi publicado corretamente e tente novamente.";
  }
  if (status && status >= 500) {
    return "O serviço de vídeo está temporariamente indisponível. Tente novamente em instantes.";
  }
  if (type === "networkError") {
    return "Não foi possível carregar o vídeo. Verifique sua conexão e tente novamente.";
  }
  if (type === "mediaError") {
    return "Não foi possível reproduzir este vídeo. Tente novamente mais tarde.";
  }
  if (detail.toLowerCase().includes("manifest")) {
    return "Não foi possível carregar este vídeo. Verifique sua conexão e tente novamente.";
  }
  return "Ocorreu um problema ao abrir o vídeo. Atualize o streaming e tente novamente.";
}

function nativePlaybackError(video: HTMLVideoElement) {
  switch (video.error?.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "A reprodução foi interrompida. Tente iniciar o vídeo novamente.";
    case MediaError.MEDIA_ERR_NETWORK:
      return "Não foi possível carregar o vídeo. Verifique sua conexão e tente novamente.";
    case MediaError.MEDIA_ERR_DECODE:
      return "Não foi possível reproduzir este vídeo. Tente novamente mais tarde.";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "Este vídeo não pode ser reproduzido neste navegador.";
    default:
      return "O vídeo não pôde ser reproduzido. Atualize o streaming e tente novamente.";
  }
}

export function VideasPlayer({ lessonId, token, admin = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<LessonPlayback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [playerError, setPlayerError] = useState("");

  const streamUrl = useMemo(
    () => playback?.hlsUrl ? resolveStreamUrl(playback.hlsUrl) : null,
    [playback?.hlsUrl],
  );

  useEffect(() => {
    console.info("[VideasPlayer] componente montado", { lessonId, admin });
    return () => console.info("[VideasPlayer] componente desmontado", { lessonId, admin });
  }, [admin, lessonId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setPlayerError("");
    setPlayback(null);

    const load = admin
      ? adminService.lessonPlayback(lessonId, token)
      : lessonService.playback(lessonId, token);

    load.then(info => {
      if (!active) {
        console.info("[VideasPlayer] playback response ignored after effect cleanup", { lessonId, attempt });
        return;
      }
      console.info("[VideasPlayer] playback response received", {
        lessonId,
        attempt,
        hasHlsUrl: Boolean(info.hlsUrl),
        type: info.type,
        blocked: Boolean(info.blocked),
      });
      if (info.blocked) {
        setError("Este vídeo está temporariamente indisponível. Tente novamente mais tarde.");
      } else if (info.type !== "video") {
        setError("Este conteúdo não está disponível como vídeo.");
      } else if (!info.hlsUrl) {
        setError("O Videas ainda não disponibilizou o streaming desta aula.");
      } else {
        setPlayback(info);
      }
    }).catch(reason => {
      if (active) setError(friendlyPlaybackError(reason, admin));
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      console.info("[VideasPlayer] playback request effect cleaned up", { lessonId, attempt });
    };
  }, [admin, attempt, lessonId, token]);

  useEffect(() => {
    const video = videoRef.current;
    console.info("[VideasPlayer] player initialization effect executed", {
      lessonId,
      hasVideoElement: Boolean(video),
      hasPlaybackUrl: Boolean(playback?.hlsUrl),
      hasValidatedStreamUrl: Boolean(streamUrl),
    });
    if (!video || loading || !streamUrl) {
      console.info("[VideasPlayer] player initialization skipped", {
        lessonId,
        reason: !video ? "video element missing" : loading ? "playback request still loading" : "validated stream URL missing",
      });
      return;
    }
    let active = true;
    let usingNativeHls = false;
    let hls: import("hls.js").default | null = null;
    const nativeHlsSupport = video.canPlayType("application/vnd.apple.mpegurl");
    console.info("[VideasPlayer] native HLS support", { lessonId, result: nativeHlsSupport || "unsupported" });
    const onNativeError = () => {
      // With hls.js, its error event has better status/detail information.
      if (usingNativeHls) {
        console.info("[VideasPlayer] native video error", { lessonId, mediaErrorCode: video.error?.code ?? null });
        setPlayerError(nativePlaybackError(video));
      }
    };
    video.addEventListener("error", onNativeError);

    const fallbackToNativeHls = () => {
      // `maybe` is not reliable enough in Opera; reserve native playback for
      // browsers that explicitly report probable HLS support.
      if (nativeHlsSupport !== "probably") return false;
      usingNativeHls = true;
      console.info("[VideasPlayer] selecting native HLS fallback", { lessonId });
      video.src = streamUrl;
      video.load();
      return true;
    };

    void import("hls.js").then(({ default: Hls }) => {
      if (!active) {
        console.info("[VideasPlayer] HLS.js import completed after effect cleanup", { lessonId });
        return;
      }
      const hlsSupported = Hls.isSupported();
      console.info("[VideasPlayer] Hls.isSupported()", { lessonId, result: hlsSupported });
      if (hlsSupported) {
        console.info("[VideasPlayer] constructing Hls instance", { lessonId });
        hls = new Hls();
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          if (active) console.info("[VideasPlayer] MEDIA_ATTACHED", { lessonId });
        });
        hls.on(Hls.Events.MANIFEST_LOADING, () => {
          if (active) console.info("[VideasPlayer] MANIFEST_LOADING", { lessonId });
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (active) console.info("[VideasPlayer] MANIFEST_PARSED", { lessonId });
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!active) return;
          // Never expose data.url, response.url/text, or error.message: these can
          // contain the temporary signed playback URL or its token.
          console.warn("[VideasPlayer] ERROR", {
            lessonId,
            fatal: data.fatal,
            type: data.type,
            details: data.details,
            httpStatus: data.response?.code ?? null,
          });
          if (data.fatal) setPlayerError(hlsPlaybackError(data.type, data.details, data.response?.code));
        });
        console.info("[VideasPlayer] calling attachMedia()", { lessonId });
        hls.attachMedia(video);
        console.info("[VideasPlayer] calling loadSource()", { lessonId, hasPlaybackUrl: true });
        hls.loadSource(streamUrl);
        return;
      }

      if (!fallbackToNativeHls()) {
        setPlayerError("Este navegador não oferece suporte a HLS.js nem suporte nativo confiável a HLS.");
      }
    }).catch(() => {
      if (!active) return;
      if (!fallbackToNativeHls()) setPlayerError("Não foi possível iniciar o player HLS neste navegador.");
    });

    return () => {
      active = false;
      console.info("[VideasPlayer] player initialization effect cleaned up", { lessonId, hadHlsInstance: Boolean(hls) });
      video.removeEventListener("error", onNativeError);
      video.pause();
      video.removeAttribute("src");
      video.load();
      hls?.destroy();
    };
  }, [lessonId, loading, playback?.hlsUrl, streamUrl]);

  function retry() {
    setPlayerError("");
    setAttempt(value => value + 1);
  }

  return <div className="videas-player" aria-live="polite">
    {loading ? <div className="videas-player-state"><span className="loader" /><p>CARREGANDO VÍDEO</p></div>
      : error ? <div className="videas-player-state"><p role="alert">{error}</p><button className="profile-edit-button" type="button" onClick={retry}>TENTAR NOVAMENTE</button></div>
        : !streamUrl ? <div className="videas-player-state"><p role="alert">Não foi possível validar o endereço seguro do vídeo. Tente novamente para solicitar um novo link de reprodução.</p><button className="profile-edit-button" type="button" onClick={retry}>TENTAR NOVAMENTE</button></div>
          : <>
            <video ref={videoRef} controls playsInline preload="metadata" aria-label="Reprodutor da aula" />
            {playerError && <div className="videas-player-error" role="alert"><p>{playerError}</p><button className="profile-edit-button" type="button" onClick={retry}>ATUALIZAR STREAMING</button></div>}
          </>}
  </div>;
}
