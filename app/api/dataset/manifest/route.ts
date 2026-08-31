import { PUBLIC_DATASET_MANIFEST } from "@/lib/public-dataset";

export const dynamic = "force-static";

export function GET() {
  return Response.json(PUBLIC_DATASET_MANIFEST, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Dataset-Version": PUBLIC_DATASET_MANIFEST.version,
    },
  });
}
