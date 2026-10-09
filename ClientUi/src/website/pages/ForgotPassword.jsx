import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { webApi } from '../services/api.js';
import { getErrorMessage } from '../../core/createApiClient.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null); // { message, devUrl }

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter the email you registered with');
    setError('');
    setSending(true);
    try {
      const { data } = await webApi.post('/auth/forgot-password', { email: email.trim() });
      setSent({ message: data.message, devUrl: data.dev_reset_url });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
    return undefined;
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we’ll send you a link to choose a new one."
      footer={<>Remembered it? <Link to="/login" className="font-semibold text-ocean-500 hover:underline">Back to sign in</Link></>}>
      {sent ? (
        <div role="status">
          <MailCheck size={40} className="text-moss" aria-hidden="true" />
          <p className="mt-3 font-semibold text-ocean">Check your inbox</p>
          <p className="mt-1 text-sm text-ink/70">{sent.message} The link expires in 30 minutes.</p>
          {sent.devUrl && (
            <div className="mt-5 rounded-xl bg-brass-100 p-4 text-sm">
              <p className="font-semibold text-brass-600">Development mode: no mail server is configured</p>
              <Link to={sent.devUrl.slice(sent.devUrl.indexOf('/reset-password'))} className="mt-1 inline-block font-semibold text-ocean underline">Open the reset link</Link>
            </div>
          )}
          <button className="btn-ghost mt-6" onClick={() => setSent(null)}>Use a different email</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div><label className="label" htmlFor="fp-email">Email</label><input id="fp-email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {error && <p className="rounded-lg bg-coral-100 px-4 py-2.5 text-sm font-medium text-coral" role="alert">{error}</p>}
          <button className="btn-primary w-full" disabled={sending}>{sending && <Spinner />} Send reset link</button>
        </form>
      )}
    </AuthShell>
  );
}
