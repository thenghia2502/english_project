'use client';
import SignInPage from "./signInPage";
import { useSearchParams } from "next/navigation";
import SignUpPage from "./signUpPage";

export default function Page() {
    const searchParams = useSearchParams();
    const authType = searchParams.get("auth");

    return (
        <div className="min-h-screen flex items-center justify-center">
            {authType === "sign-up" ? <SignUpPage /> : <SignInPage />}
        </div>
    );
}