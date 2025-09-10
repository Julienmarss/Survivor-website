import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';
const WS_URL = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

class MessagingService {
    constructor() {
        this.socket = null;
        this.token = null;
    }

    // Initialiser le token d'authentification
    setAuthToken(token) {
        this.token = token;
    }

    // Headers d'authentification
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Gérer les erreurs HTTP
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Une erreur est survenue');
        }
        return response.json();
    }

    // === API REST ===

    // Créer une nouvelle conversation
    async createConversation(conversationData) {
        const response = await fetch(`${API_BASE_URL}/messaging/conversations`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(conversationData)
        });
        return this.handleResponse(response);
    }

    // Récupérer les conversations de l'utilisateur
    async getUserConversations() {
        const response = await fetch(`${API_BASE_URL}/messaging/conversations`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    // Récupérer les messages d'une conversation
    async getConversationMessages(conversationId, page = 1, limit = 50) {
        const response = await fetch(
            `${API_BASE_URL}/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
            { headers: this.getAuthHeaders() }
        );
        return this.handleResponse(response);
    }

    // Envoyer un message
    async sendMessage(messageData) {
        const response = await fetch(`${API_BASE_URL}/messaging/messages`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(messageData)
        });
        return this.handleResponse(response);
    }

    // Modifier un message
    async editMessage(messageId, content) {
        const response = await fetch(`${API_BASE_URL}/messaging/messages/${messageId}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return this.handleResponse(response);
    }

    // Supprimer un message
    async deleteMessage(messageId) {
        const response = await fetch(`${API_BASE_URL}/messaging/messages/${messageId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    // Rechercher des utilisateurs
    async searchUsers(query) {
        const response = await fetch(
            `${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
            { headers: this.getAuthHeaders() }
        );
        return this.handleResponse(response);
    }

    // === WebSocket ===

    // Initialiser la connexion WebSocket
    initSocket(userId) {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(WS_URL, {
            auth: {
                token: this.token
            }
        });

        // Événements de connexion
        this.socket.on('connect', () => {
            console.log('WebSocket connecté');
            // Rejoindre l'utilisateur
            this.socket.emit('join-user', { userId });
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket déconnecté');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Erreur de connexion WebSocket:', error);
        });

        return this.socket;
    }

    // Envoyer un message via WebSocket
    sendMessageSocket(messageData) {
        if (this.socket) {
            this.socket.emit('send-message', messageData);
        }
    }

    // Rejoindre une conversation
    joinConversation(conversationId) {
        if (this.socket) {
            this.socket.emit('join-conversation', { conversationId });
        }
    }

    // Quitter une conversation
    leaveConversation(conversationId) {
        if (this.socket) {
            this.socket.emit('leave-conversation', { conversationId });
        }
    }

    // Indiquer qu'on est en train de taper
    sendTyping(conversationId, userId, isTyping) {
        if (this.socket) {
            this.socket.emit('typing', { conversationId, userId, isTyping });
        }
    }

    // Déconnecter le WebSocket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // === Utilitaires ===

    // Formatter la date d'un message
    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}j`;

        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    }

    // Formatter le nom d'une conversation
    formatConversationName(conversation, currentUserId) {
        if (conversation.type === 'group') {
            return conversation.name || 'Conversation de groupe';
        }

        // Pour une conversation directe, retourner le nom de l'autre participant
        const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
        return otherParticipant ? otherParticipant.name : 'Conversation';
    }

    // Vérifier si un utilisateur est en ligne
    isUserOnline(userId, onlineUsers) {
        return onlineUsers.has(userId);
    }

    // Générer un avatar par défaut basé sur les initiales
    generateAvatar(name) {
        if (!name) return '';

        const initials = name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);

        // Couleurs basées sur la palette fournie
        const colors = [
            '#c174f2', '#cb90f1', '#d5a8f2', '#e4bef8',
            '#f18585', '#f49c9c', '#f6aeae', '#f8cacf'
        ];

        const colorIndex = name.charCodeAt(0) % colors.length;
        const backgroundColor = colors[colorIndex];

        return {
            initials,
            backgroundColor,
            textColor: '#ffffff'
        };
    }

    // Débouncer pour les indicateurs de frappe
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Instance singleton du service
export const messagingService = new MessagingService();