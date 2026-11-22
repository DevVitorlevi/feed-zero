import { COPY } from '../../content/copy';
import { PressButton } from '../components/PressButton';

const QUEST = [
  { k: 'Exploração', v: 'Mapa livre de 7 zonas da rede.' },
  { k: 'Personagens', v: '4 personagens, cada um com uma habilidade própria.' },
  { k: 'Status', v: 'Integridade, Reputação e a barra compartilhada de Ódio Viral.' },
  {
    k: 'Kill',
    v: 'Eliminar Ameaças (discurso de ódio, desinformação, perfis falsos, assédio, algoritmo).',
  },
];

export function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold text-net">Sobre o jogo</h1>

      <section className="panel">
        <h2 className="mb-1 font-extrabold">Tema</h2>
        <p>{COPY.about.theme}</p>
      </section>

      <section className="panel">
        <h2 className="mb-1 font-extrabold">História</h2>
        <p>{COPY.lore}</p>
      </section>

      <section className="panel">
        <h2 className="mb-1 font-extrabold">Objetivo</h2>
        <p>
          Todos jogam contra o Ódio Viral. Se o grupo eliminar as Ameaças antes de o Ódio chegar a
          12, vence quem tiver a maior pontuação ética. O caminho fácil (o atalho) funciona agora e
          piora tudo depois.
        </p>
      </section>

      <section className="panel">
        <h2 className="mb-2 font-extrabold">Tags</h2>
        <ul className="flex flex-wrap gap-2">
          {COPY.about.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border-[3px] border-ink bg-sun px-3 py-1 text-sm font-bold"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="mb-2 font-extrabold">Quest</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {QUEST.map((q) => (
            <div key={q.k} className="contents">
              <dt className="font-bold">{q.k}</dt>
              <dd>{q.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div>
        <PressButton className="btn btn-primary" onClick={onBack}>
          Voltar
        </PressButton>
      </div>
    </main>
  );
}
