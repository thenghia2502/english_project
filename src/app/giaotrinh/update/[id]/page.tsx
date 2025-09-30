import GiaoTrinhPage from '@/components/giaotrinh/GiaoTrinhPage'

export default async function UpdateGiaoTrinh({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  return <GiaoTrinhPage mode="update" id={id} />
}