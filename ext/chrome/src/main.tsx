import { createRoot } from 'react-dom/client';
import SidePanelApp from './components/SidePanelApp';
import './assets/index.css';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<SidePanelApp />);