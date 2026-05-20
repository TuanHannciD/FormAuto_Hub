const API_BASE_URL = process.env.FORMAUTO_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const contentType = request.headers.get("content-type") ?? "application/json";

  const upstream = await fetch(`${API_BASE_URL}/api/payments/payos/webhook`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": contentType
    },
    body,
    cache: "no-store"
  });

  const responseBody = await upstream.text();
  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json"
    }
  });
}

export function GET() {
  return Response.json(
    {
      message: "PayOS webhook proxy is available. Configure PayOS to send POST requests to this URL."
    },
    { status: 405, headers: { Allow: "POST" } }
  );
}
