export default function CompletePage({ params }: { params: { slug: string } }) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">주문 완료</h1>
      <p className="mt-2 text-muted-foreground">{params.slug} 주문 완료 페이지 (준비 중)</p>
    </main>
  );
}
