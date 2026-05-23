export default function CheckoutPage({ params }: { params: { slug: string } }) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">결제</h1>
      <p className="mt-2 text-muted-foreground">{params.slug} 결제 페이지 (준비 중)</p>
    </main>
  );
}
