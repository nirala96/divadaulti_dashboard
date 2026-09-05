import { Sidebar } from "@/components/Sidebar";
import { DispatchSchedule } from "@/components/DispatchSchedule";

export default function DispatchSchedulePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1800px] mx-auto">
          <DispatchSchedule />
        </div>
      </main>
    </div>
  );
}
