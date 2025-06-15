import { useAuth } from '@/hooks/useAuth';

interface TrackActionParams {
  mode: 'shop' | 'food';
  itemId: string;
  storeId: string;
  action: 'view' | 'search' | 'order';
}

export const useTracking = () => {
  const { user } = useAuth();

  const trackAction = async ({
    mode,
    itemId,
    storeId,
    action,
  }: TrackActionParams) => {
    if (!user) return;

    try {
      await fetch('/api/recommendations/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          itemId,
          storeId,
          action,
        }),
      });
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  };

  return { trackAction };
};

// Higher Order Component to track views
export const withViewTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  trackingProps: Omit<TrackActionParams, 'action'>
) => {
  const WithViewTracking = (props: P) => {
    const { trackAction } = useTracking();

    useEffect(() => {
      trackAction({
        ...trackingProps,
        action: 'view',
      });
    }, [trackAction]);

    return <WrappedComponent {...props} />;
  };

  return WithViewTracking;
};
