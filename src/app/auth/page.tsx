'use client';
import { Suspense } from "react";
import SignInPage from "./signInPage";
import { useSearchParams } from "next/navigation";
import SignUpPage from "./signUpPage";

function AuthPageContent() {
    const searchParams = useSearchParams();
    const authType = searchParams.get("auth");

    return (
        <div className="min-h-screen flex items-center justify-center">
            {authType === "sign-up" ? <SignUpPage /> : <SignInPage />}
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" /> }>
            <AuthPageContent />
        </Suspense>
    );
}