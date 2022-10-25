import React, { useEffect, useState } from 'react';
import './App.global.css';

// Apps
import Idle from './apps/idle/app';
import Setup from './apps/setup/app';

export default function App() {
  const [app, setApp] = useState(null);

  useEffect(() => {
    setApp(window.api.getApp())
  }, [])

  if (!app) {
    return <div>loading</div>
  }

  switch(app) {
    case 'idle':
      return <Idle />
    case 'setup':
      return <Setup />
    default:
      return <div>Unknown app</div>
  }

}
