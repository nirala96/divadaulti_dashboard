import { Sidebar } from "@/components/Sidebar";
import { OnHoldOrders } from "@/components/OnHoldOrders";

export default function OnHoldPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1800px] mx-auto">
          <OnHoldOrders />
        </div>
      </main>
    </div>
  );
}
