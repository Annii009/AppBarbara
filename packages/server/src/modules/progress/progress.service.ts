import { findWorldNode, isNodeUnlocked, type ProgressResponse } from "@minibarbara/shared";
import type { Db } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { createProgressRepo } from "./progress.repo.ts";

export function createProgressService(db: Db) {
  const repo = createProgressRepo(db);

  return {
    getProgress(userId: string): ProgressResponse {
      return { completedNodeIds: repo.listCompletedNodeIds(userId) };
    },

    /**
     * Marca un nodo como completado, pero solo si existe de verdad y si lo
     * que requeria ya estaba completado. Sin esto, cualquiera podria
     * desbloquear el mapa entero llamando a la API directamente con
     * cualquier nodeId, sin haber jugado nada.
     */
    completeNode(userId: string, nodeId: string): ProgressResponse {
      const node = findWorldNode(nodeId);
      if (!node) {
        throw ApiError.badRequest("Ese nivel no existe.");
      }

      const completed = new Set(repo.listCompletedNodeIds(userId));
      if (!isNodeUnlocked(node, completed)) {
        throw ApiError.forbidden("Todavia no has desbloqueado ese nivel.");
      }

      repo.markComplete(userId, nodeId);
      completed.add(nodeId);
      return { completedNodeIds: [...completed] };
    },
  };
}
