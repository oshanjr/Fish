"use server";

import { signIn as nextAuthSignIn } from "@/auth";
import { loginSchema } from "@/lib/validations";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Server-side validation
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      return result.error.issues[0].message;
    }

    await nextAuthSignIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password.";
        default:
          return "Something went wrong. Please try again.";
      }
    }
    throw error;
  }
}
