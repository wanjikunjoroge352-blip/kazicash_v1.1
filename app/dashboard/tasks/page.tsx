import Offerwall from '@/components/Offerwall';

export default function TasksPage() {
  const currentUserId = 'user_12345'; // Hooked up to active Supabase session
  const cpaleadUrl = process.env.NEXT_PUBLIC_CPALEAD_OFFERWALL_URL;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <Offerwall userId={currentUserId} cpaleadWallUrl={cpaleadUrl} />
    </main>
  );
}
