import { writable, derived } from 'svelte/store';

// Store principal pour les conversations
export const conversations = writable([]);

// Store pour les messages de la conversation sélectionnée
export const messages = writable([]);

// Store pour la conversation actuellement sélectionnée
export const selectedConversation = writable(null);

// Store pour les utilisateurs en ligne
export const onlineUsers = writable(new Set());

// Store pour les indicateurs de frappe
export const typingUsers = writable({});

// Store pour l'état de connexion WebSocket
export const socketConnected = writable(false);

// Store pour les utilisateurs disponibles (pour créer des conversations)
export const availableUsers = writable([]);

// Derived store pour compter les messages non lus
export const unreadCount = derived(
    conversations,
    ($conversations) => {
        return $conversations.reduce((total, conversation) => {
            return total + (conversation.unreadCount || 0);
        }, 0);
    }
);

// Derived store pour les conversations triées par dernière activité
export const sortedConversations = derived(
    conversations,
    ($conversations) => {
        return [...$conversations].sort((a, b) => {
            const dateA = new Date(a.updatedAt);
            const dateB = new Date(b.updatedAt);
            return dateB - dateA;
        });
    }
);

// Actions pour gérer les stores
export const messagingActions = {
    // Ajouter une nouvelle conversation
    addConversation: (conversation) => {
        conversations.update(convs => [conversation, ...convs]);
    },

    // Mettre à jour une conversation existante
    updateConversation: (conversationId, updates) => {
        conversations.update(convs =>
            convs.map(conv =>
                conv.id === conversationId ? { ...conv, ...updates } : conv
            )
        );
    },

    // Ajouter un nouveau message
    addMessage: (message) => {
        messages.update(msgs => [...msgs, message]);

        // Mettre à jour la dernière activité de la conversation
        conversations.update(convs =>
            convs.map(conv =>
                conv.id === message.conversationId
                    ? { ...conv, lastMessage: message, updatedAt: new Date() }
                    : conv
            )
        );
    },

    // Mettre à jour un message existant
    updateMessage: (messageId, updates) => {
        messages.update(msgs =>
            msgs.map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
            )
        );
    },

    // Supprimer un message
    deleteMessage: (messageId) => {
        messages.update(msgs =>
            msgs.map(msg =>
                msg.id === messageId ? { ...msg, isDeleted: true } : msg
            )
        );
    },

    // Marquer une conversation comme lue
    markAsRead: (conversationId) => {
        conversations.update(convs =>
            convs.map(conv =>
                conv.id === conversationId
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        );
    },

    // Ajouter un utilisateur à la liste des utilisateurs qui tapent
    addTypingUser: (conversationId, userId) => {
        typingUsers.update(users => ({
            ...users,
            [conversationId]: [...(users[conversationId] || []), userId]
        }));
    },

    // Retirer un utilisateur de la liste des utilisateurs qui tapent
    removeTypingUser: (conversationId, userId) => {
        typingUsers.update(users => ({
            ...users,
            [conversationId]: (users[conversationId] || []).filter(id => id !== userId)
        }));
    },

    // Marquer un utilisateur comme en ligne
    setUserOnline: (userId) => {
        onlineUsers.update(users => new Set([...users, userId]));
    },

    // Marquer un utilisateur comme hors ligne
    setUserOffline: (userId) => {
        onlineUsers.update(users => {
            const newUsers = new Set(users);
            newUsers.delete(userId);
            return newUsers;
        });
    },

    // Réinitialiser tous les stores
    reset: () => {
        conversations.set([]);
        messages.set([]);
        selectedConversation.set(null);
        onlineUsers.set(new Set());
        typingUsers.set({});
        socketConnected.set(false);
        availableUsers.set([]);
    }
};