import * as admin from 'firebase-admin';
import { AuthMiddleware } from '../../src/auth/auth.middleware';

// Mock pour le middleware d'authentification
export class MockAuthMiddleware {
  static injectMockUser(app, mockUser = { uid: 'test-user-id', email: 'test@example.com' }) {
    const originalMiddleware = AuthMiddleware.prototype.use;

    // Mock the use method of AuthMiddleware
    jest.spyOn(AuthMiddleware.prototype, 'use').mockImplementation(async (req, res, next) => {
      req.user = mockUser; // Inject mock user

      // Vérifiez si req.headers est un objet compatible
      if (req.headers && typeof req.headers === 'object') {
        req.headers['authorization'] = `Bearer mock-token`; // Ajoutez l'en-tête directement
      }

      console.log('Mock user injected:', req.user); // Debug log
      await next();
    });

    return {
      restore: () => {
        AuthMiddleware.prototype.use = originalMiddleware;
      },
    };
  }
}

// Fonction pour initialiser Firebase uniquement une fois
let isFirebaseInitialized = false;

export const initializeFirebaseForTests = () => {
  if (!isFirebaseInitialized) {
    try {
      if (admin.apps.length > 0) {
        console.log('Firebase app déjà initialisée.');
        return; // Utiliser l'application existante
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: "quizz-9cb56",
          clientEmail: 'firebase-adminsdk-fbsvc@quizz-9cb56.iam.gserviceaccount.com',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7paM0XzrGtKVj\n6X6jE98LnK+zUzcUKnvui3MtBeOu9xCjcifKLTQAXci5i3dhZ898i3ACcq7Yv2Rm\n/Ui42zrLEFOsfClOTDWYISjRozRKN1yIIoorsaFvnl1fhXPKgFdXaFMcKxP1zNMF\n09gIeBOwo6Jdm/g053w9zUhRLqzoCVaUb/GWmtCevqdFuOod9HeDdhRGlcGVyP7x\nHaaFLj9p4mqDKbr05fgJ1di3wLxVkF5lO9TFxgyVcBrlk9uNQ5SOIKvu9HM0EBMM\nD4Z9j2zbwAghICQci7V4XvqsT0rMCHFSYbG56c72lT9ClGffgbo/iFOo+S+W1jm+\nF/5yU3XTAgMBAAECggEAMZ0p+b70G3XIBRLHmPa4EqnrCs8F0R8qhXf5i/3ypWBN\n1elo+9vX1AD4AZcOiYKZKaT0iLEp6cUxFsoBYF8WvHokpYZupXUg9ohN8p/kQ3s/\ny/7V6Zedx5VnusneQ7yLW2EKGHiLXoI5iWDpzdNx4VJiq72BcvuBrhWI+W4N6YuZ\nRzt9CMfLx2YyzYCxHQ7z+Z4Gw7O5av2bIe5EfoNPPPLmuV7ZL5GxKUaFeWaAH3hi\nYQ9AVt/CXmlIjlN7ZqoIKHH8u0CNl48ZtCqr57OFVvFT3hl6mbhoNmgpJ/5cAumv\npmuGA37sX5mZK2Ya37AhDZggEk+TsYdlsrD2++7qAQKBgQD/V22AXqUKs40f+cTS\nJBCZhk6YoIIb1BZPENdO/oC00vvNIjUAZH0aZb6uKhFlji3wevHjdPsTZpvpelqK\nsT7HutliOBBUtaX2De+IoboWOSlT8Od9XwUo6+AEgRIIUNF6Q/fneWFMqQeEvErN\nhxiLQ2VyAWumvpgNezwyWpEw8QKBgQC8IYTceOSvtfqJmxbcrYnKeqSFyZ1/9GqA\nIlKJ7DTIwPHoIUmNM9L9Y+r7R02SuzQSS+POPaUEFV0w1WrP4dkWTZLaa4aeQXor\nIJJmEUOJEOE9iKqxzY4Vqr9DdoibGux3pUuWBsiR7QWuKLELfGoePEvPTI01n1kD\ndGZo294TAwKBgQDCCyLAByzNMR3yStF0EMw8n4BjJLc7hrVdaKL2+Rm+UQfiIDi/\nD56yzNdXa8jEsIPg2M2x2VhkqfmaOM1N0Nyw1CIXLhvbBCAXGQgLgTv1X4M0s0J4\nWBmHu5kGUz/s6d4HWFewpOF4bIu2J5GBF0Vjr9gMB2BT20uaEyjv6zujQQKBgHt9\nmSPLq3l3f8SR7BjhRQCHLrWvWVZjjwEbBokIZsGcfW49Y3VvnkC8NMPK0y3M+mpE\nLH310vryNyDWBm38ty4/r3T2fgAlxNbIY7DiBi3TybZFnp5l6q1oTnIvPY5qxuvm\nsc4CF+hJ6J+gkE6U1WeRdsXVXx/iwGBXKN4N7SEXAoGAdSLkJOnQENohb11yapuR\n8v1UG110tywNtB+qveHOdQmyLdHbUEqI/R99JA7D5BWrTlk2wrF6paJCf8fcQiwY\nOwEdUBhV5pFPbOHPX63G/csdd2bBPs9OCwZOLz5wMUV+EShyKhMO6+09u4v8u0RC\nU1/99UcoX/LNTPzEFGPgW30=\n-----END PRIVATE KEY-----\n',        }),
      });

      console.log('Firebase initialisé avec succès pour les tests.');
      isFirebaseInitialized = true;
    } catch (error) {
      console.log('Erreur lors de l\'initialisation de Firebase:', error);
    }
  } else {
    console.log('Firebase déjà initialisé.');
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

  console.log('Firestore mocké avec succès.');

  return {
    collection: mockCollection,
    mockDoc,
    mockGet,
    mockSet,
    mockUpdate,
    mockDelete,
  };
};
