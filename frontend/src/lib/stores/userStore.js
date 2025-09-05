import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// Interface pour typer l'utilisateur (optionnel en JavaScript)
/**
 * @typedef {Object} User
 * @property {string} id - ID de l'utilisateur
 * @property {string} email - Email de l'utilisateur
 * @property {string} [firstName] - Prénom
 * @property {string} [lastName] - Nom
 * @property {string} [name] - Nom complet
 * @property {string} [first_name] - Prénom (format alternatif)
 * @property {string} [last_name] - Nom (format alternatif)
 * @property {string} [prenom] - Prénom (format français)
 * @property {string} [nom] - Nom (format français)
 * @property {string} [role] - Rôle de l'utilisateur
 * @property {boolean} [isAdmin] - Statut administrateur
 * @property {string} [avatar] - URL de l'avatar
 * @property {string} [phone] - Téléphone
 * @property {Date} [createdAt] - Date de création
 * @property {Date} [lastLogin] - Dernière connexion
 */

// Clé pour le localStorage
const USER_STORAGE_KEY = 'jeb_user_data';
const TOKEN_STORAGE_KEY = 'jeb_auth_token';

// Store initial
const initialUser = null;

// Créer le store writable
const { subscribe, set, update } = writable(initialUser);

// Fonctions utilitaires pour le localStorage (seulement côté client)
const storage = {
    /**
     * Sauvegarder les données utilisateur
     * @param {User|null} userData
     */
    saveUser: (userData) => {
        if (!browser) return;
        try {
            if (userData) {
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
            } else {
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde des données utilisateur:', error);
        }
    },

    /**
     * Charger les données utilisateur
     * @returns {User|null}
     */
    loadUser: () => {
        if (!browser) return null;
        try {
            const userData = localStorage.getItem(USER_STORAGE_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.warn('Erreur lors du chargement des données utilisateur:', error);
            // Nettoyer les données corrompues
            localStorage.removeItem(USER_STORAGE_KEY);
            return null;
        }
    },

    /**
     * Sauvegarder le token d'authentification
     * @param {string|null} token
     */
    saveToken: (token) => {
        if (!browser) return;
        try {
            if (token) {
                localStorage.setItem(TOKEN_STORAGE_KEY, token);
            } else {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde du token:', error);
        }
    },

    /**
     * Charger le token d'authentification
     * @returns {string|null}
     */
    loadToken: () => {
        if (!browser) return null;
        try {
            return localStorage.getItem(TOKEN_STORAGE_KEY);
        } catch (error) {
            console.warn('Erreur lors du chargement du token:', error);
            return null;
        }
    },

    /**
     * Nettoyer tout le localStorage
     */
    clear: () => {
        if (!browser) return;
        try {
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch (error) {
            console.warn('Erreur lors du nettoyage du localStorage:', error);
        }
    }
};

// API Mock (remplace par tes vraies API calls)
const api = {
    /**
     * Vérifier si l'utilisateur est toujours connecté
     * @param {string} token
     * @returns {Promise<User|null>}
     */
    async verifyToken(token) {
        try {
            // Remplace par ton endpoint d'API réel
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.warn('Erreur lors de la vérification du token:', error);
            return null;
        }
    },

    /**
     * Connecter un utilisateur
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{user: User, token: string}|null>}
     */
    async login(email, password) {
        try {
            // Remplace par ton endpoint d'API réel
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return null;
        }
    },

    /**
     * Déconnecter un utilisateur
     * @param {string} token
     */
    async logout(token) {
        try {
            // Remplace par ton endpoint d'API réel
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.warn('Erreur lors de la déconnexion:', error);
        }
    }
};

// Fonctions du store
const userStore = {
    // Méthode de souscription standard
    subscribe,

    /**
     * Initialiser le store (à appeler au démarrage de l'app)
     */
    async init() {
        if (!browser) return;

        const savedUser = storage.loadUser();
        const savedToken = storage.loadToken();

        if (savedUser && savedToken) {
            // Vérifier si le token est toujours valide
            const verifiedUser = await api.verifyToken(savedToken);

            if (verifiedUser) {
                // Mettre à jour avec les données fraîches
                set(verifiedUser);
                storage.saveUser(verifiedUser);
            } else {
                // Token invalide, nettoyer
                this.logout();
            }
        } else if (savedUser) {
            // Données utilisateur sans token (cas d'erreur)
            set(savedUser);
        }
    },

    /**
     * Connecter un utilisateur
     * @param {string} email
     * @param {string} password
     * @returns {Promise<boolean>}
     */
    async login(email, password) {
        try {
            const result = await api.login(email, password);

            if (result && result.user && result.token) {
                // Sauvegarder les données
                storage.saveUser(result.user);
                storage.saveToken(result.token);

                // Mettre à jour le store
                set(result.user);

                console.log('Utilisateur connecté:', result.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return false;
        }
    },

    /**
     * Déconnecter l'utilisateur
     */
    async logout() {
        const token = storage.loadToken();

        // Appeler l'API de déconnexion si on a un token
        if (token) {
            await api.logout(token);
        }

        // Nettoyer le localStorage
        storage.clear();

        // Réinitialiser le store
        set(null);

        console.log('Utilisateur déconnecté');
    },

    /**
     * Mettre à jour les données utilisateur
     * @param {Partial<User>} userData
     */
    updateUser(userData) {
        update(currentUser => {
            if (currentUser) {
                const updatedUser = { ...currentUser, ...userData };
                storage.saveUser(updatedUser);
                return updatedUser;
            }
            return currentUser;
        });
    },

    /**
     * Définir un utilisateur (pour les cas de connexion externe)
     * @param {User} userData
     * @param {string} [token]
     */
    setUser(userData, token = null) {
        storage.saveUser(userData);
        if (token) {
            storage.saveToken(token);
        }
        set(userData);
    },

    /**
     * Vérifier si l'utilisateur est connecté
     * @returns {Promise<boolean>}
     */
    async isLoggedIn() {
        const token = storage.loadToken();
        if (!token) return false;

        const user = await api.verifyToken(token);
        return !!user;
    },

    /**
     * Obtenir le token actuel
     * @returns {string|null}
     */
    getToken() {
        return storage.loadToken();
    },

    /**
     * Rafraîchir les données utilisateur depuis l'API
     */
    async refresh() {
        const token = storage.loadToken();
        if (!token) return;

        const freshUserData = await api.verifyToken(token);
        if (freshUserData) {
            storage.saveUser(freshUserData);
            set(freshUserData);
        } else {
            // Token invalide, déconnecter
            this.logout();
        }
    }
};

export { userStore };

// Export par défaut pour faciliter l'import
export default userStore;