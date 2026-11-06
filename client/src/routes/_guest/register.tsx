import { registerRequestSchema } from "@location-manager/shared";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
      intro="Your places stay private to you. Passwords need at least 8 characters."
      submitLabel="Register"
      passwordAutoComplete="new-password"
      schema={registerRequestSchema}
      mutation={register}
      onSuccess={() => navigate({ to: "/map" })}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent-ink underline underline-offset-2">
            Log in
          </Link>
        </>
      }
    />
  );
}
