const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/user.model');
const jwt = require('jsonwebtoken');
const cacheService = require('../../services/cache.service');

// register
// login
// logout
// forgot password
// reset password
// change password  


// Augmenter le timeout par défaut à 30 secondes
jest.setTimeout(30000);

describe('Auth Routes', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    // Fermer la connexion Redis pour permettre la sortie gracieuse
    if (cacheService.client) {
      await cacheService.client.quit();
    }
    
    await mongoose.disconnect();
    await mongoServer.stop();
    
    // Donner un peu de temps pour la fermeture de toutes les connexions
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    test('doit enregistrer un nouvel utilisateur', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123$',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Inscription réussie');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.token).toBeDefined();

      // Vérifier que l'utilisateur est bien en base
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(userData.email);
    });

    test('doit rejeter un enregistrement avec un mot de passe invalide', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'short', // Trop court
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('mot de passe');
    });
  });

  describe('POST /api/auth/login', () => {
    test('doit connecter un utilisateur existant', async () => {
      // Créer un utilisateur
      const userData = {
        email: 'test@example.com',
        password: 'Password123$',
        username: 'testuser'
      };
      const user = new User(userData);
      await user.save();

      // Tentative de connexion
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Connexion réussie');
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();

      // Vérifier que le token est valide
      const decodedToken = jwt.verify(
        response.body.token,
        process.env.JWT_SECRET || 'your-secret-key'
      );
      expect(decodedToken.email).toBe(userData.email);
    });

    test('doit rejeter une connexion avec des identifiants incorrects', async () => {
      // Créer un utilisateur
      const userData = {
        email: 'test@example.com',
        password: 'Password123$',
        username: 'testuser'
      };
      const user = new User(userData);
      await user.save();

      // Tentative de connexion avec mauvais mot de passe
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPassword123$'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('incorrect');
    });
  });
}); 