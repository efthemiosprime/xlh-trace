// Temporary dev preview to validate the design system + screen 0.0.
// Folds into the real single-page app at Phase 4 (EMBED-1); not a production entry.
import './styles/index.scss';
import { createStartScreen } from './screens/StartScreen.js';

const mount = document.getElementById('app');
createStartScreen(mount, {
  onStart: () => console.log('[preview] Start building → wizard step 1 (SELF)'),
});
