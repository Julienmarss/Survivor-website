// frontend/src/lib/stores/userStore.js
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { authApi } from '../services/authApi.js';

// Clé pour le localStorage
const USER_STORAGE_KEY = 'jeb_user_data';

// Store initial
const initialUser = null;

// Créer le store writable
const { subscribe, set, update } = writable(initialUser);

// Fonctions utilitaires pour le localStorage (seulement côté client)
const storage = {
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

    loadUser: () => {
        if (!browser) return null;
        try {
            const userData = localStorage.getItem(USER_STORAGE_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.warn('Erreur lors du chargement des données utilisateur:', error);
            localStorage.removeItem(USER_STORAGE_KEY);
            return null;
        }
    },

    clear: () => {
        if (!browser) return;
        try {
            localStorage.removeItem(USER_STORAGE_KEY);
        } catch (error) {
            console.warn('Erreur lors du nettoyage du localStorage:', error);
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
        const token = authApi.getToken();

        if (savedUser && token) {
            try {
                // Vérifier si le token est toujours valide
                const response = await authApi.getCurrentUser();
                
                if (response.success && response.data.user) {
                    // Mettre à jour avec les données fraîches
                    set(response.data.user);
                    storage.saveUser(response.data.user);
                    console.log('User session restored:', response.data.user);
                } else {
                    // Token invalide, nettoyer
                    this.logout();
                }
            } catch (error) {
                console.warn('Failed to restore user session:', error);
                // Token invalide, nettoyer
                this.logout();
            }
        } else if (savedUser) {
            // Données utilisateur sans token valide (cas d'erreur)
            set(savedUser);
        }
    },

    /**
     * Connecter un utilisateur
     */
    async login(email, password) {
        try {
            const response = await authApi.login({ email, password });

            if (response.success && response.data.user && response.data.accessToken) {
                // Sauvegarder les données
                storage.saveUser(response.data.user);
                
                // Mettre à jour le store
                set(response.data.user);

                console.log('Utilisateur connecté:', response.data.user);
                return { success: true, user: response.data.user };
            } else {
                console.error('Login failed: Invalid response format');
                return { success: false, error: response.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    },

    /**
     * Inscrire un utilisateur standard
     */
    async registerUser(userData) {
        try {
            const response = await authApi.registerUser(userData);

            if (response.success && response.data.user && response.data.accessToken) {
                storage.saveUser(response.data.user);
                set(response.data.user);
                console.log('Utilisateur inscrit:', response.data.user);
                return { success: true, user: response.data.user };
            } else {
                return { success: false, error: response.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription utilisateur:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    },

    /**
     * Inscrire une startup
     */
    async registerStartup(startupData) {
        try {
            const response = await authApi.registerStartup(startupData);

            if (response.success && response.data.user && response.data.accessToken) {
                storage.saveUser(response.data.user);
                set(response.data.user);
                console.log('Startup inscrite:', response.data.user);
                return { success: true, user: response.data.user };
            } else {
                return { success: false, error: response.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription startup:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    },

    /**
     * Inscrire un investisseur
     */
    async registerInvestor(investorData) {
        try {
            const response = await authApi.registerInvestor(investorData);

            if (response.success && response.data.user && response.data.accessToken) {
                storage.saveUser(response.data.user);
                set(response.data.user);
                console.log('Investisseur inscrit:', response.data.user);
                return { success: true, user: response.data.user };
            } else {
                return { success: false, error: response.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription investisseur:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    },

    /**
     * Inscrire un étudiant
     */
    async registerStudent(studentData) {
        try {
            const response = await authApi.registerStudent(studentData);

            if (response.success && response.data.user && response.data.accessToken) {
                storage.saveUser(response.data.user);
                set(response.data.user);
                console.log('Étudiant inscrit:', response.data.user);
                return { success: true, user: response.data.user };
            } else {
                return { success: false, error: response.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription étudiant:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    },

    /**
     * Déconnecter l'utilisateur
     */
    async logout() {
        try {
            await authApi.logout();
        } catch (error) {
            console.warn('Logout API call failed:', error);
        }

        // Nettoyer le localStorage et le store
        storage.clear();
        set(null);
        console.log('Utilisateur déconnecté');
    },

    /**
     * Mettre à jour les données utilisateur
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
     */
    setUser(userData, token = null) {
        storage.saveUser(userData);
        if (token) {
            authApi.setToken(token);
        }
        set(userData);
    },

    /**
     * Vérifier si l'utilisateur est connecté
     */
    async isLoggedIn() {
        const token = authApi.getToken();
        if (!token) return false;

        try {
            const response = await authApi.getCurrentUser();
            return response.success && response.data.user;
        } catch (error) {
            return false;
        }
    },

    /**
     * Obtenir le token actuel
     */
    getToken() {
        return authApi.getToken();
    },

    /**
     * Rafraîchir les données utilisateur depuis l'API
     */
    async refresh() {
        try {
            const response = await authApi.getCurrentUser();
            if (response.success && response.data.user) {
                storage.saveUser(response.data.user);
                set(response.data.user);
            } else {
                // Token invalide, déconnecter
                this.logout();
            }
        } catch (error) {
            console.warn('Failed to refresh user data:', error);
            this.logout();
        }
    },

    /**
     * Mettre à jour le profil utilisateur
     */
    async updateProfile(profileData) {
        try {
            const response = await authApi.updateProfile(profileData);
            
            if (response.success && response.data.user) {
                storage.saveUser(response.data.user);
                set(response.data.user);
                return { success: true, user: response.data.user };
            } else {
                return { success: false, error: response.message || 'Update failed' };
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            return { success: false, error: error.message || 'Update failed' };
        }
    }
};

export { userStore };

// Export par défaut pour faciliter l'import
export default userStore;