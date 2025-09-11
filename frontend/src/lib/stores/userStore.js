// frontend/src/lib/stores/userStore.js - Correction complète

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import authApi from '../services/authApi.js'; // Import par défaut

function createUserStore() {
    const { subscribe, set, update } = writable(null);

    return {
        subscribe,
        set, // Exposer la méthode set
        update, // Exposer la méthode update
        
        // Initialiser le store utilisateur
        async init() {
            if (!browser) return;
            
            const token = authApi.getToken();
            if (!token) return;

            try {
                const response = await authApi.getCurrentUser();
                if (response.success && response.data?.user) {
                    set(response.data.user);
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Erreur d\'initialisation utilisateur:', error);
                this.logout();
            }
        },

        // Connexion utilisateur
        async login(credentials) {
            try {
                const response = await authApi.login(credentials);
                
                if (response.success && response.data?.accessToken) {
                    set(response.data.user);
                    return { success: true, user: response.data.user };
                } else {
                    return { success: false, message: response.message || 'Erreur de connexion' };
                }
            } catch (error) {
                console.error('Erreur de connexion:', error);
                return { success: false, message: error.message || 'Erreur de connexion' };
            }
        },

        // Inscription utilisateur
        async register(userData) {
            try {
                let response;
                
                // Choisir le bon endpoint selon le type d'utilisateur
                switch (userData.role) {
                    case 'startup':
                        response = await authApi.registerStartup(userData);
                        break;
                    case 'investor':
                        response = await authApi.registerInvestor(userData);
                        break;
                    default:
                        response = await authApi.registerStudent(userData);
                        break;
                }
                
                if (response.success && response.data?.accessToken) {
                    set(response.data.user);
                    return { success: true, user: response.data.user };
                } else {
                    return { success: false, message: response.message || 'Erreur d\'inscription' };
                }
            } catch (error) {
                console.error('Erreur d\'inscription:', error);
                return { success: false, message: error.message || 'Erreur d\'inscription' };
            }
        },

        // Déconnexion
        async logout() {
            if (browser) {
                try {
                    await authApi.logout();
                } catch (error) {
                    console.warn('Erreur lors de la déconnexion:', error);
                }
                set(null);
                goto('/');
            }
        },

        // Mettre à jour les données utilisateur dans le store
        updateUserData(newUserData) {
            update(currentUser => {
                if (!currentUser) return newUserData;
                
                return {
                    ...currentUser,
                    ...newUserData,
                    // Assurer que certains champs critiques ne sont pas écrasés
                    id: currentUser.id,
                    email: newUserData.email || currentUser.email,
                    role: currentUser.role,
                    createdAt: currentUser.createdAt,
                };
            });
        },

        // Mettre à jour le profil via l'API
        async updateProfile(updateData) {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser?.id) {
                    throw new Error('Utilisateur non connecté');
                }

                const response = await authApi.updateProfile(currentUser.id, updateData);
                
                if (response.success) {
                    // Utiliser la méthode updateUserData plutôt que set directement
                    this.updateUserData(response.data.user);
                    return { success: true, user: response.data.user };
                } else {
                    return { success: false, message: response.message || 'Erreur de mise à jour' };
                }
            } catch (error) {
                console.error('Erreur de mise à jour du profil:', error);
                return { success: false, message: error.message || 'Erreur de mise à jour' };
            }
        },

        // Changer le mot de passe
        async changePassword(currentPassword, newPassword) {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser?.id) {
                    throw new Error('Utilisateur non connecté');
                }

                const response = await authApi.changePassword(currentUser.id, {
                    currentPassword,
                    newPassword
                });
                
                if (response.success) {
                    return { success: true };
                } else {
                    return { success: false, message: response.message || 'Erreur de changement de mot de passe' };
                }
            } catch (error) {
                console.error('Erreur de changement de mot de passe:', error);
                return { success: false, message: error.message || 'Erreur de changement de mot de passe' };
            }
        },

        // Upload avatar
        async uploadAvatar(file) {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser?.id) {
                    throw new Error('Utilisateur non connecté');
                }

                const response = await authApi.uploadAvatar(currentUser.id, file);
                
                if (response.success) {
                    this.updateUserData(response.data.user);
                    return { success: true, avatarUrl: response.data.avatarUrl };
                } else {
                    return { success: false, message: response.message || 'Erreur d\'upload' };
                }
            } catch (error) {
                console.error('Erreur d\'upload avatar:', error);
                return { success: false, message: error.message || 'Erreur d\'upload' };
            }
        },

        // Vérifier si l'utilisateur est connecté
        isLoggedIn() {
            return authApi.isAuthenticated();
        },

        // Obtenir le token d'authentification
        getToken() {
            return authApi.getToken();
        },

        // Rafraîchir les données utilisateur depuis l'API
        async refresh() {
            try {
                const response = await authApi.getCurrentUser();
                if (response.success && response.data?.user) {
                    set(response.data.user);
                    return { success: true, user: response.data.user };
                } else {
                    this.logout();
                    return { success: false, message: 'Session expirée' };
                }
            } catch (error) {
                console.error('Erreur de rafraîchissement:', error);
                this.logout();
                return { success: false, message: error.message };
            }
        }
    };
}

// Créer et exporter le store
export const userStore = createUserStore();

// Helper pour obtenir l'utilisateur actuel de manière synchrone
export function getCurrentUser() {
    let user = null;
    userStore.subscribe(value => user = value)();
    return user;
}

// Helper pour vérifier les permissions
export function hasRole(requiredRole) {
    const user = getCurrentUser();
    return user && user.role === requiredRole;
}

export function hasAnyRole(roles) {
    const user = getCurrentUser();
    return user && roles.includes(user.role);
}