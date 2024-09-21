# ScopriMi
Party game ispirato a "Dimmi chi sei!"

## Disclaimer
Questo gioco è stato creato da studenti / appassionati di informatica come progetto per migliorare le proprie abilità di sviluppo e avere un gioco da fare durante le serate con amici, non ha finalità commerciali.

## Fuzionamento
In questo gioco un gruppo di persone si connette ad una lobby e gli vengono proposte delle domande, ognuno deve votare chi secondo lui è la persona più adatta al tipo di domanda. Guadagnano punto tutti coloro che hanno votato la maggioranza (se presente).

### Flusso di Gioco
1. I giocatori si connettono a una lobby inserendo un codice o tramite invito dall'host.
2. Viene presentata una domanda a tutti i partecipanti.
3. Ogni giocatore vota chi, secondo lui, meglio risponde alla descrizione della domanda.
4. Punti vengono assegnati a coloro che hanno votato per la maggioranza.
5. Il gioco continua per un certo numero di turni, e il giocatore con più punti alla fine vince.


## Immagini del Gioco
![Login](images/Login.png)
![Home](images/Home.png)
![Lobby](images/Lobby.png)
![Game](images/Game.png)
![Results](images/Results.png)
![Final Results](images/FinalResults.png)



## Stack Tecnologico
- **Frontend**: React, Bootstrap, CSS per lo stile.
- **Backend**: Express, Node.js.
- **Database**: Attualmente non in utilizzo

## Funzionalità in arrivo👀
- **Disegni✏️**: nuova modalità di gioco in cui è possibile disegnare / modificare un immagine basandosi su uno dei giocatori presenti
- **Gestione lobby**: aggiunta di un admin per ogni lobby, con la possibilità di rimuovere giocatore e fare iniziare la partita
- **Foto📷**: è possibile scattarsi una foto da usare durante la partita
- **Tanto altro**: varie modifiche server-side, miglioramento UI/UX...

## Contributori

Ringraziamo tutti coloro che hanno contribuito a questo progetto e che impiegano il loro tempo libero per lo sviluppo dell'applicazione.
Un ringraziamento speciale va anche a tutti coloro che hanno giocato a Scoprimi, si sono divertiti e hanno proposto modifiche / miglioramenti!

| ![fmanto01](https://github.com/fmanto01.png?size=100) | ![pesto13](https://github.com/pesto13.png?size=100) | ![simomux](https://github.com/simomux.png?size=100) |
|:-----------------------------------------------------:|:---------------------------------------------------:|:---------------------------------------------------:|
| [fmanto01](https://github.com/fmanto01)               | [pesto13](https://github.com/pesto13)               | [simomux](https://github.com/simomux)               |

## Installazione e avvio

Clone del repository
```
git clone https://github.com/fmanto01/party_game.git
cd Party_game/
```
Server
```
cd Server/
npm install
npm run start
```

Client - Scoprimi
```
cd Scoprimi/
npm install
npm run dev
```
