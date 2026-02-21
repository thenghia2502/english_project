import page from "@/app/lesson/update/[id]/page";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = searchParams.get("limit") || "10"
    const page = searchParams.get("page") || "1"
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const res = await fetch(`http://localhost:4000/lesson?search=${search}&limit=${limit}&page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const body = await res.text()

    return new Response(body, {
      status: res.status, // 🔥 giữ nguyên 401
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (err) {
    // 🔥 CHỈ BẮT LỖI FETCH THẬT
    return new Response(
      JSON.stringify({ message: 'Proxy network error' }),
      { status: 500 }
    )
  }
}