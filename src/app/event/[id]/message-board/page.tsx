import type { Metadata } from "next";
import { fetchEvent } from "@/lib/api";
import { MessageBoardClient } from "./MessageBoardClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);

  const title = event?.title
    ? `${event.title} - 照片小紙條`
    : "照片小紙條";
  const description = event
    ? `在「${event.title}」留下你的照片小紙條`
    : "留下你的照片小紙條";

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

export default async function MessageBoardPage({ params }: PageProps) {
  const { id } = await params;
  const event = await fetchEvent(id);

  return <MessageBoardClient activityId={id} initialEvent={event} />;
}
