import { Sidebar } from "@/components/Sidebar";
import { EmployeePerformance } from "@/components/EmployeePerformance";

export default function PerformancePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-[1800px] mx-auto">
          <EmployeePerformance />
        </div>
      </main>
    </div>
  );
}
