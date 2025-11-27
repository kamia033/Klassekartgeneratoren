import React, { useState } from 'react';
import './Layout.css';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import StorageErrorModal from '../UI/StorageErrorModal';

const Layout: React.FC = () => {
  const [storageError, setStorageError] = useState(() => {
    try {
      const data = localStorage.getItem('classes');
      if (data) {
        JSON.parse(data);
      }
      return false;
    } catch (e) {
      return true;
    }
  });

  const handleClearData = () => {
    localStorage.removeItem('classes');
    window.location.reload();
  };

  if (storageError) {
    return <StorageErrorModal onClear={handleClearData} />;
  }

  return (
    <div className="container">
      <LeftPanel />
      <RightPanel onTriggerError={() => setStorageError(true)} />
    </div>
  );
};

export default Layout;
