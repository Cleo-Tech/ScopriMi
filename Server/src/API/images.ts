import { db } from "../sqlite.js";

const apiUrl = `https://api.cloudinary.com/v1_1/${process.env.cloud_name}/resources/image?tags=true&max_results=500`;

export let photoUrls: any[];

export async function setPhotoUrls() {
  try {
    photoUrls = await fetchImageUrls(apiUrl);
    // ADDSQL valorizzare la tabella Images al posto di questo export, qua ci sono anche i tags
    Object.values(photoUrls).forEach(element => {

      db.run(`
        INSERT INTO Image (URL) VALUES (?);
      `, [element.secure_url])

      Object.values(element.tags).forEach(tag => {
        db.serialize(() => {

          db.run(`
            INSERT INTO Image_Tag_Cloudinary (name) VALUES (?);
          `, [tag])


          db.run(`
            INSERT INTO Image_Tag (image_id, tag_id) VALUES 
            ((SELECT id FROM Image WHERE URL = ?),
            (SELECT id FROM Image_Tag_Cloudinary WHERE name = ?))
            `, [element.secure_url, tag]
          )
        });
      })
    });

  } catch (error) {
    console.error('Error fetching image URLs:', error);
  }
}

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

