/**
 * Valide le format d'une adresse email
 * @param {string} email - L'adresse email à valider
 * @returns {boolean} - true si l'email est valide, false sinon
 */
exports.validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valide le format d'un mot de passe
 * @param {string} password - Le mot de passe à valider
 * @returns {boolean} - true si le mot de passe est valide, false sinon
 */
exports.validatePassword = (password) => {
    // Au moins 8 caractères
    if (password.length < 8) return false;

    // Au moins une lettre
    if (!/[a-zA-Z]/.test(password)) return false;

    // Au moins un chiffre ou un caractère spécial
    if (!/[\d#?!@$%^&*-]/.test(password)) return false;

    return true;
};

/**
 * Valide le format d'un nom d'utilisateur
 * @param {string} username - Le nom d'utilisateur à valider
 * @returns {boolean} - true si le nom d'utilisateur est valide, false sinon
 */
exports.validateUsername = (username) => {
    // Entre 3 et 30 caractères, lettres, chiffres et underscores uniquement
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
};
