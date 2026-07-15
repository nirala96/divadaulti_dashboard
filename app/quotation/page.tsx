import { Sidebar } from "@/components/Sidebar";

export default function QuotationPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <iframe
          src="/quotation-generator.html"
          title="Quotation Generator"
          className="w-full h-full border-0"
        />
      </main>
    </div>
  );
}
