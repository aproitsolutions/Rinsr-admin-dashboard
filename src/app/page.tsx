import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const token = (await cookies()).get('rinsr_token')?.value;
  if (!token) {
    return redirect('/auth/login');
  }
  return redirect('/dashboard/overview');
}
