import Link from 'next/link';
import type { User } from '@/lib/types';
import { AccountControls } from './account-controls';
export function Shell({ user, settings = false, children }: { user?: User; settings?: boolean; children: React.ReactNode }) {
  return <><header className="topbar"><div className="topbar-inner"><Link href="/" className="brand" prefetch={false}><span className="logo-box"><img src="/logo-pft.jpg" alt="Logo PFT" width="42" height="28" /></span><span><strong>Insight Hub</strong><small>PT. PRIMA FARA TEXTILE</small></span></Link>
    {user ? <AccountControls user={user} settings={settings} /> : <span className="login-badge">Portal Internal</span>}
    </div></header><main id="main" className="main">{children}</main><footer>© {new Date().getFullYear()} PT. Prima Fara Textile <span>— Internal Analytics Portal</span></footer></>;
}
