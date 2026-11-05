import { Banner, Button, Input, Text } from "@cloudflare/kumo";
import type { LoginRequest, User } from "@location-manager/shared";
import { WarningCircleIcon } from "@phosphor-icons/react";
import type { UseMutationResult } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useState } from "react";
import { z } from "zod";

type Credentials = LoginRequest;

type FieldErrors = Partial<Record<keyof Credentials, string>>;

interface AuthFormProps {
  title: string;
  submitLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  passwordDescription?: string;
  /** Shared request schema; its errors are shown inline before anything is sent. */
  schema: z.ZodType<Credentials>;
  mutation: UseMutationResult<User, Error, Credentials>;
  onSuccess: () => void;
  footer: ReactNode;
}

/** Email + password form used by the login and register pages. */
export function AuthForm(props: AuthFormProps) {
  const { mutation } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Text variant="heading2" as="h1">
        {props.title}
      </Text>

      {mutation.error && (
        <Banner
          variant="error"
          icon={<WarningCircleIcon weight="fill" />}
          description={mutation.error.message}
        />
      )}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onValueChange={(value) => {
          setEmail(value);
          setFieldErrors((errors) => ({ ...errors, email: undefined }));
        }}
        error={fieldErrors.email}
      />

      <Input
        label="Password"
        type="password"
        autoComplete={props.passwordAutoComplete}
        value={password}
        onValueChange={(value) => {
          setPassword(value);
          setFieldErrors((errors) => ({ ...errors, password: undefined }));
        }}
        description={props.passwordDescription}
        error={fieldErrors.password}
      />

      <Button type="submit" variant="primary" loading={mutation.isPending} className="w-full justify-center">
        {props.submitLabel}
      </Button>

      <Text variant="secondary">{props.footer}</Text>
    </form>
  );
}
