import Card from '../reusables/Card'

function ProductCardSkeleton() {
  return (
    <Card className="animate-pulse p-5" aria-hidden="true">
      <div className="h-5 w-24 rounded-full bg-slate-200" />
      <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-full rounded bg-slate-100" />
      <div className="mt-6 h-7 w-20 rounded bg-slate-200" />
      <div className="mt-4 h-9 w-full rounded-lg bg-slate-200" />
    </Card>
  )
}

export default ProductCardSkeleton
