import { randomBytes, randomUUID } from "node:crypto";
import {
  DEFAULT_AVATAR,
  FRIEND_CODE_PREFIX,
  NICK_MAX_LENGTH,
  NICK_MIN_LENGTH,
  NICK_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type Profile,
} from "@minibarbara/shared";
import type { Db } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { hashPassword, verifyPassword } from "../../lib/password.ts";
import { avatarRowToConfig } from "../avatar/avatar.mapper.ts";
import type { AvatarRow } from "../avatar/avatar.repo.ts";
import { createAuthRepo, type UserRow } from "./auth.repo.ts";

function validateNick(nick: string): void {
  if (nick.length < NICK_MIN_LENGTH || nick.length > NICK_MAX_LENGTH || !NICK_PATTERN.test(nick)) {
    throw ApiError.badRequest("El nick no es valido.", {
      nick: `Entre ${NICK_MIN_LENGTH} y ${NICK_MAX_LENGTH} caracteres: letras, numeros, "_" o "-", sin espacios.`,
    });
  }
}

function validatePassword(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw ApiError.badRequest("La contrasena no es valida.", {
      password: `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    });
  }
}

function rowsToProfile(user: UserRow, avatar: AvatarRow): Profile {
  return {
    user: {
      id: user.id,
      nick: user.nick,
      friendCode: user.friend_code,
      createdAt: user.created_at,
    },
    avatar: avatarRowToConfig(avatar),
  };
}

// Sin 0/O/1/I/L: se confunden facilmente al dictar o transcribir el codigo a mano.
const FRIEND_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomFriendCodeSuffix(): string {
  let out = "";
  for (const byte of randomBytes(4)) {
    out += FRIEND_CODE_ALPHABET[byte % FRIEND_CODE_ALPHABET.length];
  }
  return out;
}

export function createAuthService(db: Db) {
  const repo = createAuthRepo(db);

  function generateUniqueFriendCode(): string {
    const MAX_ATTEMPTS = 10;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const code = `${FRIEND_CODE_PREFIX}-${randomFriendCodeSuffix()}`;
      if (!repo.friendCodeExists(code)) return code;
    }
    // Con 32^4 combinaciones y comprobacion de unicidad, esto es
    // practicamente inalcanzable salvo que la base de datos este rota.
    throw new Error("No se ha podido generar un codigo de amiga unico");
  }

  return {
    async register(rawNick: string, password: string): Promise<Profile> {
      const nick = rawNick.trim();
      validateNick(nick);
      validatePassword(password);

      const nickLower = nick.toLowerCase();
      if (repo.findByNickLower(nickLower)) {
        throw ApiError.conflict("Ese nick ya esta en uso.", { nick: "Prueba con otro." });
      }

      const now = new Date().toISOString();
      const user: UserRow = {
        id: randomUUID(),
        nick,
        nick_lower: nickLower,
        password_hash: await hashPassword(password),
        friend_code: generateUniqueFriendCode(),
        created_at: now,
      };
      const avatar: AvatarRow = {
        user_id: user.id,
        skin_tone: DEFAULT_AVATAR.skinTone,
        hair_style: DEFAULT_AVATAR.hairStyle,
        hair_color: DEFAULT_AVATAR.hairColor,
        outfit: DEFAULT_AVATAR.outfit,
        accessory: DEFAULT_AVATAR.accessory,
        makeup: DEFAULT_AVATAR.makeup,
        background: DEFAULT_AVATAR.background,
        updated_at: now,
      };

      repo.insertUserWithAvatar(user, avatar);
      return rowsToProfile(user, avatar);
    },

    async login(rawNick: string, password: string): Promise<{ profile: Profile; userId: string }> {
      // Mismo mensaje exista o no el nick: no le decimos a quien ataca cual de
      // los dos campos ha fallado.
      const invalidCredentials = (): ApiError =>
        ApiError.badRequest("Nick o contrasena incorrectos.");

      const user = repo.findByNickLower(rawNick.trim().toLowerCase());
      if (!user) throw invalidCredentials();

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) throw invalidCredentials();

      const avatar = repo.getAvatar(user.id);
      if (!avatar) throw new Error(`Usuario ${user.id} sin avatar: dato inconsistente`);

      return { profile: rowsToProfile(user, avatar), userId: user.id };
    },

    getProfile(userId: string): Profile {
      const user = repo.findById(userId);
      if (!user) throw ApiError.unauthorized("Tu sesion ya no es valida.");

      const avatar = repo.getAvatar(userId);
      if (!avatar) throw new Error(`Usuario ${userId} sin avatar: dato inconsistente`);

      return rowsToProfile(user, avatar);
    },
  };
}
