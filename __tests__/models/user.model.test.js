const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/user.model');

//creation user 
// validation des données
// doublon email

// Augmenter le timeout par défaut à 30 secondes
jest.setTimeout(30000);

describe('User Model Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  test('doit créer et sauvegarder un utilisateur avec succès', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123$',
      username: 'testuser'
    };
    const user = new User(userData);
    const savedUser = await user.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.username).toBe(userData.username);
    // Le mot de passe doit être hashé et donc différent de l'original
    expect(savedUser.password).not.toBe(userData.password);
    expect(savedUser.accountType).toBe('free'); // Valeur par défaut
    expect(savedUser.role).toBe('user'); // Valeur par défaut
  });

  test('doit échouer pour un email invalide', async () => {
    const userWithInvalidEmail = new User({
      email: 'invalidemail',
      password: 'Password123$',
      username: 'testuser'
    });

    let error;
    try {
      await userWithInvalidEmail.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  test('doit empêcher la création de deux utilisateurs avec le même email', async () => {
    // Premier utilisateur
    const userData = {
      email: 'duplicate@example.com',
      password: 'Password123$',
      username: 'user1'
    };
    await new User(userData).save();
    
    // Deuxième utilisateur avec même email
    const duplicateUser = new User({
      email: 'duplicate@example.com',
      password: 'Password456$',
      username: 'user2'
    });
    
    let error;
    try {
      await duplicateUser.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // Code erreur MongoDB pour duplicate key
  });
}); 