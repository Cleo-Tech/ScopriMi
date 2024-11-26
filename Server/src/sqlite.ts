import sqlite3 from 'sqlite3';

export const db = new sqlite3.Database('./database.db');


export function setupDB() {
  // Creazione della tabella Genre
  db.run(`
  CREATE TABLE IF NOT EXISTS QuestionType (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL
  );
`);

  // Creazione della tabella Image_Tag_Cloudinary
  db.run(`
  CREATE TABLE IF NOT EXISTS TagCloudinary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
  );
`);

  // Creazione della tabella Image
  db.run(`
  CREATE TABLE IF NOT EXISTS Image (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    URL VARCHAR(255) NOT NULL UNIQUE
  );
`);

  // Creazione della tabella Image_Tag (associazione tra Image e Tag)
  db.run(`
  CREATE TABLE IF NOT EXISTS Image_TagCloudinary (
    image_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (image_id, tag_id),
    FOREIGN KEY (image_id) REFERENCES Image(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Image_Tag_Cloudinary(id) ON DELETE CASCADE
  );
`);

  // Creazione della tabella Image_Question (associazione tra Image e Question)
  db.run(`
  CREATE TABLE IF NOT EXISTS Image_Question (
    image_id INTEGER,
    question_id INTEGER,
    PRIMARY KEY (image_id, question_id),
    FOREIGN KEY (image_id) REFERENCES Image(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES Question(id) ON DELETE CASCADE
  );
`);

  // Creazione della tabella Tag
  db.run(`
  CREATE TABLE IF NOT EXISTS Category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL
  );
`);

  // Creazione della tabella Question_Tag (associazione tra Question e Tag)
  db.run(`
  CREATE TABLE IF NOT EXISTS Question_Category (
    question_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES Question(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tag(id) ON DELETE CASCADE
  );
`);

  // Creazione della tabella Question
  db.run(`
  CREATE TABLE IF NOT EXISTS Question (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    genre_id INTEGER,
    content TEXT NOT NULL,
    FOREIGN KEY (genre_id) REFERENCES Genre(id) ON DELETE SET NULL
  );
`);

  // Creazione della tabella Game
  db.run(`
  CREATE TABLE IF NOT EXISTS Game (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(6) NOT NULL,
    genre_id INTEGER,
    FOREIGN KEY (genre_id) REFERENCES Genre(id) ON DELETE SET NULL
  );
`);

  // Creazione della tabella Game_Question (associazione tra Game e Question)
  db.run(`
  CREATE TABLE IF NOT EXISTS Game_Question (
    game_id INTEGER,
    question_id INTEGER,
    PRIMARY KEY (game_id, question_id),
    FOREIGN KEY (game_id) REFERENCES Game(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES Question(id) ON DELETE CASCADE
  );
`)
}
