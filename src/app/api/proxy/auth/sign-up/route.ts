import { getBackendBaseUrl } from "@/lib/backend-url";
import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl = getBackendBaseUrl();
const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const res = await fetch(`${backendBaseUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Sign up failed" }));

            const details =
                typeof errorData?.details === "string"
                    ? errorData.details.toLowerCase()
                    : "";
            const message =
                typeof errorData?.message === "string"
                    ? errorData.message.toLowerCase()
                    : "";
            const isRateLimit = details.includes("rate limit") || message.includes("rate limit");

            if (isRateLimit) {
                const rawRetryAfter = res.headers.get("retry-after");
                const retryAfterSeconds = Number(rawRetryAfter ?? 60);
                return NextResponse.json(
                    {
                        error: "Too many sign up attempts. Please try again later.",
                        code: errorData?.code ?? "RATE_LIMIT",
                        details: errorData?.details ?? errorData?.message,
                        retryAfterSeconds,
                    },
                    {
                        status: 429,
                        headers: {
                            "Retry-After": String(retryAfterSeconds),
                        },
                    }
                );
            }

            return NextResponse.json(errorData, { status: res.status });
        }

        const data = await res.json();
        const hasSession = Boolean(data?.session?.access_token);

        const response = NextResponse.json({
            success: true,
            user: data?.user ?? null,
            requiresEmailConfirmation: !hasSession,
            message: !hasSession
                ? "Please check your email to confirm your account"
                : "Sign up successful",
        });

        if (hasSession) {
            response.cookies.set("access_token", data.session.access_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "strict",
                path: "/",
                maxAge: data.session.expires_in,
            });

            if (data?.session?.refresh_token) {
                response.cookies.set("refresh_token", data.session.refresh_token, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: "strict",
                    path: "/",
                });
            }

            if (data?.user?.id) {
                response.cookies.set("user_id", data.user.id, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: "strict",
                    path: "/",
                });
            }
        }

        return response;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}