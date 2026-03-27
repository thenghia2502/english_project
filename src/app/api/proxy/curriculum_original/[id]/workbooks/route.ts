import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const idCurriculum = url.searchParams.get("idCurriculum");
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const res = await fetch(`http://localhost:4000/curriculum/${idCurriculum}/workbooks`, {
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