import { Sidebar } from "@/components/Sidebar";
import { CompletedOrders } from "@/components/CompletedOrders";

export default function CompletedOrdersPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1800px] mx-auto">
          <CompletedOrders />
        </div>
      </main>
    </div>
  );
}
