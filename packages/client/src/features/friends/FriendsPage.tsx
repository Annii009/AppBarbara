import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Friend } from "@minibarbara/shared";
import { GlamCard } from "../../components/GlamCard.tsx";
import { Button } from "../../components/Button.tsx";
import { TextField } from "../../components/TextField.tsx";
import { ApiRequestError } from "../../lib/api.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { AvatarRenderer } from "../avatar/AvatarRenderer.tsx";
import { friendsApi } from "./friends-api.ts";
import "./FriendsPage.css";

export function FriendsPage(): React.JSX.Element {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    friendsApi
      .list()
      .then((res) => setFriends(res.friends))
      .catch(() => setFriends([]));
  }, []);

  async function handleAdd(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await friendsApi.addByCode(code);
      setFriends(res.friends);
      setCode("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "No se ha podido agregar a esa amiga.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlamCard eyebrow="Amigas" title="Tus amigas" maxWidth="28rem">
      {profile && (
        <p className="friends-my-code">
          Tu codigo: <strong>{profile.user.friendCode}</strong> — compartelo para que te agreguen.
        </p>
      )}

      <form className="friends-add-form" onSubmit={(event) => void handleAdd(event)}>
        <TextField
          label="Agregar por codigo"
          placeholder="BRB-XXXX"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Agregar amiga
        </Button>
      </form>

      <ul className="friends-list">
        {friends === null && <li className="friends-empty">Cargando…</li>}
        {friends !== null && friends.length === 0 && (
          <li className="friends-empty">Todavia no tienes amigas. ¡Comparte tu codigo!</li>
        )}
        {friends?.map((friend) => (
          <li key={friend.id} className="friends-row">
            <AvatarRenderer avatar={friend.avatar} size={40} />
            <span className="friends-row-nick">{friend.nick}</span>
            <Button variant="ghost" onClick={() => navigate(`/chat/${friend.id}`)}>
              Chatear
            </Button>
          </li>
        ))}
      </ul>

      <Button variant="ghost" onClick={() => navigate("/")}>
        Volver al mapa
      </Button>
    </GlamCard>
  );
}
