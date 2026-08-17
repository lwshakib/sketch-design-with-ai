import { auth } from "@/lib/auth";
import { getSignedDownloadUrl } from "@/lib/s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { paths } = await req.json();

    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: "Paths list is required" },
        { status: 400 },
      );
    }

    const resolved = await Promise.all(
      paths.map(async (path: string) => {
        try {
          if (path.startsWith("http")) return path; // Skip if it's already a URL
          return await getSignedDownloadUrl(path);
        } catch (error) {
          console.error(`[API] Resolve Error for path: ${path}`, error);
          return null;
        }
      }),
    );

    return NextResponse.json({
      urls: resolved.filter((url) => url !== null) as string[],
    });
  } catch (error: any) {
    console.error("[API] Storage Resolve Paths Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
