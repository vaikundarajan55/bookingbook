export default function PaymentBadge({ status }) {
  const paid = status === 'paid';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paid ? 'bg-moss-100 text-moss' : 'bg-coral-100 text-coral'}`}>
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  );
}
