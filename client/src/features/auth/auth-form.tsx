import type { LoginRequest, User } from "@location-manager/shared";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import type { UseMutationResult } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useState } from "react";
import { z } from "zod";
import { Button } from "../../components/button";
import { TextField } from "../../components/text-field";

type Credentials = LoginRequest;

type FieldErrors = Partial<Record<keyof Credentials, string>>;

interface AuthFormProps {
  title: string;
  intro: string;
  submitLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  /** Shared request schema; its errors are shown inline before anything is sent. */
  schema: z.ZodType<Credentials>;
  mutation: UseMutationResult<User, Error, Credentials>;
  onSuccess: () => void;
  footer: ReactNode;
}

/** An 18px line kept under a field, so an error appearing doesn't move the form. */
function FieldError({ id, message }: { id: string; message: string | undefined }) {
  return (
    <p id={id} className="min-h-[18px] text-meta text-accent">
      {message}
    </p>
  );
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      onClick={onToggle}
      className="flex size-(--tap) items-center justify-center rounded-md text-ink-2 transition-colors duration-[120ms] hover:text-ink"
    >
      {shown ? <EyeSlashIcon size={18} aria-hidden /> : <EyeIcon size={18} aria-hidden />}
    </button>
  );
}

/** Email + password form used by the login and register pages. */
export function AuthForm(props: AuthFormProps) {
  const { mutation } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = props.schema.safeParse({ email, password });

    if (!result.success) {
      const { fieldErrors: issues } = z.flattenError(result.error);
      setFieldErrors({ email: issues.email?.[0], password: issues.password?.[0] });

      return;
    }

    setFieldErrors({});
    mutation.mutate(result.data, { onSuccess: props.onSuccess });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
      <h1 className="text-title text-ink">{props.title}</h1>
      <p className="mt-1 mb-6 text-ink-2">{props.intro}</p>

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setFieldErrors((errors) => ({ ...errors, email: undefined }));
        }}
        invalid={fieldErrors.email !== undefined}
        aria-describedby="email-error"
      />
      <FieldError id="email-error" message={fieldErrors.email} />

      <TextField
        label="Password"
        type={passwordShown ? "text" : "password"}
        autoComplete={props.passwordAutoComplete}
        className="mt-2"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setFieldErrors((errors) => ({ ...errors, password: undefined }));
        }}
        invalid={fieldErrors.password !== undefined}
        aria-describedby="password-error"
        trailing={<PasswordToggle shown={passwordShown} onToggle={() => setPasswordShown((shown) => !shown)} />}
      />
      <FieldError id="password-error" message={fieldErrors.password} />

      <p role="alert" className="mt-2 min-h-[22px] text-accent">
        {mutation.error?.message}
      </p>

      <Button type="submit" variant="primary" loading={mutation.isPending} className="mt-2 w-full">
        {props.submitLabel}
      </Button>

      <p className="mt-5 text-ink-2">{props.footer}</p>
    </form>
  );
}
