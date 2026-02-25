import type { Metadata } from "next";
import { fetchEvent } from "@/lib/api";
import { DisplayClient } from "./DisplayClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);

  const title = event?.title
    ? `${event.title} - 展示畫面`
    : "活動照片牆 - 展示畫面";
  const description = event
    ? `「${event.title}」即時照片牆展示畫面`
    : "即時照片牆展示畫面";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function DisplayPage({ params }: PageProps) {
  const { id } = await params;

  return <DisplayClient activityId={id} />;
}
