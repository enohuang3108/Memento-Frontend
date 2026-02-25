/**
 * API utilities for server and client-side data fetching
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export interface EventData {
  id: string;
  title: string;
  driveFolderId: string;
  status: "active" | "ended";
  participantCount: number;
  photoCount: number;
}

export interface EventResponse {
  event: EventData;
}

/**
 * Fetch event data from API (works on both server and client)
 */
export async function fetchEvent(
  activityId: string,
): Promise<EventData | null> {
  try {
    const res = await fetch(`${API_URL}/events/${activityId}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds on server
    });

    if (!res.ok) {
      return null;
    }

    const data: EventResponse = await res.json();
    return data.event;
  } catch {
    return null;
  }
}
