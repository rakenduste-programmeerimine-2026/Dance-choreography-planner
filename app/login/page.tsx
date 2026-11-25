import { Suspense } from "react";
import { GoogleSignInButton } from "./google-sign-in-button";
import { SignInError } from "./sign-in-error";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Tantsukava</h1>
      <Suspense>
        <SignInError searchParams={searchParams} />
      </Suspense>
      <GoogleSignInButton />
    </main>
  );
}
