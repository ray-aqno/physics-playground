import { render } from 'preact';

function App() {
  return <main><h1>Physics Playground</h1><p>Skills Lab and Unit C coming soon.</p></main>;
}

const root = document.getElementById('app');
if (root === null) {
  throw new Error('missing #app root element');
}
render(<App />, root);
