export default function ProductDetailPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">상품 상세</h1>
      <p className="mt-2 text-muted-foreground">
        {params.slug} / {params.productId} 주문 페이지 (준비 중)
      </p>
    </main>
  );
}
