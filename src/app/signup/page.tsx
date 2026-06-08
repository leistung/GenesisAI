import { Suspense } from "react";
import SignInContent from "../signin/SignInContent";

export const metadata = {
  title: "Sign Up - GenesisAI",
  description: "Create your GenesisAI account",
};

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    }>
      <SignInContent mode="register" />
    </Suspense>
  );
}
