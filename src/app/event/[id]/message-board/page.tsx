import { fetchEvent } from "@/lib/api";
import type { Metadata } from "next";
import { MessageBoardClient } from "./MessageBoardClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);

  const title = event?.title ? `${event.title} - 回憶便利貼` : "回憶便利貼";
  const description = event
    ? `在「${event.title}」留下你的回憶便利貼`
    : "留下你的回憶便利貼";

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

export default async function MessageBoardPage({ params }: PageProps) {
  const { id } = await params;
  const event = await fetchEvent(id);

  return <MessageBoardClient activityId={id} initialEvent={event} />;
}
