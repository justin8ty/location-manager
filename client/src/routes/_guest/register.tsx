import { Link } from "@cloudflare/kumo";
import { registerRequestSchema } from "@location-manager/shared";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthForm } from "../../features/auth/auth-form";
import { useRegister } from "../../features/auth/session";

export const Route = createFileRoute("/_guest/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();

  return (
    <AuthForm
      title="Create an account"
      submitLabel="Register"
      passwordAutoComplete="new-password"
      passwordDescription="At least 8 characters"
      schema={registerRequestSchema}
      mutation={register}
      onSuccess={() => navigate({ to: "/map" })}
      footer={
        <>
          Already have an account? <Link href="/login">Log in</Link>
        </>
      }
    />
  );
}
