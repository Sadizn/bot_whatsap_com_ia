import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
const dataDir = path.join(rootDir, 'config');
const storeFile = path.join(dataDir, 'productivity_store.json');

class ProductivityStore {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(storeFile)) {
        const raw = fs.readFileSync(storeFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          reminders: parsed.reminders || [],
          notes: parsed.notes || [],
          tasks: parsed.tasks || []
        };
      }
    } catch (err) {
      logger.error(`Erro ao carregar productivity_store.json: ${err.message}`);
    }

    return {
      reminders: [
        {
          id: 'rem-1',
          title: 'Enviar relatório semanal para o João',
          date: '2026-09-28',
          time: '09:00',
          completed: false,
          createdAt: new Date().toISOString()
        }
      ],
      notes: [
        {
          id: 'not-1',
          content: 'Comprar cabo HDMI e adaptador USB-C',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'not-2',
          content: 'Alinhar reunião de métricas com o time na quarta-feira',
          completed: false,
          createdAt: new Date().toISOString()
        }
      ],
      tasks: [
        {
          id: 'tsk-1',
          title: 'Configurar novos prompts da Edith nos grupos',
          description: 'Ajustar regras e tom de voz descontraído',
          priority: 'alta', // baixa | media | alta
          status: 'em_andamento', // pendente | em_andamento | concluida
          dueDate: '2026-09-29',
          createdAt: new Date().toISOString()
        },
        {
          id: 'tsk-2',
          title: 'Revisar logs de áudios baixados no WhatsApp',
          description: 'Validar qualidade do reconhecimento de voz',
          priority: 'media',
          status: 'pendente',
          dueDate: '2026-09-30',
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  save() {
    try {
      fs.writeFileSync(storeFile, JSON.stringify(this.data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      logger.error(`Erro ao salvar productivity_store.json: ${err.message}`);
      return false;
    }
  }

  // --- LEMBRETES ---
  getReminders() {
    return this.data.reminders;
  }

  addReminder({ title, date, time }) {
    const reminder = {
      id: 'rem-' + Date.now(),
      title,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '09:00',
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.data.reminders.unshift(reminder);
    this.save();
    return reminder;
  }

  updateReminder(id, updates) {
    const item = this.data.reminders.find(r => r.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save();
      return item;
    }
    return null;
  }

  deleteReminder(id) {
    const initialLen = this.data.reminders.length;
    this.data.reminders = this.data.reminders.filter(r => r.id !== id);
    if (this.data.reminders.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- RECADOS / NOTAS ---
  getNotes() {
    return this.data.notes;
  }

  addNote({ content }) {
    const note = {
      id: 'not-' + Date.now(),
      content,
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.data.notes.unshift(note);
    this.save();
    return note;
  }

  updateNote(id, updates) {
    const item = this.data.notes.find(n => n.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save();
      return item;
    }
    return null;
  }

  deleteNote(id) {
    const initialLen = this.data.notes.length;
    this.data.notes = this.data.notes.filter(n => n.id !== id);
    if (this.data.notes.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- TAREFAS ---
  getTasks() {
    return this.data.tasks;
  }

  addTask({ title, description = '', priority = 'media', status = 'pendente', dueDate = '' }) {
    const task = {
      id: 'tsk-' + Date.now(),
      title,
      description,
      priority,
      status,
      dueDate,
      createdAt: new Date().toISOString()
    };
    this.data.tasks.unshift(task);
    this.save();
    return task;
  }

  updateTask(id, updates) {
    const item = this.data.tasks.find(t => t.id === id);
    if (item) {
      Object.assign(item, updates);
      this.save();
      return item;
    }
    return null;
  }

  deleteTask(id) {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    if (this.data.tasks.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const productivityStore = new ProductivityStore();
