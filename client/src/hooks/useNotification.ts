import { useToast } from "./use-toast";
import { useCallback } from "react";
import { playSound as playTone } from "@/lib/soundGenerator";

type ToastVariant = 'default' | 'destructive' | null | undefined;

const notificationToVariantMap: Record<string, ToastVariant> = {
  default: 'default',
  success: 'default',
  error: 'destructive',
  warning: 'destructive',
  info: 'default',
} as const;

export type NotificationType = keyof typeof notificationToVariantMap;

export function useNotification() {
  const { toast } = useToast();

  const notify = useCallback((
    title: string,
    description?: string,
    type: NotificationType = 'default',
    playSound = true
  ) => {
    // Ensure type is a valid SoundType
    const soundType = type as 'default' | 'success' | 'error' | 'warning' | 'info';
    if (playSound) {
      playTone(soundType);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${type.toUpperCase()}] ${title}`, description ? `\n${description}` : '');
    }

    toast({
      title,
      description,
      variant: notificationToVariantMap[type],
      duration: type === 'error' ? 5000 : 3000,
    });
  }, [toast]);

  return { notify };
}
