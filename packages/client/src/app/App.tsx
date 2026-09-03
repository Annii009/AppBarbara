import { AuthProvider } from "../features/auth/AuthContext.tsx";
import { AppRouter } from "./router.tsx";

export function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
