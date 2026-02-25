import type { Metadata } from "next";
import { fetchEvent } from "@/lib/api";
import { EventClient } from "./EventClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);

  const title = event?.title || "活動照片牆";
  const description = event
    ? `加入「${event.title}」，一起上傳照片和發送彈幕！`
    : "加入活動，一起上傳照片和發送彈幕！";

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

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await fetchEvent(id);

  return <EventClient activityId={id} initialEvent={event} />;
}
