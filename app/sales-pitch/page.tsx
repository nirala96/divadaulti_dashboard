import { Sidebar } from "@/components/Sidebar";

export default function SalesPitchPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <iframe
          src="/sales-pitch-deck.html"
          title="Sales Pitch Deck"
          className="w-full h-full border-0"
        />
      </main>
    </div>
  );
}
