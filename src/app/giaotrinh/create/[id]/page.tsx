import GiaoTrinhPage from '@/components/giaotrinh/GiaoTrinhPage'

export default async function CreateGiaoTrinh({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  return <GiaoTrinhPage mode="create" id={id} />
}