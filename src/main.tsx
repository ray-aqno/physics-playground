import { render } from 'preact';
import './styles.css';
import { App } from './ui/App';

const root = document.getElementById('app');
if (root === null) {
  throw new Error('missing #app root element');
}
render(<App />, root);
