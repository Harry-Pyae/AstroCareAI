import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';

type Crew = { id: string; name: string; role: string };

// crew.json is P2's; glob so the shell builds before it lands.
const crewFiles = import.meta.glob<Crew[]>('../../data/crew.json', { eager: true, import: 'default' });
const crew: Crew[] = Object.values(crewFiles)[0] ?? [];

function CrewBadge({ member }: { member: Crew }) {
  const path = `/crew/${member.id}`;
  const [qr, setQr] = useState('');

  useEffect(() => {
    QRCode.toDataURL(location.origin + path, { margin: 1, width: 160 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [path]);

  return (
    <Link
      to={path}
      className="flex flex-col items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-6 hover:border-amber-400 focus-visible:border-amber-400"
    >
      {qr && <img src={qr} alt={`QR code linking to ${member.name}'s brief`} className="h-40 w-40 rounded" />}
      <div className="text-center">
        <p className="text-xl text-neutral-100">{member.name}</p>
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">{member.role}</p>
        <p className="mt-1 font-mono text-xs text-amber-400">{member.id}</p>
      </div>
    </Link>
  );
}

export default function CrewSelectPage() {
  return (
    <section>
      <h1 className="mb-2 text-2xl text-neutral-100">Select crew member</h1>
      <p className="mb-8 text-neutral-400">Scan a badge QR or click a card to open the baseline brief.</p>
      {crew.length === 0 ? (
        <p className="font-mono text-sm text-neutral-500">Crew data not merged yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {crew.map((m) => (
            <CrewBadge key={m.id} member={m} />
          ))}
        </div>
      )}
    </section>
  );
}
