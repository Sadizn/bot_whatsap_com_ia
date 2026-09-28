import { PERMISSIONS } from '../../modules/permissionManager.js';

const TRIVIA_FACTS = [
  'Sabia que os polvos têm três corações e o sangue deles é azul?',
  'Sabia que o mel nunca estraga? Arqueólogos já encontraram potes de mel de 3.000 anos no Egito perfeitamente comestíveis!',
  'Sabia que o primeiro bug de computador registrado na história foi uma mariposa presa dentro de um computador Mark II em 1947?',
  'Sabia que o som viaja cerca de 4 vezes mais rápido na água do que no ar?',
  'Sabia que as borboletas sentem o gosto dos alimentos com os pés?'
];

export const triviaCommand = {
  name: 'curiosidade',
  aliases: ['trivia', 'fato'],
  category: 'games',
  description: 'Exibe um fato curioso ou trivia interessante',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid }) {
    const randomFact = TRIVIA_FACTS[Math.floor(Math.random() * TRIVIA_FACTS.length)];
    await sock.sendMessage(remoteJid, {
      text: `💡 *CURIOSIDADE DO DIA*\n\n${randomFact}\n\n_Edith Entretenimento_`
    }, { quoted: msg });
  }
};
