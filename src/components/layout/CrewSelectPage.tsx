import { Link } from 'react-router-dom';
import crewData from '../../data/crew.json';
import type { CrewMember } from '../../lib/types';
import CrewQR from '../qr/CrewQR';

const crew: CrewMember[] = crewData;

export default function CrewSelectPage() {
  return (
    <section>
      <h1 className="mb-2 text-2xl font-semibold text-primary">Select crew member</h1>
      <p className="mb-8 text-secondary">Scan a badge QR or click a card to open the baseline brief.</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {crew.map((m) => (
          <Link
            key={m.id}
            to={`/crew/${m.id}`}
            className="flex flex-col items-center gap-4 rounded-xl border border-default bg-card p-6 hover:border-accent"
          >
            <CrewQR crewId={m.id} />
            <div className="text-center">
              <p className="text-xl text-primary">{m.name}</p>
              <p className="font-mono text-xs uppercase tracking-wider text-secondary">{m.role}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
