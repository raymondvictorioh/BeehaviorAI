import { AISummaryCard } from '../AISummaryCard';

export default function AISummaryCardExample() {
  return (
    <div className="p-4 max-w-2xl">
      <AISummaryCard
        summary="Sarah is generally a well-behaved and engaged student who actively participates in class. Recent behavior logs indicate strong leadership qualities and helpful nature towards peers. There have been a few minor concerns about tardiness to morning classes, which may need attention."
        lastUpdated="October 28, 2025 at 2:30 PM"
        onRegenerate={() => console.log('Regenerating summary')}
      />
    </div>
  );
}
