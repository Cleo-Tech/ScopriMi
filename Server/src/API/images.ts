import { db } from "../sqlite.js";

const apiUrl = `https://api.cloudinary.com/v1_1/${process.env.cloud_name}/resources/image?tags=true&max_results=500`;

export let photoUrls: any[];

export async function setPhotoUrls() {
  try {
    photoUrls = await fetchImageUrls(apiUrl);
    // ADDSQL valorizzare la tabella Images al posto di questo export, qua ci sono anche i tags
    Object.values(photoUrls).forEach(element => {

      db.run(`
        INSERT OR IGNORE INTO Image (URL) VALUES (?);
      `, [element.secure_url])

      Object.values(element.tags).forEach(tag => {
        db.serialize(() => {

          db.run(`
            INSERT OR IGNORE INTO TagCloudinary (name) VALUES (?);
          `, [tag]);


          db.run(`
            INSERT OR IGNORE INTO Image_TagCloudinary (image_id, tag_id) VALUES 
            ((SELECT id FROM Image WHERE URL = ?),
            (SELECT id FROM TagCloudinary WHERE name = ?))
            `, [element.secure_url, tag]
          );

        });
      });

      // Megacantiere in vista della sburra

      // TODOshitImprove
      function getContextQuestion(input: string): string {
        const index = input.indexOf('£');
        if (index !== -1) {
          return input.substring(0, index).trim(); // Restituisce tutto prima del carattere £ e rimuove eventuali spazi
        }
        return '';
      }


      db.serialize(() => {

        db.all(`
            SELECT Question.content, Question.id
            FROM Question, QuestionType
            WHERE Question.questiontype_id = QuestionType.id
            AND QuestionType.name = 'photo'
          `, [], (err, rows) => {
          if (err) {
            console.error(err.message);
            return;
          }
          rows.forEach(question => {
            console.log(question['content']);
            db.all(`
              SELECT Image.id
              from TagCloudinary, Image_TagCloudinary, Image
              WHERE TagCloudinary.id = Image_TagCloudinary.tag_id and Image_TagCloudinary.image_id = Image.id and TagCloudinary.name = ?
            `, [getContextQuestion(question['content'])], (err, selectedImages) => {
              if (err) {
                console.error(err.message);
                return;
              }
              selectedImages.forEach(image => {
                console.log(image['id']);
                db.run(`
                  INSERT INTO Image_Question (question_id, image_id) VALUES (?, ?);
                `, [parseInt(question['id']), parseInt(image['id'])])
              })
            });
          });
        });
        // SBORRA

      });
    });

  } catch (error) {
    console.error('Error fetching image URLs:', error);
  }
}

// Megacantiere in vista della sburra

// Funzione per ottenere gli URL delle immagini
async function fetchImageUrls(apiUrl: string) {
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.API_Key}:${process.env.API_Secret}`).toString('base64'),
      },
    });
    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status} ${response.statusText}`);
    }

    let data = await response.json();
    data = data['resources'];
    // Restituire direttamente gli URL di download contenuti in "secure_url"
    return data.map((file: { secure_url: string, tags: string[] }) => ({
      secure_url: file.secure_url,
      tags: file.tags
    }));
  } catch (error) {
    console.error('Errore nel fetch degli URL delle immagini:', error);
    return [];
  }
}

