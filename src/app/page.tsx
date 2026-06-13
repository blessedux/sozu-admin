import { Suspense } from "react";
import LoginPage from "./login-form";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
