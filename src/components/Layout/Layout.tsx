import React from 'react';
import './Layout.css';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

const Layout: React.FC = () => {
  return (
    <div className="container">
      <LeftPanel />
      <RightPanel />
    </div>
  );
};

export default Layout;
