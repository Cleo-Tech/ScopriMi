const apiUrl = `https://api.cloudinary.com/v1_1/${process.env.cloud_name}/resources/image?tags=true&max_results=500`;

export let photoUrls: any[];

export async function setPhotoUrls() {
  try {
    photoUrls = await fetchImageUrls(apiUrl);
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

