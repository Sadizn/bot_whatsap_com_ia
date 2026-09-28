import { PERMISSIONS } from '../../modules/permissionManager.js';

const activeQuizzes = new Map();

const QUIZ_QUESTIONS = [
  {
    question: 'Qual é o planeta mais próximo do Sol?',
    options: ['A) Vênus', 'B) Mercúrio', 'C) Marte', 'D) Júpiter'],
    correct: 'B',
    explanation: 'Mercúrio é o planeta mais próximo do Sol no Sistema Solar.'
  },
  {
    question: 'Quem pintou a famosa obra "Mona Lisa"?',
    options: ['A) Vincent van Gogh', 'B) Pablo Picasso', 'C) Leonardo da Vinci', 'D) Michelangelo'],
    correct: 'C',
    explanation: 'Leonardo da Vinci pintou a Mona Lisa entre 1503 e 1506.'
  },
  {
    question: 'Qual é a linguagem padrão dos navegadores web para frontend?',
    options: ['A) Python', 'B) C++', 'C) JavaScript', 'D) Rust'],
    correct: 'C',
    explanation: 'JavaScript é a linguagem de programação executada nativamente nos navegadores.'
  },
  {
    question: 'Em que ano o homem pisou na Lua pela primeira vez na missão Apollo 11?',
    options: ['A) 1969', 'B) 1972', 'C) 1958', 'D) 1980'],
    correct: 'A',
    explanation: 'A missão Apollo 11 pousou na Lua em 20 de julho de 1969.'
  },
  {
    question: 'Qual elemento químico possui o símbolo "O" na tabela periódica?',
    options: ['A) Ouro', 'B) Ozônio', 'C) Oxigênio', 'D) Ósmio'],
    correct: 'C',
    explanation: 'O símbolo químico do Oxigênio é O.'
  }
];

export const quizCommand = {
  name: 'quiz',
  aliases: ['jogo', 'pergunta'],
  category: 'games',
  description: 'Inicia um Quiz interativo ou responde com a alternativa (!quiz A, B, C, D)',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, args, pushName }) {
    const sub = args[0] ? args[0].toUpperCase() : '';

    // Se já houver um quiz ativo e o usuário enviou uma alternativa (A, B, C ou D)
    if (activeQuizzes.has(remoteJid)) {
      const active = activeQuizzes.get(remoteJid);
      
      if (['A', 'B', 'C', 'D'].includes(sub)) {
        clearTimeout(active.timer);
        activeQuizzes.delete(remoteJid);

        if (sub === active.question.correct) {
          await sock.sendMessage(remoteJid, {
            text: `🎉 *PARABÉNS, ${pushName}!* Resposta correta: *${active.question.correct}*\n\n📖 _${active.question.explanation}_`
          }, { quoted: msg });
        } else {
          await sock.sendMessage(remoteJid, {
            text: `❌ *Que pena, ${pushName}!* Você escolheu ${sub}.\nA resposta correta era: *${active.question.correct}*\n\n📖 _${active.question.explanation}_`
          }, { quoted: msg });
        }
        return;
      }
    }

    // Iniciar nova rodada de Quiz
    const randomQ = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    
    if (activeQuizzes.has(remoteJid)) {
      clearTimeout(activeQuizzes.get(remoteJid).timer);
    }

    let text = `🧠 *DESAFIO QUIZ DA EDITH* 🧠\n\n`;
    text += `*Pergunta*: ${randomQ.question}\n\n`;
    text += randomQ.options.join('\n') + `\n\n`;
    text += `⏱️ *Você tem 45 segundos para responder!* (Envie *!quiz A*, *!quiz B*, etc.)`;

    const timer = setTimeout(async () => {
      if (activeQuizzes.has(remoteJid)) {
        activeQuizzes.delete(remoteJid);
        await sock.sendMessage(remoteJid, {
          text: `⏰ *Tempo esgotado para o Quiz!*\nA resposta correta era: *${randomQ.correct}* (${randomQ.explanation})`
        });
      }
    }, 45 * 1000);

    activeQuizzes.set(remoteJid, {
      question: randomQ,
      startedAt: Date.now(),
      timer
    });

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }
};
