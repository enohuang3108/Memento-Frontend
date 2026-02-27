import { fetchEvent } from "@/lib/api";
import type { Metadata } from "next";
import { DisplayClient } from "./DisplayClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);

  const title = event?.title
    ? `${event.title}`
    : "活動照片牆";
  const description = event
    ? `「${event.title}」即時投影`
    : "即時投影";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function DisplayPage({ params }: PageProps) {
  const { id } = await params;

  return <DisplayClient activityId={id} />;
}
