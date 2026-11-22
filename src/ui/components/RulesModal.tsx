import { COPY } from '../../content/copy';
import { Modal } from './Modal';

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Regras do jogo" onClose={onClose}>
      <ul className="flex flex-col gap-3">
        {COPY.rules.map((r) => (
          <li key={r.title}>
            <strong>{r.title}.</strong> {r.text}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
