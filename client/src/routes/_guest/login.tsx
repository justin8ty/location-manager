import { Link } from "@cloudflare/kumo";
import { loginRequestSchema } from "@location-manager/shared";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AuthForm } from "../../features/auth/auth-form";
import { postLoginPath, useLogin } from "../../features/auth/session";

const loginSearchSchema = z.object({
  /** The protected page the visitor was sent away from. */
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_guest/login")({
  validateSearch: loginSearchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const login = useLogin();

  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      passwordAutoComplete="current-password"
      schema={loginRequestSchema}
      mutation={login}
      onSuccess={() => navigate({ href: postLoginPath(redirect) })}
      footer={
        <>
          No account yet? <Link href="/register">Register</Link>
        </>
      }
    />
  );
}
