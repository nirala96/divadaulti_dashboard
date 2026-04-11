import { Sidebar } from "@/components/Sidebar";
import { ProductionStatusBoard } from "@/components/ProductionStatusBoard";
import { getDesignsWithClients } from "@/lib/actions";

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch data on server for faster initial load
  const designs = await getDesignsWithClients()
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Production Status Board
            </h1>
            <p className="text-gray-600">
              Track and manage all designs across different production stages
            </p>
          </div>
          <ProductionStatusBoard initialDesigns={designs} />
        </div>
      </main>
    </div>
  );
}
