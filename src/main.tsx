import {useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function FirstPaintReady() {
  useLayoutEffect(() => {
    document.documentElement.classList.remove('js-loading');
    document.getElementById('app-loading')?.remove();
  }, []);
  return <App />;
}

createRoot(document.getElementById('root')!).render(<FirstPaintReady />);
