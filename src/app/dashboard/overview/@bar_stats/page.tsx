import { delay } from '@/constants/mock-api';
import { RevenueBarGraph } from '@/features/overview/components/revenue-bar-graph';

export default async function BarStats() {
  await delay(1000);

  return <RevenueBarGraph />;
}
