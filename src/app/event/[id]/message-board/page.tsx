"use client";

/**
 * Message Board Page
 * Standalone page for creating polaroid-style message board photos
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { GeometricBackground } from "@/components/decorations";
import {
  PhotoSourcePicker,
  PolaroidEditor,
  CompletionView,
  IllustrationPicker,
} from "@/components/MessageBoard";
import type { Illustration } from "@/lib/illustrations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type Step = "select-photo" | "edit" | "complete";

interface EventData {
  id: string;
  title: string;
  status: "active" | "ended";
}

export default function MessageBoardPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const [sessionId] = useState(() => generateSessionId());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);

  // Step state
  const [step, setStep] = useState<Step>("select-photo");

  // Photo state
  const [photo, setPhoto] = useState<File | null>(null);

  // Form state
  const [message, setMessage] = useState("");
  const [relation, setRelation] = useState("");
  const [locationTime, setLocationTime] = useState("");

  // Illustrations state (lifted from PolaroidEditor)
  const [illustrations, setIllustrations] = useState<Illustration[]>([]);

  // Composed result
  const [composedBlob, setComposedBlob] = useState<Blob | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  // Illustration picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingIllustration, setPendingIllustration] = useState<{
    src: string;
    color: string;
  } | null>(null);

  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`${API_URL}/events/${activityId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("找不到此活動");
          } else {
            setError("載入活動失敗");
          }
          return;
        }
        const data = await res.json();
        setEvent(data.event);

        // Redirect if event is not active
        if (data.event.status !== "active") {
          router.replace(`/event/${activityId}`);
        }
      } catch {
        setError("網路錯誤");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [activityId, router]);

  const handleBack = useCallback(() => {
    if (step === "select-photo") {
      router.push(`/event/${activityId}`);
    } else if (step === "edit") {
      setPhoto(null);
      setIllustrations([]);
      setMessage("");
      setRelation("");
      setLocationTime("");
      setStep("select-photo");
    } else if (step === "complete") {
      setComposedBlob(null);
      setStep("edit");
    }
  }, [step, activityId, router]);

  const handlePhotoSelect = useCallback((file: File) => {
    setPhoto(file);
    setStep("edit");
    setError(null);
  }, []);

  const handlePhotoError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleComplete = useCallback(async (blob: Blob) => {
    setIsComposing(true);
    setError(null);

    try {
      setComposedBlob(blob);
      setStep("complete");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "合成照片失敗";
      setError(errorMessage);
    } finally {
      setIsComposing(false);
    }
  }, []);

  const handleBackToEdit = useCallback(() => {
    setComposedBlob(null);
    setStep("edit");
  }, []);

  const handleUploadSuccess = useCallback(() => {
    // Navigate back to event page after successful upload
    router.push(`/event/${activityId}`);
  }, [activityId, router]);

  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleClose = useCallback(() => {
    router.push(`/event/${activityId}`);
  }, [activityId, router]);

  const handleAddIllustration = useCallback((src: string, color: string) => {
    setPendingIllustration({ src, color });
    setIsPickerOpen(false);
  }, []);

  const handleIllustrationAdded = useCallback(() => {
    setPendingIllustration(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <GeometricBackground variant="minimal" />
        <div className="text-center relative z-10">
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <p className="text-text-muted font-heading font-bold">載入中...</p>
        </div>
      </div>
    );
  }

  // Error state (event not found)
  if (error && !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <Logo />
        <GeometricBackground variant="minimal" />
        <div className="text-center relative z-10 max-w-md mx-auto px-4">
          <div className="card-sticker p-8">
            <div className="text-6xl mb-4">😢</div>
            <h1 className="text-2xl font-heading font-bold text-text-main mb-2">
              找不到活動
            </h1>
            <p className="text-text-muted mb-6">{error}</p>
            <a href="/" className="btn-candy inline-block">
              返回首頁
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <GeometricBackground variant="minimal" />

      <div className="max-w-lg mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-pop-in">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-foreground hover:bg-muted transition-colors"
            style={{ boxShadow: "3px 3px 0px 0px #1e293b" }}
            disabled={isComposing}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-heading font-bold text-text-main">
              製作留言板
            </h1>
            {event && <p className="text-sm text-text-muted">{event.title}</p>}
          </div>
        </div>

        {/* Main Content */}
        <div>
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-400 rounded-xl">
              <p className="text-sm text-red-600 font-bold">{error}</p>
            </div>
          )}

          {/* Step: Select Photo */}
          {step === "select-photo" && (
            <PhotoSourcePicker
              onSelect={handlePhotoSelect}
              onError={handlePhotoError}
            />
          )}

          {/* Step: Edit */}
          {step === "edit" && photo && (
            <PolaroidEditor
              photo={photo}
              message={message}
              relation={relation}
              locationTime={locationTime}
              illustrations={illustrations}
              onMessageChange={setMessage}
              onRelationChange={setRelation}
              onLocationTimeChange={setLocationTime}
              onIllustrationsChange={setIllustrations}
              onComplete={handleComplete}
              isComposing={isComposing}
              onOpenPicker={() => setIsPickerOpen(true)}
              pendingIllustration={pendingIllustration}
              onIllustrationAdded={handleIllustrationAdded}
            />
          )}

          {/* Step: Complete */}
          {step === "complete" && composedBlob && (
            <CompletionView
              composedBlob={composedBlob}
              activityId={activityId}
              sessionId={sessionId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              onBackToEdit={handleBackToEdit}
              onClose={handleClose}
            />
          )}
        </div>
      </div>

      {/* Illustration Picker - rendered at page level */}
      <IllustrationPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAdd={handleAddIllustration}
      />
    </div>
  );
}
