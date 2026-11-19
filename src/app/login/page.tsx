import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Shell } from '@/components/shell';
import { LoginForm } from '@/components/login-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Masuk' };
export default async function Login() {
  if (await getSession()) redirect('/');
  return <Shell><div className="login-wrap"><div className="login-card"><h1>Masuk Portal</h1><p>Masukkan akun PT. Prima Fara Textile</p><LoginForm /><div className="login-note">Satu tempat untuk seluruh dashboard perusahaan.</div></div></div></Shell>;
}
