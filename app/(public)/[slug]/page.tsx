export default function ShopMenuPage({ params }: { params: { slug: string } }) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">{params.slug} 가게 메뉴</h1>
      <p className="mt-2 text-muted-foreground">메뉴 목록 페이지 (준비 중)</p>
    </main>
  );
}
