# Fichier d'instructions pour l'agent IA (Jules)

Bienvenue sur ce projet, Jules. Ce fichier a pour but de te guider dans tes contributions. Merci de le lire attentivement et de suivre les directives qu'il contient.

## 1. Objectif du Projet

*   **Description :** [À COMPLÉTER PAR L'UTILISATEUR] Décrivez ici la finalité principale de ce projet. Par exemple : "Cette application web permet aux utilisateurs de gérer leurs tâches quotidiennes."
*   **Pile Technique :** [À COMPLÉTER PAR L'UTILISATEUR] Listez les langages, frameworks et technologies clés. Par exemple : "Python, Django, React, PostgreSQL".

## 2. Principes Directeurs

1.  **Autonomie :** Prends des initiatives pour explorer le code, comprendre les problèmes et proposer des plans d'action détaillés.
2.  **Vérification :** Après chaque modification (création/modification de fichier, installation de dépendance), utilise les outils à ta disposition (`ls`, `read_file`, `run_in_bash_session`) pour vérifier que tes actions ont eu l'effet escompté.
3.  **Tests d'abord :** Pour les nouvelles fonctionnalités ou les corrections de bugs, la pratique du Test-Driven Development (TDD) est encouragée. Écris un test qui échoue avant d'implémenter la logique.
4.  **Qualité du code :** Le code doit être lisible, maintenable et bien documenté. Laisse le code plus propre que tu ne l'as trouvé.
5.  **Communication :** N'hésite pas à poser des questions (`request_user_input`) si une demande est ambiguë ou si tu es bloqué après avoir exploré plusieurs solutions. Communique clairement ton plan avant de commencer.

## 3. Workflow de Développement

### a. Installation et Dépendances

*   Pour installer les dépendances, décommentez et utilisez la ou les commandes appropriées pour votre projet.

    **Pour un projet JavaScript (Node.js) :**
    ```bash
    # Avec npm :
    # npm install

    # Ou avec yarn :
    # yarn install
    ```

    **Pour un projet Python :**
    ```bash
    # Il est recommandé d'utiliser un environnement virtuel.
    # python -m venv venv
    # source venv/bin/activate  # Sur Windows: venv\Scripts\activate
    # pip install -r requirements.txt
    ```

### b. Lancer l'application

*   Pour démarrer l'application en mode développement, décommentez et utilisez la commande appropriée.

    **Pour un projet JavaScript (Node.js) :**
    ```bash
    # Avec npm :
    # npm run dev

    # Ou avec yarn :
    # yarn dev
    ```

    **Pour un projet Python (par exemple avec Flask ou Django) :**
    ```bash
    # Assurez-vous que l'environnement virtuel est activé.
    # source venv/bin/activate

    # Pour Flask :
    # flask run

    # Pour Django :
    # python manage.py runserver
    ```

### c. Exécuter les Tests

*   **Crucial :** Avant de soumettre ton travail, assure-toi que tous les tests passent.
*   Pour lancer la suite de tests, décommentez et utilisez la commande appropriée.

    **Pour un projet JavaScript (Node.js) :**
    ```bash
    # Avec npm :
    # npm test

    # Ou avec yarn :
    # yarn test
    ```

    **Pour un projet Python :**
    ```bash
    # Assurez-vous que l'environnement virtuel est activé.
    # source venv/bin/activate

    # Avec pytest :
    # pytest

    # Ou avec unittest :
    # python -m unittest discover
    ```
*   Ajoute de nouveaux tests pour chaque nouvelle fonctionnalité ou correction. Les fichiers de test se trouvent dans le répertoire `tests/` ou sont nommés avec le suffixe `_test.py` ou `.spec.js`.

## 4. Conventions de Codage

*   **Style :** Suis les guides de style standards pour les langages utilisés (ex: PEP 8 pour Python, Prettier pour JavaScript/TypeScript).
*   **Nommage :** Utilise des noms de variables, fonctions et classes explicites et en anglais.
*   **Commentaires :** Commente les sections de code complexes, mais préfère un code auto-explicatif.
*   **Documentation :** Pour les nouvelles fonctions ou classes publiques, ajoute des docstrings (ou équivalent) pour décrire leur rôle, leurs paramètres et leur valeur de retour.

## 5. Soumission du Travail

*   Utilise l'outil `submit` lorsque tu as terminé et vérifié ton travail.
*   Le nom de la branche doit être concis et en rapport avec la tâche (ex: `feat/add-user-authentication`, `fix/login-bug`).
*   Le message de commit doit suivre le standard "Conventional Commits" :
    *   **Titre :** `feat: Ajoute une nouvelle fonctionnalité X` ou `fix: Corrige un bug sur Y`. Le titre doit être impératif et court.
    *   **Description :** (Optionnel) Fournis plus de contexte sur la modification, les choix techniques effectués et l'impact sur l'application.

Merci pour ta collaboration. Nous avons hâte de voir tes contributions !
