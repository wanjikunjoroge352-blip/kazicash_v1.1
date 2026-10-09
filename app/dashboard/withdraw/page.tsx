import WithdrawModal from '@/components/WithdrawModal';

export default function WithdrawPage() {
  // Replace with dynamic user profile data fetched from Supabase Auth session
  const mockUserId = 'user_12345';
  const mockBalance = 250;

  return (
    <main className="min-h-screen bg-gray-50 py-12 flex justify-center items-center p-4">
      <WithdrawModal userId={mockUserId} userBalanceKes={mockBalance} />
    </main>
  );
}
<div className="bg-blue-600 ...">
  <p>Available Balance</p>
  <h1>KES {balance}</h1>
</div>
