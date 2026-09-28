import axios from 'axios';
import { PERMISSIONS } from '../../modules/permissionManager.js';

export const weatherCommand = {
  name: 'clima',
  aliases: ['tempo', 'previsao', 'weather'],
  category: 'utils',
  description: 'Consulta a previsão do tempo para qualquer cidade',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, rawArgs }) {
    const city = (rawArgs || 'Luanda').trim();

    try {
      const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 6000 });
      const current = res.data?.current_condition?.[0];
      const nearest = res.data?.nearest_area?.[0];

      if (current && nearest) {
        const cityName = nearest.areaName?.[0]?.value || city;
        const country = nearest.country?.[0]?.value || '';
        const tempC = current.temp_C;
        const feelsLike = current.FeelsLikeC;
        const humidity = current.humidity;
        const desc = current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || 'Limpo';
        const wind = current.windspeedKmph;

        let text = `╭───────────────╮\n`;
        text += `│ ❖ 𝐏𝐑𝐄𝐕𝐈𝐒𝐀̃𝐎 𝐃𝐎 𝐓𝐄𝐌𝐏𝐎 ❖\n`;
        text += `│ ✰ ❯ 𝐋𝐨𝐜𝐚𝐥: ${cityName}, ${country}\n`;
        text += `│ ✰ ❯ 𝐓𝐞𝐦𝐩𝐞𝐫𝐚𝐭𝐮𝐫𝐚: ${tempC}°C (Sensação: ${feelsLike}°C)\n`;
        text += `│ ✰ ❯ 𝐂𝐨𝐧𝐝𝐢𝐜̧𝐚̃𝐨: ${desc}\n`;
        text += `│ ✰ ❯ 𝐔𝐦𝐢𝐝𝐚𝐝𝐞: ${humidity}%\n`;
        text += `│ ✰ ❯ 𝐕𝐞𝐧𝐭𝐨: ${wind} km/h\n`;
        text += `╰───────────────╯`;

        await sock.sendMessage(remoteJid, { text }, { quoted: msg });
      } else {
        await sock.sendMessage(remoteJid, { text: `❌ Não foi possível encontrar a previsão para "${city}".` }, { quoted: msg });
      }
    } catch (err) {
      await sock.sendMessage(remoteJid, { text: `❌ Erro ao consultar clima: ${err.message}` }, { quoted: msg });
    }
  }
};
