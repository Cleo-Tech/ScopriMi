import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { readFile, rename, mkdir } from 'fs/promises';
import { Express } from 'express-serve-static-core';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { QuestionGenre } from '../MiddleWare/Types';
import { db } from '../sqlite.js';

// Tutte le domande che vengono lette dal file json
export let AllQuestions: { [key in QuestionGenre]: string[] }

export const SetAllQuestions = async (): Promise<any> => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const data = await readFile(join(__dirname, '../questions.json'), 'utf8');
  AllQuestions = JSON.parse(data);
  // ADDSQL qua si valorizza la tabella Question al posto che usare AllQuestions

  // Inserisci tutti i generi 
  Object.keys(AllQuestions).forEach(genre => {
    db.serialize(() => {
      db.run(`
        INSERT OR IGNORE INTO Genre (name) VALUES (?);
      `, [genre]);



      db.get(`SELECT id FROM Genre WHERE name = ?`, [genre], (err, row) => {
        console.log(row['id']);
        AllQuestions[genre].forEach(value => {
          db.run(`
            INSERT OR IGNORE INTO Question (genre_id, content) VALUES (?, ?);
          `, [parseInt(row['id']), value]);
        })
      });
    });


  }
  );




}

export const setupUpload = (app: Express) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const uploadDir = join(__dirname, '../uploads');

  mkdir(uploadDir, { recursive: true }).catch(console.error);

  const upload = multer({ dest: uploadDir });

  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (token && token === process.env.SECRET_TOKEN) {
      next();
    } else {
      res.status(403).json({ error: 'Accesso non autorizzato' });
    }
  };

  app.post('/upload', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
    const tempPath = req.file?.path;
    const targetPath = join(__dirname, '../questions.json');

    if (!tempPath) {
      return res.status(400).json({ error: 'File non trovato' });
    }

    try {
      await rename(tempPath, targetPath);
      const data = await readFile(targetPath, 'utf8');
      AllQuestions = JSON.parse(data);
      res.status(200).json({ message: 'File aggiornato con successo' });
    } catch (err) {
      console.error('Errore durante il salvataggio del file', err);
      res.status(500).json({ error: 'Errore durante il salvataggio del file' });
    }
  });
}
