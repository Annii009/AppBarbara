import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MESSAGE_MAX_LENGTH, type ChatResponse } from "@minibarbara/shared";
import { GlamCard } from "../../components/GlamCard.tsx";
import { Button } from "../../components/Button.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import { AvatarRenderer } from "../avatar/AvatarRenderer.tsx";
import { chatApi } from "./chat-api.ts";
import "./ChatPage.css";

/**
 * Chat entre amigas, con sondeo (polling) cada pocos segundos en vez de
 * WebSockets: para una charla entre amigas, la diferencia con "tiempo real
 * de verdad" es imperceptible, y evita anadir un servidor de websockets
 * (conexiones persistentes, reconexion, mas superficie de fallo) para una
 * primera version. Si mas adelante hace falta latencia menor, es un cambio
 * localizado aqui y en chat.routes.ts, no un rediseño.
 */
const POLL_INTERVAL_MS = 4000;

export function ChatPage(): React.JSX.Element {
  const { profile } = useAuth();
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<ChatResponse | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!friendId) return;

    let cancelled = false;
    function load(): void {
      chatApi
        .getConversation(friendId as string)
        .then((res) => {
          if (!cancelled) setConversation(res);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "No se ha podido cargar el chat.");
          }
        });
    }

    load();
    const id = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [friendId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [conversation?.messages.length]);

  async function handleSend(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!friendId || draft.trim().length === 0) return;

    setSending(true);
    setError(null);
    try {
      const res = await chatApi.sendMessage(friendId, draft);
      setConversation(res);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  if (!conversation) {
    return <GlamCard eyebrow="Chat" title="Cargando…" />;
  }

  return (
    <GlamCard eyebrow="Chat" title={conversation.friend.nick} maxWidth="26rem">
      <div className="chat-friend-header">
        <AvatarRenderer avatar={conversation.friend.avatar} size={56} />
      </div>

      <div className="chat-messages" ref={listRef}>
        {conversation.messages.length === 0 && (
          <p className="chat-empty">Todavia no hay mensajes. ¡Saluda a {conversation.friend.nick}!</p>
        )}
        {conversation.messages.map((message) => (
          <div key={message.id} className="chat-bubble" data-mine={message.senderId === profile?.user.id}>
            {message.body}
          </div>
        ))}
      </div>

      {error && (
        <p className="chat-error" role="alert">
          {error}
        </p>
      )}

      <form className="chat-form" onSubmit={(event) => void handleSend(event)}>
        <input
          className="chat-input"
          value={draft}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Escribe un mensaje…"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" isLoading={isSending}>
          Enviar
        </Button>
      </form>

      <Button variant="ghost" onClick={() => navigate("/friends")}>
        Volver a amigas
      </Button>
    </GlamCard>
  );
}
