import { pageUser } from '@/lib/auth';
import { listReports } from '@/lib/reports';
import { Shell } from '@/components/shell';
import { Settings } from '@/components/settings';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pengaturan' };
export default async function Setting() { const user = await pageUser(true); const reports = await listReports(); return <Shell user={user} settings><Settings reports={reports} /></Shell>; }
