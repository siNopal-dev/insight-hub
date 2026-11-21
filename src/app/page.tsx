import { pageUser } from '@/lib/auth';
import { listReports } from '@/lib/reports';
import { allowedEmbedHosts } from '@/lib/validation';
import { Shell } from '@/components/shell';
import { Portal } from '@/components/portal';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const user = await pageUser();
  const reports = await listReports();
  return (
    <Shell user={user}>
      <Portal reports={reports} embedHosts={allowedEmbedHosts()} />
    </Shell>
  );
}
