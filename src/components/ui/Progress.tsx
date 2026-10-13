export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="progress" aria-label={`Step ${step} of ${total}`}>
      <span style={{ width: `${(step / total) * 100}%` }} />
    </div>
  );
}
