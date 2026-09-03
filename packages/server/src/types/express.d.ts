import "express-serve-static-core";

// Extiende Request con el userId que deja el middleware requireAuth, para no
// tener que castear `req` en cada ruta protegida.
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}
