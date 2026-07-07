import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignIn() {
  return (
    <main className="app-container grid min-h-[calc(100vh-5rem)] place-items-center py-6">
      <section className="surface w-full max-w-md rounded-[1.5rem] p-5 sm:p-7">
        <Suspense>
          <SignInForm />
        </Suspense>
      </section>
    </main>
  );
}
