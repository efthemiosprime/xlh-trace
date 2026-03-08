import './style.css';
import { App } from './components/App.js';
import { $ } from './utils/dom.js';

const app = $('#app');
app.appendChild(App());
