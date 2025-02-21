# Documentation de l'API

## Endpoints REST disponibles

### 1. **Ping API**

- **Endpoint**: `/api/ping`
- **Méthode**: `GET`
- **Description**: Vérifie la disponibilité de l'API.

#### Paramètres d'entrée

Aucun.

#### Réponse

- **Succès**:

  - **Code**: 200
  - **Corps**:
    ```json
    {
      "status": "OK",
      "details": {
        "database": "OK"
      }
    }
    ```

- **Erreur**:
  - **Code**: 500
  - **Corps**:
    ```json
    {
      "status": "Partial",
      "details": {
        "database": "KO"
      }
    }
    ```

#### Validations

Aucune validation spécifique mise en place pour cet endpoint.

### 2. **Users API**

#### a. **Get User Info**

- **Endpoint**: `/api/users/me`
- **Méthode**: `GET`
- **Description**: Récupère les informations de l'utilisateur connecté.

#### Paramètres d'entrée

- **Headers**:
  - `Authorization`: Token d'authentification de l'utilisateur.

#### Réponse

- **Succès**:

  - **Code**: 200
  - **Corps**:
    ```json
    {
      "email": "user@example.com",
      "uid": "user-id"
    }
    ```

- **Erreur**:
  - **Code**: 401
  - **Corps**:
    ```json
    {
      "message": "Unauthorized"
    }
    ```

#### Validations

- Vérifie que l'utilisateur est authentifié.

#### b. **Create User**

- **Endpoint**: `/api/users`
- **Méthode**: `POST`
- **Description**: Crée un nouvel utilisateur.

#### Paramètres d'entrée

- **Corps**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

#### Réponse

- **Succès**:

  - **Code**: 201
  - **Corps**:
    ```json
    {
      "uid": "new-user-id",
      "email": "user@example.com"
    }
    ```

- **Erreur**:
  - **Code**: 400
  - **Corps**:
    ```json
    {
      "message": "Failed to create user: <error message>"
    }
    ```

#### Validations

- Vérifie que l'email et le mot de passe sont fournis et valides.

### 3. **Quiz API**

#### a. **Get User Quizzes**

- **Endpoint**: `/api/quiz`
- **Méthode**: `GET`
- **Description**: Récupère les quiz de l'utilisateur connecté.

#### Paramètres d'entrée

- **Headers**:
  - `Authorization`: Token d'authentification de l'utilisateur.

#### Réponse

- **Succès**:

  - **Code**: 200
  - **Corps**:
    ```json
    {
      "data": [
        {
          "id": "quiz-id",
          "title": "Quiz Title",
          "_links": {
            "start": "/api/quiz/quiz-id/start"
          }
        }
      ],
      "_links": {
        "create": "/api/quiz"
      }
    }
    ```

- **Erreur**:
  - **Code**: 401
  - **Corps**:
    ```json
    {
      "message": "Unauthorized"
    }
    ```

#### Validations

- Vérifie que l'utilisateur est authentifié.

#### b. **Create Quiz**

- **Endpoint**: `/api/quiz`
- **Méthode**: `POST`
- **Description**: Crée un nouveau quiz.

#### Paramètres d'entrée

- **Corps**:
  ```json
  {
    "title": "New Quiz Title",
    "description": "Description of the quiz"
  }
  ```

#### Réponse

- **Succès**:

  - **Code**: 201
  - **Corps**:
    ```json
    {
      "data": {
        "id": "new-quiz-id",
        "title": "New Quiz Title",
        "description": "Description of the quiz"
      }
    }
    ```

- **Erreur**:
  - **Code**: 400
  - **Corps**:
    ```json
    {
      "message": "Failed to create quiz: <error message>"
    }
    ```

#### Validations

- Vérifie que le titre du quiz est fourni.

#### c. **Get Quiz by ID**

- **Endpoint**: `/api/quiz/:id`
- **Méthode**: `GET`
- **Description**: Récupère un quiz spécifique par son ID.

#### Paramètres d'entrée

- **URL**:
  - `id`: L'ID du quiz.

#### Réponse

- **Succès**:

  - **Code**: 200
  - **Corps**:
    ```json
    {
      "title": "Quiz Title",
      "description": "Quiz Description",
      "questions": []
    }
    ```

- **Erreur**:
  - **Code**: 404
  - **Corps**:
    ```json
    {
      "message": "Quiz not found"
    }
    ```

#### Validations

- Vérifie que l'utilisateur est authentifié.
- Vérifie que le quiz existe.

#### d. **Update Quiz**

- **Endpoint**: `/api/quiz/:id`
- **Méthode**: `PATCH`
- **Description**: Met à jour un quiz existant.

#### Paramètres d'entrée

- **URL**:
  - `id`: L'ID du quiz à mettre à jour.
- **Corps**: Les champs à mettre à jour.

#### Réponse

- **Succès**:

  - **Code**: 200
  - **Corps**:
    ```json
    {
      "data": {
        "id": "updated-quiz-id",
        "title": "Updated Quiz Title"
      }
    }
    ```

- **Erreur**:
  - **Code**: 404
  - **Corps**:
    ```json
    {
      "message": "Quiz not found"
    }
    ```

#### Validations

- Vérifie que l'utilisateur est authentifié.

#### e. **Add Question to Quiz**

- **Endpoint**: `/api/quiz/:id/questions`
- **Méthode**: `POST`
- **Description**: Ajoute une question à un quiz existant.

#### Paramètres d'entrée

- **URL**:
  - `id`: L'ID du quiz.
- **Corps**: `CreateQuestionDto`.

#### Réponse

- **Succès**:

  - **Code**: 201
  - **Corps**:
    ```json
    {
      "id": "new-question-id",
      "location": "/api/quiz/:id/questions/new-question-id"
    }
    ```

- **Erreur**:
  - **Code**: 404
  - **Corps**:
    ```json
    {
      "message": "Quiz not found"
    }
    ```

#### Validations

- Vérifie que l'utilisateur est authentifié.
- Vérifie que le quiz existe.

#### f. **Update Question**

- **Endpoint**: `/api/quiz/:quizId/questions/:questionId`
- **Méthode**: `PUT`
- **Description**: Met à jour une question spécifique d'un quiz.

#### Paramètres d'entrée

- **URL**:
  - `quizId`: L'ID du quiz.
  - `questionId`: L'ID de la question.
- **Corps**: Les données de mise à jour de la question.

#### Réponse

- **Succès**:

  - **Code**: 204
  - **Corps**: Aucun.

- **Erreur**:
  - **Code**: 404
  - **Corps**:
    ```json
    {
      "message": "Question not found"
    }
    ```

#### Validations

- Vérifie que l'utilisateur est authentifié.
