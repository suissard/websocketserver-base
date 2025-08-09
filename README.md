# WEBSOCKETSERVER-BASE

Une base pour construire des serveurs WebSocket en Node.js, gérant les utilisateurs, les lobbies, et la communication en temps réel.

## Fonctionnalités

-   Gestion des connexions et déconnexions des utilisateurs.
-   Système de lobbies (salons de discussion).
-   Envoi et réception de messages en temps réel.
-   Gestion des données avec un système de permissions.
-   Client et Serveur inclus.

## Table des matières

-   [Installation](#installation)
-   [Utilisation côté serveur](#utilisation-côté-serveur)
-   [Utilisation côté client](#utilisation-côté-client)
-   [Événements WebSocket](#événements-websocket)
-   [API](#api)

## Installation

Pour installer ce paquet, utilisez la commande npm suivante :

```bash
npm install websocketserver-base
```

## Utilisation côté serveur

Voici un exemple simple pour démarrer un serveur WebSocket.

Créez un fichier `server.js` :

```javascript
const http = require('http');
const { Server } = require('websocketserver-base');

// 1. Créez un serveur HTTP natif
const httpServer = http.createServer();

// 2. Options pour le serveur Socket.io (optionnel)
const options = {
  cors: {
    origin: "*", // Adaptez en production
  },
};

// 3. Définissez des gestionnaires d'événements personnalisés (optionnel)
const customHandlers = {
  'custom_event': (authUser, socket, data) => {
    console.log(`Événement personnalisé reçu de ${authUser ? authUser.getId() : 'anonymous'}`);
    // Renvoyer une réponse au client
    socket.emit('custom_response', { success: true });
  }
};

// 4. Instanciez le serveur WebSocket
const wsServer = new Server(httpServer, options, customHandlers);

// 5. Démarrez le serveur
const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur WebSocket en écoute sur le port ${PORT}`);
});
```

Pour exécuter ce serveur, lancez la commande : `node server.js`.

## Utilisation côté client

Voici un exemple de base pour le client. Ce code peut être exécuté dans un environnement Node.js ou adapté pour un navigateur.

Créez un fichier `client.js` :

```javascript
const { Client } = require('websocketserver-base');

// 1. Instanciez le client en spécifiant l'adresse du serveur
const client = new Client('localhost', 3000, 'http');

// 2. Écoutez l'événement 'login' pour recevoir les données de l'utilisateur
client.on('login', (userData) => {
  console.log('Connecté avec succès ! Données utilisateur :', userData);

  // Une fois connecté, vous pouvez interagir avec le serveur
  // Par exemple, rejoindre un lobby
  console.log('Tentative de connexion au lobby "general"...');
  client.connectLobby('general');
});

// 3. Écoutez l'événement 'connect_lobby'
client.on('connect_lobby', (lobbyData) => {
  console.log('Connecté au lobby :', lobbyData.id);

  // Envoyer un message dans le lobby
  client.sendMessage(lobbyData.id, 'Bonjour tout le monde !');
});

// 4. Écoutez les messages entrants
client.on('send_message', (message) => {
  console.log(`Nouveau message de ${message.data.user.id}: ${message.data.content}`);
});

// 5. Gérer les erreurs de connexion
client.on('error', (error) => {
  console.error('Erreur client :', error);
});
```

Pour exécuter ce client, lancez la commande : `node client.js`. Assurez-vous que le serveur est en cours d'exécution.

## Événements WebSocket

La communication entre le client et le serveur se fait via des événements. Voici les événements natifs principaux :

| Événement          | Direction         | Description                                                                                             | Données (Payload)                                      |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `login`            | Client → Serveur  | Déclenche la connexion ou l'authentification de l'utilisateur.                                          | `{ username, token }` (optionnel)                      |
| `login`            | Serveur → Client  | Confirme la connexion et envoie les données de l'utilisateur.                                           | `{ id, token, data, ... }`                             |
| `logout`           | Client → Serveur  | Déconnecte l'utilisateur.                                                                               | -                                                      |
| `connect_lobby`    | Client → Serveur  | Demande à rejoindre un lobby. Le lobby est créé s'il n'existe pas.                                       | `{ lobby: { id, token } }`                             |
| `connect_lobby`    | Serveur → Client  | Confirme la connexion au lobby et envoie ses données.                                                   | `{ id, data, users, messages, ... }`                   |
| `disconnect_lobby` | Client → Serveur  | Demande à quitter un lobby.                                                                             | `{ lobby: { id, token } }`                             |
| `send_message`     | Client → Serveur  | Envoie un message dans un lobby.                                                                        | `{ lobby: { id, token }, content: "..." }`             |
| `send_message`     | Serveur → Clients | Diffuse le nouveau message à tous les membres du lobby.                                                 | `{ id, content, user, lobby, ... }`                    |
| `typing_message`   | Client → Serveur  | Informe que l'utilisateur est en train d'écrire.                                                        | `{ lobby: { id, token } }`                             |
| `update_data`      | Client → Serveur  | Demande la mise à jour d'une donnée (ex: profil utilisateur).                                           | `{ type, id, token, data: { ... } }`                   |
| `update_data`      | Serveur → Clients | Diffuse la donnée mise à jour aux clients concernés.                                                    | `{ id, type, data, ... }`                              |

## API

Le paquet expose plusieurs classes pour construire votre application.

-   **`Server`**: La classe principale côté serveur. Elle hérite de `socket.io.Server` et gère l'ensemble des connexions, des utilisateurs et des lobbies. C'est le point d'entrée de votre backend.

-   **`Client`**: La classe principale côté client. Elle permet de se connecter au serveur, d'émettre des événements et de recevoir des données. Elle inclut un cache pour gérer localement les données du serveur.

-   **`User`**: Représente un utilisateur connecté au serveur. Chaque utilisateur a un ID unique, un socket associé et peut être membre de plusieurs lobbies.

-   **`Lobby`**: Représente un salon de discussion ou un groupe. Un lobby contient des utilisateurs et des messages. L'accès peut être public ou privé (sur invitation ou avec un token).

-   **`Message`**: Représente un message envoyé par un utilisateur dans un lobby.

-   **`ManageableObject`**: Une classe de base pour les objets qui ont des propriétaires, des permissions d'accès et des données associées. `User`, `Lobby`, et `Message` héritent de cette classe.

-   **`...Manager`**: (ex: `UsersManager`, `LobbysManager`) Des classes internes qui gèrent des collections d'objets (utilisateurs, lobbies, etc.). Elles sont accessibles via l'instance du `Server`.
