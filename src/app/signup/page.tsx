import { Suspense } from "react";
import SignInContent from "../signin/SignInContent";

export const metadata = {
  title: "Sign Up - GenesisAI",
  description: "Create your GenesisAI account",
};

export default function SignUpPage() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleEnabled =
    !!googleClientId &&
    !!googleClientSecret &&
    googleClientId !== "dummy" &&
    googleClientSecret !== "dummy";

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    }>
      <SignInContent mode="register" googleEnabled={googleEnabled} />
    </Suspense>
  );
}
