-- ADDSQL

CREATE TABLE Genre (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE Image (
    id INT PRIMARY KEY AUTO_INCREMENT,
    URL VARCHAR(100) NOT NULL --todo check
);

CREATE TABLE Image_Questions(
    image_id INT,
    question_id INT,
    PRIMARY KEY (image_id, question_id),
    FOREIGN KEY (image_id) REFERENCES Image(id),
    FOREIGN KEY (question_id) REFERENCES Question(id)
)

CREATE TABLE Question (
    id INT PRIMARY KEY AUTO_INCREMENT,
    genre_id INT,
    content TEXT NOT NULL,
    tag TEXT,
    FOREIGN KEY (genre_id) REFERENCES Genre(id)
);

CREATE TABLE Game (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(6) NOT NULL,
    genre_id INT,
    question_id INT,
    FOREIGN KEY (genre_id) REFERENCES Genre(id),
    FOREIGN KEY (question_id) REFERENCES Question(id)
);

CREATE TABLE Game_Questions (
    game_id INT,
    question_id INT,
    PRIMARY KEY (game_id, question_id),
    FOREIGN KEY (game_id) REFERENCES Game(id),
    FOREIGN KEY (question_id) REFERENCES Question(id)
);
