import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/hooks/useNotification';

export function NotificationTest() {
  const { notify } = useNotification();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Test Notifications</h2>
      
      <div className="space-x-2">
        <Button 
          variant="outline"
          onClick={() => notify('Default Notification', 'This is a default notification')}
        >
          Default
        </Button>
        
        <Button 
          variant="outline"
          className="bg-green-100 text-green-800 hover:bg-green-200"
          onClick={() => notify('Success!', 'Your action was successful!', 'success')}
        >
          Success
        </Button>
        
        <Button 
          variant="outline"
          className="bg-red-100 text-red-800 hover:bg-red-200"
          onClick={() => notify('Error!', 'Something went wrong!', 'error')}
        >
          Error
        </Button>
        
        <Button 
          variant="outline"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          onClick={() => notify('Warning', 'This is a warning message', 'warning')}
        >
          Warning
        </Button>
        
        <Button 
          variant="outline"
          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          onClick={() => notify('Information', 'Here\'s some information', 'info')}
        >
          Info
        </Button>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          Note: In development mode, sounds are disabled to avoid annoyance. 
          They will work in production.
        </p>
      </div>
    </div>
  );
}

export default NotificationTest;
