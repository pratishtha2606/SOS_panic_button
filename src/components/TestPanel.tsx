import React, { useState } from 'react';
import { Plus, AlertTriangle, Settings } from 'lucide-react';
import { firebaseService } from '../services/firebase';

export function TestPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTestAlert = async () => {
    setIsLoading(true);
    try {
      await firebaseService.addTestAlert();
    } catch (error) {
      console.error('Failed to add test alert:', error);
      alert('Failed to add test alert. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
        title="Developer Tools"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl border border-gray-700 z-40">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Developer Tools
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-sm"
        >
          Hide
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={handleAddTestAlert}
          disabled={isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Test Alert
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-400">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Use only for testing purposes
        </p>
      </div>
    </div>
  );
}