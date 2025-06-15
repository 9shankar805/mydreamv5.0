import { useState, useEffect, useMemo } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface MobileNotificationBarProps {
  className?: string;
}

export default function MobileNotificationBar({ className = '' }: MobileNotificationBarProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(0);

  // Get unread notifications
  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.isRead), 
    [notifications]
  );

  // Reset current notification when unread notifications change
  useEffect(() => {
    if (unreadNotifications.length > 0) {
      setCurrentNotification(0);
      setIsExpanded(false);
    }
  }, [unreadNotifications.length]);

  // Auto-rotate through notifications
  useEffect(() => {
    if (unreadNotifications.length > 1 && !isExpanded) {
      const interval = setInterval(() => {
        setCurrentNotification(prev => 
          prev + 1 >= unreadNotifications.length ? 0 : prev + 1
        );
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [unreadNotifications.length, isExpanded]);

  const handleNotificationClick = () => {
    if (unreadNotifications.length === 1) {
      markAsRead(unreadNotifications[0].id);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleMarkAsRead = (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    markAsRead(notificationId);
  };

  const handleDismissAll = (event: React.MouseEvent) => {
    event.stopPropagation();
    markAllAsRead();
    setIsExpanded(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return '🛍️';
      case 'delivery': return '🚚';
      case 'payment': return '💳';
      case 'product': return '📦';
      case 'store': return '🏪';
      case 'system': return '⚙️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-500';
      case 'delivery': return 'bg-green-500';
      case 'payment': return 'bg-purple-500';
      case 'product': return 'bg-orange-500';
      case 'store': return 'bg-indigo-500';
      case 'error': return 'bg-red-500';
      case 'success': return 'bg-emerald-500';
      default: return 'bg-gray-600';
    }
  };

  // Don't render if no unread notifications
  if (unreadNotifications.length === 0) {
    return null;
  }

  const activeNotification = unreadNotifications[currentNotification];

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      {/* Main notification bar */}
      <div 
        className={`${getNotificationColor(activeNotification?.type)} text-white shadow-lg cursor-pointer transition-all duration-300 ${
          isExpanded ? 'rounded-b-none' : 'rounded-b-lg'
        }`}
        onClick={handleNotificationClick}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <span className="text-lg" role="img" aria-label="notification">
                {getNotificationIcon(activeNotification?.type)}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-sm truncate">
                  {activeNotification?.title}
                </h4>
                {unreadNotifications.length > 1 && (
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-white/90 truncate mt-0.5">
                {activeNotification?.message}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {unreadNotifications.length > 1 && (
              <div className="flex space-x-1">
                {unreadNotifications.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                      index === currentNotification ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {unreadNotifications.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
              onClick={handleDismissAll}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded notification list */}
      {isExpanded && (
        <div className="bg-white border-x border-b border-gray-200 shadow-lg max-h-80 overflow-y-auto">
          {unreadNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === currentNotification ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-lg mt-0.5" role="img" aria-label="notification">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 ml-2"
                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {unreadNotifications.length > 3 && (
            <div className="px-4 py-2 bg-gray-50 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={handleDismissAll}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}