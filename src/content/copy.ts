export const COPY = {
  title: 'Feed Zero',
  lore: 'A FeedZero virou a maior rede social do país. Na corrida por engajamento, o algoritmo passou a impulsionar o que mais gera reação, inclusive o ódio. A Operação Feed Zero entra na rede para deixar o feed com zero ameaças.',
  reject: {
    notStarted: 'A partida ainda não começou.',
    ended: 'A partida terminou. Comece uma nova.',
    wrongPhase: 'Essa ação não está disponível agora.',
    needMove: 'Mova ou escolha Ficar antes de agir.',
    alreadyMoved: 'Você já se moveu neste turno.',
    needAct: 'Mova ou escolha Ficar primeiro.',
    sameZone: 'Você já está nessa zona. Use Ficar.',
    outOfRange: 'Essa zona está longe demais. Escolha uma zona alcançável.',
    unknownZone: 'Zona desconhecida.',
    needDilemmaChoice: 'Escolha a opção A ou B do Dilema.',
    noThreat: 'Essa Ameaça não está no tabuleiro.',
    threatNotReachable: 'Mova até a zona da Ameaça ou escolha outra ação.',
    cardCount: 'Escolha 1 ou 2 cartas de Resposta.',
    cardsNotInHand: 'Essas cartas não estão na sua mão.',
    duplicateCards: 'Escolha cartas diferentes.',
    noDilemma: 'Não há Dilema para comprar.',
    supportNeedsPlayer: 'Apoiar exige outro jogador na mesma zona.',
    supportUnknownPlayer: 'Esse jogador não está na partida.',
    supportNotSameZone: 'O jogador precisa estar na mesma zona.',
    supportSelf: 'Você não pode apoiar a si mesmo.',
    supportCardCount: 'Dê 1 ou 2 cartas.',
    supportHandFull: 'A mão desse jogador não comporta essas cartas.',
    restOnlyCentral: 'Só é possível Descansar na Central de Moderação.',
    debugOnlyCaio: 'Só o Caio usa o Debug do Algoritmo.',
    debugUsed: 'O Debug já foi usado nesta rodada.',
    debugNotEnough: 'Não há Ameaças suficientes no baralho para o Debug.',
    notYourTurn: 'Não é a vez desse jogador.',
    noAlgorithm: 'A Fase do Algoritmo não está em andamento.',
    undoUnavailable: 'Não há ação para desfazer agora.',
    setupPlayers: 'A partida precisa de 2 a 4 jogadores.',
    setupCharacters: 'Cada jogador precisa de um personagem diferente.',
    setupNames: 'Todos os jogadores precisam de um nome.',
  },
  log: {
    gameStarted: (n: number) => `Operação Feed Zero começou com ${n} jogadores.`,
    roundStarted: (r: number) => `Rodada ${r}.`,
    turnSkipped: (p: string) => `${p} perde o turno (suspensão).`,
    drew: (p: string, n: number) => `${p} comprou ${n} ${n === 1 ? 'Resposta' : 'Respostas'}.`,
    moved: (p: string, zone: string) => `${p} foi para ${zone}.`,
    stayed: (p: string) => `${p} ficou onde estava.`,
    played: (p: string, names: string) => `${p} jogou ${names}.`,
    shortcutCost: (p: string, integrity: number, hate: number) =>
      `Cancelamento em Massa: ${p} perde ${integrity} Integridade e o Ódio Viral sobe +${hate}.`,
    acolherIntegrity: (p: string, n: number) => `${p} ganhou +${n} Integridade ao acolher.`,
    eliminated: (p: string, threat: string, zone: string, rep: number, integrity: number) => {
      const parts: string[] = [];
      if (rep > 0) parts.push(`+${rep} Reputação`);
      if (integrity > 0) parts.push(`+${integrity} Integridade`);
      return `${p} eliminou ${threat} em ${zone}.${parts.length ? ' ' + parts.join(', ') + '.' : ''}`;
    },
    confrontFailed: (p: string, threat: string, total: number, required: number) =>
      `${p} não eliminou ${threat} (${total} contra Força ${required}).`,
    explored: (p: string, dilemma: string) => `${p} explorou e encontrou o Dilema “${dilemma}”.`,
    exploreDraw: (p: string) => `${p} comprou 1 Resposta em Comentários.`,
    dilemmaChoice: (p: string, label: string) => `${p} escolheu: ${label}.`,
    supported: (p: string, to: string, n: number, rep: number) =>
      `${p} apoiou ${to} com ${n} ${n === 1 ? 'carta' : 'cartas'}. +${rep} Reputação.`,
    rested: (p: string, integrity: number, draw: number) =>
      `${p} descansou na Central: +${integrity} Integridade e ${draw} Respostas.`,
    suspended: (p: string) => `${p} foi suspenso e volta ao Feed.`,
    debug: (p: string, swapped: boolean) =>
      swapped
        ? `${p} trocou a ordem das 2 próximas Ameaças.`
        : `${p} conferiu as 2 próximas Ameaças.`,
    algorithmStart: 'Fase do Algoritmo.',
    eventRevealed: (name: string) => `Evento: ${name}.`,
    eventHate: 'O algoritmo impulsiona a polêmica: Ódio Viral +1.',
    eventDraw: 'Todos compram 1 Resposta.',
    eventExtraThreat: 'A notícia viral traz uma Ameaça extra.',
    threatEntered: (name: string, zone: string, redirected: boolean) =>
      redirected
        ? `${name} apareceu no Feed (a Central é zona segura).`
        : `${name} apareceu em ${zone}.`,
    noMoreThreats: 'O baralho de Ameaças acabou.',
    hateRose: (n: number, zones: number) =>
      `Ódio Viral +${n} (${zones} ${zones === 1 ? 'zona com Ameaça' : 'zonas com Ameaças'}).`,
    hateChanged: (delta: number) => `Ódio Viral ${delta > 0 ? '+' : ''}${delta}.`,
    victory: 'Vitória coletiva! O feed ficou limpo.',
    feedTomado: 'Feed Tomado: o Ódio Viral chegou ao limite.',
    semSaida: 'Sem saída: não há mais Ameaças para eliminar a meta.',
    undo: 'Última ação desfeita.',
  },
  outcome: {
    victory: 'Vitória coletiva',
    feed_tomado: 'Feed Tomado',
    sem_saida: 'Sem saída',
  },
  rules: [
    {
      title: 'Objetivo',
      text: 'Todos jogam contra o Ódio Viral. Eliminem Ameaças antes que o Ódio Viral chegue a 12. Se vencerem, ganha individualmente quem tiver a maior pontuação ética.',
    },
    {
      title: 'Turno',
      text: 'Compre 1 Resposta (mão de até 5), mova até 2 zonas ou fique, e escolha uma ação: Enfrentar, Explorar, Apoiar ou Descansar (só na Central).',
    },
    {
      title: 'Enfrentar',
      text: 'Jogue 1 ou 2 Respostas e some os valores. +1 se alguma carta é a Fraqueza da Ameaça. Aplique os modificadores da zona e da habilidade. Total igual ou maior que a Força elimina a Ameaça.',
    },
    {
      title: 'Atalho: Cancelamento em Massa',
      text: 'Vale 4 e ignora a Fraqueza, mas custa 2 Integridade e +1 Ódio Viral, e a eliminação não conta para o bônus ético.',
    },
    {
      title: 'Status',
      text: 'Integridade vai de 0 a 8; em 0 você é suspenso, perde o próximo turno e volta ao Feed com 2. Reputação não tem limite. Ódio Viral vai de 0 a 12.',
    },
    {
      title: 'Fase do Algoritmo',
      text: 'Depois que todos jogam: 1) um Evento; 2) uma nova Ameaça (duas a partir da rodada 5); 3) Ódio Viral +1 por zona com Ameaça; 4) checagem de fim.',
    },
    {
      title: 'Fim de jogo',
      text: 'Vitória coletiva ao atingir a meta de Ameaças eliminadas. Derrota coletiva (Feed Tomado) se o Ódio Viral chegar a 12. Pontuação: Reputação + Integridade + 1 por Ameaça eliminada sem atalho. Desempate: Integridade, depois Apoios.',
    },
  ],
  about: {
    theme: 'Tema 3: Racismo e discurso de ódio nas redes sociais.',
    tags: [
      'Racismo',
      'Discurso de ódio',
      'Redes sociais',
      'Algoritmos',
      'Moderação de conteúdo',
      'Denúncia',
      'Empatia',
      'Responsabilidade profissional',
    ],
    quest: 'Exploração · Personagens · Status · Kill',
  },
} as const;
