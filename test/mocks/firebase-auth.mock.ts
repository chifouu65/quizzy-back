import * as admin from 'firebase-admin';
import { AuthMiddleware } from '../../src/auth/auth.middleware';

// Mock pour le middleware d'authentification
export class MockAuthMiddleware {
  static injectMockUser(app, mockUserId = 'test-user-id') {
    // Trouver le middleware d'authentification dans l'application
    const originalMiddleware = app
      .get<AuthMiddleware>(AuthMiddleware)
      .use.bind(app.get<AuthMiddleware>(AuthMiddleware));

    // Remplacer la méthode use par une version mockée
    app.get<AuthMiddleware>(AuthMiddleware).use = jest.fn((req, res, next) => {
      // Ajouter un utilisateur mock à la requête
      req.user = {
        uid: mockUserId,
        email: 'test@example.com',
      };
      // Appeler next() pour continuer le flux de la requête
      next();
    });

    return {
      restore: () => {
        app.get<AuthMiddleware>(AuthMiddleware).use = originalMiddleware;
      },
    };
  }
}

// Fonction pour initialiser Firebase uniquement une fois
let isFirebaseInitialized = false;

export const initializeFirebaseForTests = () => {
  if (!isFirebaseInitialized) {
    // Supprimer toutes les applications existantes
    try {
      if (admin.apps.length) {
        admin.apps.forEach((app) => app?.delete());
      }
    } catch (error) {
      console.log('Erreur lors de la suppression des apps Firebase:', error);
    }

    // Initialiser une nouvelle application avec des informations fictives
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: 'test-project',
        clientEmail: 'test@example.com',
        // Structure factice qui imite privateKey pour passer la validation
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBA...test-key\n-----END PRIVATE KEY-----\n',
      } as any),
    });

    isFirebaseInitialized = true;
  }
};

// Mock pour Firestore
export const mockFirestore = () => {
  const mockDoc = {
    id: 'mock-id',
    data: jest.fn().mockReturnValue({
      title: 'Mock Quiz',
      description: 'Mock Description',
      ownerId: 'test-user-id',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      questions: [],
    }),
    exists: true,
  };

  const mockGet = jest.fn().mockResolvedValue(mockDoc);
  const mockSet = jest.fn().mockResolvedValue(true);
  const mockUpdate = jest.fn().mockResolvedValue(true);
  const mockDelete = jest.fn().mockResolvedValue(true);

  const mockWhere = jest.fn().mockReturnThis();
  const mockCollection = jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
      delete: mockDelete,
    }),
    where: mockWhere,
    get: jest.fn().mockResolvedValue({
      docs: [mockDoc],
    }),
  });

  // Remplacer la méthode collection de Firestore
  jest.spyOn(admin.firestore(), 'collection').mockImplementation(mockCollection);

  return {
    collection: mockCollection,
    mockDoc,
    mockGet,
    mockSet,
    mockUpdate,
    mockDelete,
  };
}; 