import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';
const WS_URL = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

class MessagingService {
    constructor() {
        this.socket = null;
        this.token = null;
    }

    setAuthToken(token) {
        this.token = token;
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Une erreur est survenue');
        }
        return response.json();
    }

    // === API REST ===

    async createConversation(conversationData) {
        const response = await fetch(`${API_BASE_URL}/messaging/conversations`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(conversationData)
        });
        return this.handleResponse(response);
    }

    async getUserConversations() {
        const response = await fetch(`${API_BASE_URL}/messaging/conversations`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getConversationMessages(conversationId, page = 1, limit = 50) {
        const response = await fetch(
            `${API_BASE_URL}/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
            { headers: this.getAuthHeaders() }
        );
        return this.handleResponse(response);
    }

    async sendMessage(messageData) {
        const response = await fetch(`${API_BASE_URL}/messaging/messages`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(messageData)
        });
        return this.handleResponse(response);
    }

    async editMessage(messageId, content) {
        const response = await fetch(`${API_BASE_URL}/messaging/messages/${messageId}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return this.handleResponse(response);
    }

    async deleteMessage(messageId) {
        const response = await fetch(`${API_BASE_URL}/messaging/messages/${messageId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async searchUsers(query) {
        const response = await fetch(
            `${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`,
            { headers: this.getAuthHeaders() }
        );
        return this.handleResponse(response);
    }

    // === WebSocket ===

    initSocket(userId) {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(WS_URL, {
            auth: {
                token: this.token
            }
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connecté');
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

    sendMessageSocket(messageData) {
        if (this.socket) {
            this.socket.emit('send-message', messageData);
        }
    }

    joinConversation(conversationId) {
        if (this.socket) {
            this.socket.emit('join-conversation', { conversationId });
        }
    }

    leaveConversation(conversationId) {
        if (this.socket) {
            this.socket.emit('leave-conversation', { conversationId });
        }
    }

    sendTyping(conversationId, userId, isTyping) {
        if (this.socket) {
            this.socket.emit('typing', { conversationId, userId, isTyping });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // === Utilitaires ===

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

    formatConversationName(conversation, currentUserId) {
        if (conversation.type === 'group') {
            return conversation.name || 'Conversation de groupe';
        }

        const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
        return otherParticipant ? otherParticipant.name : 'Conversation';
    }

    isUserOnline(userId, onlineUsers) {
        return onlineUsers.has(userId);
    }

    generateAvatar(name) {
        if (!name) return '';

        const initials = name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);

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

export const messagingService = new MessagingService();