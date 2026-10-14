import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Вхід" };

export default function LoginPage() {
  return (
    <div className="mx-auto mt-[15vh] max-w-sm md:-ml-0">
      <h1 className="mb-1 text-2xl font-semibold">Study Hub</h1>
      <p className="mb-6 text-sm text-muted">Введіть пароль, щоб продовжити.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
