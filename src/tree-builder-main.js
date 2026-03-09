import './style.css';
import { TreeBuilderApp } from './components/tree-builder/TreeBuilderApp.js';
import { $ } from './utils/dom.js';

const app = $('#app');
app.appendChild(TreeBuilderApp());
