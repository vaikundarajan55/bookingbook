import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
      <p className="font-display text-7xl font-bold text-brass">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-ocean">This page has checked out</h1>
      <p className="mt-2 text-ink/60">The link may be old or mistyped.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
