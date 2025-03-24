const { validateEmail, validatePassword, validateUsername } = require('../../utils/validators');

// validation email
// validation password
// validation username  

describe('Validators', () => {
  // Tests pour validateEmail
  describe('validateEmail', () => {
    test('doit valider un email correct', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    test('doit rejeter un email invalide', () => {
      expect(validateEmail('userexample.com')).toBe(false); // Manque @
      expect(validateEmail('user@')).toBe(false); // Manque domaine
      expect(validateEmail('@domain.com')).toBe(false); // Manque user
      expect(validateEmail('user@domain')).toBe(false); // Manque TLD
      expect(validateEmail('')).toBe(false); // Vide
    });
  });

  // Tests pour validatePassword
  describe('validatePassword', () => {
    test('doit valider un mot de passe correct', () => {
      expect(validatePassword('Password123')).toBe(true);
      expect(validatePassword('secureP@ss')).toBe(true);
      expect(validatePassword('longpassword123')).toBe(true);
      expect(validatePassword('P@ssw0rd')).toBe(true);
    });

    test('doit rejeter un mot de passe invalide', () => {
      expect(validatePassword('short')).toBe(false); // Trop court
      expect(validatePassword('nodigits')).toBe(false); // Pas de chiffre/caractère spécial
      expect(validatePassword('12345678')).toBe(false); // Pas de lettre
      expect(validatePassword('')).toBe(false); // Vide
    });
  });

  // Tests pour validateUsername
  describe('validateUsername', () => {
    test('doit valider un nom d\'utilisateur correct', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('john_doe')).toBe(true);
      expect(validateUsername('username')).toBe(true);
    });

    test('doit rejeter un nom d\'utilisateur invalide', () => {
      expect(validateUsername('ab')).toBe(false); // Trop court
      expect(validateUsername('user name')).toBe(false); // Contient un espace
      expect(validateUsername('user@name')).toBe(false); // Caractère spécial non autorisé
      expect(validateUsername('')).toBe(false); // Vide
      expect(validateUsername('a'.repeat(31))).toBe(false); // Trop long
    });
  });
}); 