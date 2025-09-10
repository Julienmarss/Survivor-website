<script>
    import { onMount, onDestroy } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { io } from 'socket.io-client';
    import { userStore } from '$lib/stores/userStore.js';
    
    // Import components
    import Sidebar from '$lib/components/messaging/Sidebar.svelte';
    import ChatHeader from '$lib/components/messaging/ChatHeader.svelte';
    import MessageList from '$lib/components/messaging/MessageList.svelte';
    import MessageInput from '$lib/components/messaging/MessageInput.svelte';
    import EmptyState from '$lib/components/messaging/EmptyState.svelte';
    import UserSearchModal from '$lib/components/messaging/UserSearchModal.svelte';
    import NewConversationModal from '$lib/components/messaging/NewConversationModal.svelte';
    import AttachmentModal from '$lib/components/messaging/AttachmentModal.svelte';
    import Header from "$lib/components/Header.svelte";
    import Footer from "$lib/components/Footer.svelte";

    // Stores
    const conversations = writable([]);
    const messages = writable([]);
    const activeConversation = writable(null);
    const typingUsers = writable([]);
    const isConnected = writable(false);
    const loading = writable(false);
    const allUsers = writable([]);
    const searchResults = writable([]);

    // Variables locales
    let messageInput = '';
    let socket = null;
    let messagesContainer = null;
    let searchQuery = '';
    let showNewConversationModal = false;
    let showUserSearchModal = false;
    let newConversationName = '';
    let newConversationType = 'direct';
    let selectedParticipants = [];
    let currentUser = null;
    let searchTimeout = null;
    let isSearchingUsers = false;
    let userSearchQuery = '';
    let showAttachmentModal = false;
    let fileInput = null;
    let selectedFiles = [];
    let isDragOver = false;
    let showMobileSidebar = false;

    // Configuration API
    const API_BASE = `${import.meta.env.PUBLIC_APIURL || 'http://localhost:3000'}/api`;
    // Important: le backend WebSocket écoute sur le namespace /api/messaging
    const WS_URL = `${import.meta.env.PUBLIC_APIURL || 'http://localhost:3000'}/api/messaging`;

    let unsubscribeUser;
    let initialized = false;

    onMount(() => {
        unsubscribeUser = userStore.subscribe((user) => {
            currentUser = user;
            if (currentUser && !initialized) {
                initialized = true;
                loadConversations();
                loadAllUsers();
                connectWebSocket();
            }
        });
    });

    onDestroy(() => {
        if (socket) {
            socket.disconnect();
        }
        if (typeof unsubscribeUser === 'function') {
            unsubscribeUser();
        }
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
    });

    // Fonctions API
    async function apiCall(endpoint, options = {}) {
        const token = userStore.getToken();
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    async function loadConversations() {
        try {
            loading.set(true);
            const data = await apiCall('/messaging/conversations');
            conversations.set(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
        } finally {
            loading.set(false);
        }
    }

    async function loadAllUsers() {
        try {
            // 1) Tente l'endpoint debug qui liste tous les utilisateurs
            const debugResp = await fetch(`${API_BASE}/auth/debug/users`, { headers: { 'Content-Type': 'application/json' } });
            if (debugResp.ok) {
                const payload = await debugResp.json();
                const users = payload?.data?.users || [];
                const mapped = users.map(u => ({ id: u.id, email: u.email, name: u.firstName || u.email }));
                allUsers.set(mapped);
                return;
            }
        } catch (e) {
            console.warn('Impossible de charger les utilisateurs via /auth/debug/users:', e);
        }

        try {
            // 2) Fallback: utilisateurs connus via la messagerie (participants des conversations)
            const data = await apiCall('/messaging/users');
            allUsers.set(data || []);
        } catch (fallbackError) {
            console.error('Erreur fallback chargement utilisateurs messaging:', fallbackError);
        }
    }

    async function searchUsers(query) {
        if (!query.trim()) {
            searchResults.set([]);
            return;
        }

        isSearchingUsers = true;
        try {
            // 1) Tenter la recherche côté backend (basée sur les contacts connus)
            const data = await apiCall(`/messaging/users/search?q=${encodeURIComponent(query)}`);
            if (Array.isArray(data) && data.length > 0) {
                searchResults.set(data);
                return;
            }
        } catch (error) {
            console.warn('Recherche backend indisponible, fallback local:', error);
        } finally {
            isSearchingUsers = false;
        }

        // 2) Fallback: filtrer localement la liste complète des utilisateurs
        const users = get(allUsers);
        const term = query.toLowerCase();
        const filtered = users.filter(user =>
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.username?.toLowerCase().includes(term)
        );
        searchResults.set(filtered);
    }

    async function loadMessages(conversationId) {
        try {
            const data = await apiCall(`/messaging/conversations/${conversationId}/messages?limit=50&offset=0`);
            messages.set(data || []);
            scrollToBottom();
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    }

    async function createConversation(type, participantIds, name = null) {
        try {
            const data = await apiCall('/messaging/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    type,
                    participantIds,
                    name
                })
            });

            await loadConversations();
            selectConversation(data);
            return data;
        } catch (error) {
            console.error('Erreur lors de la création de la conversation:', error);
            throw error;
        }
    }

    async function startDirectConversation(userId) {
        try {
            // Chercher une conversation directe existante avec exactement 2 participants :
            // l'utilisateur actuel et l'utilisateur ciblé
            const existingConv = $conversations.find(conv =>
                conv.type === 'direct' &&
                conv.participants?.length === 2 &&
                conv.participants.some(p => p.userId === userId) &&
                conv.participants.some(p => p.userId === currentUser?.id)
            );

            if (existingConv) {
                selectConversation(existingConv);
                return;
            }

            const newConv = await createConversation('direct', [userId]);
            selectConversation(newConv);
        } catch (error) {
            console.error('Erreur lors de la création de la conversation directe:', error);
        }
    }

    async function markAsRead(conversationId) {
        try {
            await apiCall(`/messaging/conversations/${conversationId}/mark-read`, {
                method: 'POST'
            });

            if (socket) {
                socket.emit('mark_as_read', { conversationId });
            }
        } catch (error) {
            console.error('Erreur lors du marquage comme lu:', error);
        }
    }

    // Connexion WebSocket
    function connectWebSocket() {
        if (!currentUser) return;

        const token = userStore.getToken();
        console.log('Tentative de connexion WebSocket...', { WS_URL, token: token ? 'Présent' : 'Absent' });

        socket = io(WS_URL, {
            auth: {
                token: token
            },
            query: {
                userId: currentUser.id,
                userName: currentUser.firstName || currentUser.name || currentUser.email
            },
            transports: ['websocket'], // éviter le fallback long-polling
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 500,
            reconnectionDelayMax: 3000,
        });

        socket.on('connect', () => {
            isConnected.set(true);
            console.log('✅ Connecté au WebSocket');
        });

        socket.on('disconnect', (reason) => {
            isConnected.set(false);
            console.log('❌ Déconnecté du WebSocket:', reason);
        });

        socket.on('connect_error', (error) => {
            isConnected.set(false);
            console.error('❌ Erreur de connexion WebSocket:', error);
        });

        socket.on('new_message', (message) => {
            // N'ajouter le message que s'il ne provient pas de l'utilisateur actuel
            // (pour éviter la duplication côté expéditeur)
            if (message.senderId !== currentUser?.id) {
                messages.update(msgs => [...msgs, message]);
                scrollToBottom();
            }

            // Toujours mettre à jour la liste des conversations (pour tous)
            conversations.update(convs =>
                convs.map(conv =>
                    conv.id === message.conversationId
                        ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
                        : conv
                )
            );
        });

        socket.on('user_typing', (data) => {
            typingUsers.update(users => {
                const filtered = users.filter(u => u.userId !== data.userId);
                return [...filtered, data];
            });

            setTimeout(() => {
                typingUsers.update(users => users.filter(u => u.userId !== data.userId));
            }, 3000);
        });

        socket.on('user_stopped_typing', (data) => {
            typingUsers.update(users => users.filter(u => u.userId !== data.userId));
        });

        socket.on('messages_read', (data) => {
            messages.update(msgs =>
                msgs.map(msg => {
                    if (msg.conversationId === data.conversationId && msg.senderId === currentUser.id) {
                        const readBy = msg.readBy || [];
                        const alreadyRead = readBy.find(r => r.userId === data.userId);
                        if (!alreadyRead) {
                            return {
                                ...msg,
                                readBy: [...readBy, { userId: data.userId, readAt: data.readAt }]
                            };
                        }
                    }
                    return msg;
                })
            );
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    // Fonctions UI
    async function selectConversation(conversation) {
        activeConversation.set(conversation);

        if (socket) {
            socket.emit('join_conversation', { conversationId: conversation.id });
        }

        await loadMessages(conversation.id);
        await markAsRead(conversation.id);

        conversations.update(convs =>
            convs.map(conv =>
                conv.id === conversation.id
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        );

        searchResults.set([]);
        searchQuery = '';
    }

    async function sendMessage() {
        if (!messageInput.trim() || !currentUser) return;

        const currentConv = get(activeConversation);
        if (!currentConv) return;

        const messageData = {
            conversationId: currentConv.id,
            content: messageInput.trim(),
            messageType: 'text'
        };

        try {
            const newMessage = await apiCall(`/messaging/conversations/${currentConv.id}/messages`, {
                method: 'POST',
                body: JSON.stringify(messageData)
            });

            // Ajouter le message immédiatement côté expéditeur (pour un feedback instantané)
            messages.update(msgs => [...msgs, newMessage]);
            messageInput = '';
            scrollToBottom();

            // Mettre à jour la conversation avec le dernier message
            conversations.update(convs =>
                convs.map(conv =>
                    conv.id === currentConv.id
                        ? { ...conv, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
                        : conv
                )
            );

        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            alert('Erreur lors de l\'envoi du message');
        }
    }

    function handleTyping() {
        // Désactivé pour l'instant (nécessite WebSocket)
    }

    // Fonctions pour les pièces jointes
    function openAttachmentModal() {
        showAttachmentModal = true;
    }

    function closeAttachmentModal() {
        showAttachmentModal = false;
        selectedFiles = [];
    }

    function handleFileSelect(event) {
        const files = Array.from(event.target.files || []);
        selectedFiles = [...selectedFiles, ...files];
        if (fileInput) fileInput.value = '';
    }

    function removeFile(index) {
        selectedFiles = selectedFiles.filter((_, i) => i !== index);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getFileIcon(file) {
        const type = file.type;
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎥';
        if (type.startsWith('audio/')) return '🎵';
        if (type.includes('pdf')) return '📄';
        if (type.includes('document') || type.includes('word')) return '📝';
        if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
        return '📎';
    }

    async function sendAttachments() {
        if (selectedFiles.length === 0) return;

        const currentConv = get(activeConversation);
        if (!currentConv) return;

        for (const file of selectedFiles) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('messageType', file.type.startsWith('image/') ? 'image' : 'file');

                const token = userStore.getToken();
                const response = await fetch(`${API_BASE}/messaging/conversations/${currentConv.id}/messages/attachment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Erreur ${response.status}`);
                }

                const newMessage = await response.json();
                messages.update(msgs => [...msgs, newMessage]);
                scrollToBottom();

                conversations.update(convs =>
                    convs.map(conv =>
                        conv.id === currentConv.id
                            ? { ...conv, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
                            : conv
                    )
                );
            } catch (error) {
                console.error('Erreur lors de l\'envoi du fichier:', error);
                alert(`Erreur lors de l'envoi du fichier ${file.name}`);
            }
        }

        closeAttachmentModal();
    }

    function handleDragOver(event) {
        event.preventDefault();
        isDragOver = true;
    }

    function handleDragLeave(event) {
        event.preventDefault();
        isDragOver = false;
    }

    function handleDrop(event) {
        event.preventDefault();
        isDragOver = false;
        const files = Array.from(event.dataTransfer.files);
        selectedFiles = [...selectedFiles, ...files];
    }

    function handleSearchInput() {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            if (searchQuery.trim()) {
                searchUsers(searchQuery);
            } else {
                searchResults.set([]);
            }
        }, 300);
    }

    function handleUserSearchInput() {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            if (userSearchQuery.trim()) {
                searchUsers(userSearchQuery);
            } else {
                searchResults.set([]);
            }
        }, 300);
    }

    function scrollToBottom() {
        setTimeout(() => {
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 50);
    }

    function parseFirebaseTimestamp(timestamp) {
        if (!timestamp) return new Date();

        if (timestamp._seconds) {
            return new Date(timestamp._seconds * 1000);
        }

        return new Date(timestamp);
    }

    function formatTime(date) {
        const parsedDate = parseFirebaseTimestamp(date);
        return parsedDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatDate(date) {
        const parsedDate = parseFirebaseTimestamp(date);
        return parsedDate.toLocaleDateString('fr-FR');
    }

    function getConversationTitle(conversation) {
        if (!conversation) return 'Conversation';
        if (conversation.type === 'group') {
            return conversation.name || 'Groupe sans nom';
        }

        // try to find the other participant
        const meId = currentUser?.id;
        const participants = conversation.participants || [];

        // Prefer items that have a userId different from me
        let otherParticipant =
            participants.find(p => (p.userId ?? p.id) && (p.userId ?? p.id) !== meId) ||
            participants.find(p => (p.email || p.userName || p.name)) ||
            participants[0];

        // Try to resolve through the global users list if names are missing
        const users = get(allUsers) || [];
        let candidateUser = null;

        if (otherParticipant?.userId) {
            candidateUser = users.find(u => u.id === otherParticipant.userId) || null;
        } else if (otherParticipant?.id) {
            candidateUser = users.find(u => u.id === otherParticipant.id) || null;
        }

        const display =
            otherParticipant?.userName ||
            otherParticipant?.name ||
            otherParticipant?.displayName ||
            candidateUser?.name ||
            candidateUser?.username ||
            candidateUser?.email ||
            otherParticipant?.email ||
            otherParticipant?.username ||
            (typeof otherParticipant === 'string' ? otherParticipant : null) ||
            'Utilisateur';

        return display;
    }

    function getConversationAvatar(conversation) {
        const title = getConversationTitle(conversation);
        if (conversation.type === 'group') {
            return title.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        } else {
            return title?.[0]?.toUpperCase() || 'U';
        }
    }

    function isMessageFromCurrentUser(message) {
        return message.senderId === currentUser?.id;
    }

    function getReadStatus(message) {
        if (!isMessageFromCurrentUser(message)) return '';

        const readBy = message.readBy || [];
        const otherReaders = readBy.filter(r => r.userId !== currentUser.id);

        if (otherReaders.length === 0) return 'sent';
        if (otherReaders.length === 1) return 'delivered';
        return 'read';
    }

    function getUserDisplayName(user) {
        return user.name || user.username || user.email || 'Utilisateur inconnu';
    }

    function getUserAvatar(user) {
        const name = getUserDisplayName(user);
        return name[0]?.toUpperCase() || 'U';
    }

    function openUserSearchModal() {
        showUserSearchModal = true;
        userSearchQuery = '';
        // Pré-remplir la liste avec tous les utilisateurs (hors utilisateur courant)
        const users = get(allUsers).filter(u => u.id !== currentUser?.id);
        searchResults.set(users);
        setTimeout(() => {
            const searchInput = document.querySelector('#user-search-input');
            if (searchInput) searchInput.focus();
        }, 100);
    }

    function closeUserSearchModal() {
        showUserSearchModal = false;
        userSearchQuery = '';
        searchResults.set([]);
    }

    async function handleCreateConversation() {
        if (newConversationType === 'group' && !newConversationName.trim()) {
            alert('Veuillez entrer un nom pour le groupe');
            return;
        }

        if (selectedParticipants.length === 0) {
            alert('Veuillez sélectionner au moins un participant');
            return;
        }

        try {
            await createConversation(
                newConversationType,
                selectedParticipants,
                newConversationType === 'group' ? newConversationName : null
            );

            // Reset form
            showNewConversationModal = false;
            newConversationName = '';
            newConversationType = 'direct';
            selectedParticipants = [];
        } catch (error) {
            alert('Erreur lors de la création de la conversation');
        }
    }

    // Réactives
    $: filteredConversations = $conversations.filter(conv => {
        if ($searchResults.length > 0) return false;
        const title = getConversationTitle(conv);
        return title.toLowerCase().includes(searchQuery.toLowerCase());
    }).sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return parseFirebaseTimestamp(bTime) - parseFirebaseTimestamp(aTime);
    });

    $: activeMessages = $messages.filter(msg =>
        $activeConversation && msg.conversationId === $activeConversation.id
    );

    $: currentTypingUsers = $typingUsers.filter(user =>
        $activeConversation && user.conversationId === $activeConversation.id
    );

    $: {
        handleSearchInput();
    }

    $: {
        handleUserSearchInput();
    }
</script>
<Header />
<div class="messaging-container">
    <!-- Mobile sidebar overlay -->
    {#if showMobileSidebar}
        <div class="mobile-sidebar-overlay" on:click={() => showMobileSidebar = false}>
            <div class="mobile-sidebar" on:click|stopPropagation>
                <Sidebar 
                    conversations={$conversations}
                    searchResults={$searchResults}
                    activeConversation={$activeConversation}
                    bind:searchQuery
                    isSearchingUsers={isSearchingUsers}
                    loading={$loading}
                    isConnected={$isConnected}
                    onSelectConversation={(conv) => { selectConversation(conv); showMobileSidebar = false; }}
                    onStartDirectConversation={(userId) => { startDirectConversation(userId); showMobileSidebar = false; }}
                    onClearSearch={() => { searchQuery = ''; $searchResults = []; }}
                    onOpenUserSearchModal={openUserSearchModal}
                    onOpenNewConversationModal={() => showNewConversationModal = true}
                    {getConversationTitle}
                    {getUserDisplayName}
                    {getUserAvatar}
                    {formatTime}
                />
            </div>
        </div>
    {/if}

    <div class="messaging-layout">
        <!-- Desktop/Tablet Sidebar -->
        <div class="sidebar-container desktop-sidebar">
            <Sidebar 
                conversations={$conversations}
                searchResults={$searchResults}
                activeConversation={$activeConversation}
                bind:searchQuery
                isSearchingUsers={isSearchingUsers}
                loading={$loading}
                isConnected={$isConnected}
                onSelectConversation={selectConversation}
                onStartDirectConversation={startDirectConversation}
                onClearSearch={() => { searchQuery = ''; $searchResults = []; }}
                onOpenUserSearchModal={openUserSearchModal}
                onOpenNewConversationModal={() => showNewConversationModal = true}
                {getConversationTitle}
                {getUserDisplayName}
                {getUserAvatar}
                {formatTime}
            />
        </div>

        <div class="chat-container">
            <!-- Mobile header with menu button -->
            <div class="mobile-chat-header">
                <button class="mobile-menu-button" on:click={() => showMobileSidebar = true}>
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                </button>
                {#if $activeConversation}
                    <span class="mobile-conversation-title">
                        {getConversationTitle($activeConversation)}
                    </span>
                {/if}
            </div>

            {#if $activeConversation}
                <div class="chat-content">
                    <ChatHeader 
                        activeConversation={$activeConversation}
                        {getConversationTitle}
                        isConnected={$isConnected}
                    />
                    
                    <MessageList 
                        messages={activeMessages}
                        {currentUser}
                        typingUsers={currentTypingUsers}
                        {formatTime}
                        {getFileIcon}
                        {formatFileSize}
                        {getReadStatus}
                        {isMessageFromCurrentUser}
                    />
                    
                    <MessageInput 
                        bind:messageInput
                        onSendMessage={sendMessage}
                        onTyping={handleTyping}
                        {openAttachmentModal}
                    />
                </div>
            {:else}
                <EmptyState onOpenUserSearchModal={openUserSearchModal} />
            {/if}
        </div>
    </div>
</div>

<!-- Modals -->
<UserSearchModal 
    show={showUserSearchModal}
    searchResults={$searchResults}
    bind:userSearchQuery
    {isSearchingUsers}
    onClose={closeUserSearchModal}
    onStartDirectConversation={startDirectConversation}
    {getUserDisplayName}
    {getUserAvatar}
/>

<NewConversationModal 
    show={showNewConversationModal}
    allUsers={$allUsers}
    {currentUser}
    bind:newConversationName
    bind:newConversationType
    bind:selectedParticipants
    onClose={() => showNewConversationModal = false}
    onCreateConversation={handleCreateConversation}
    {getUserDisplayName}
    {getUserAvatar}
/>

<AttachmentModal 
    show={showAttachmentModal}
    {selectedFiles}
    {isDragOver}
    onClose={closeAttachmentModal}
    onSendAttachments={sendAttachments}
    {handleFileSelect}
    {handleDragOver}
    {handleDragLeave}
    {handleDrop}
    {removeFile}
    {getFileIcon}
    {formatFileSize}
/>

<Footer />

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');

    :global(body) {
        font-family: 'Open Sans', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f9fafb;
    }

    :global(h1, h2, h3, h4, h5, h6) {
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
    }

    /* Custom messaging layout using Tailwind utilities where possible */
    .messaging-container {
        position: fixed;
        top: 64px; /* Height of header */
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #f9fafb;
        overflow: hidden;
    }

    .messaging-layout {
        display: flex;
        height: 100%;
        width: 100%;
    }

    .sidebar-container {
        background-color: white;
        border-right: 1px solid #e5e7eb;
        overflow-y: auto;
    }

    .desktop-sidebar {
        display: none;
    }

    .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 12px;
    }

    .chat-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(251, 113, 133, 0.1);
        overflow: hidden;
    }

    .mobile-chat-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 16px;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .mobile-menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #c174f2, #cb90f1);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(193, 116, 242, 0.3);
    }

    .mobile-menu-button:hover {
        background: linear-gradient(135deg, #cb90f1, #c174f2);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(193, 116, 242, 0.4);
    }

    .mobile-conversation-title {
        font-weight: 600;
        font-size: 16px;
        color: #1f2937;
        font-family: 'Montserrat', sans-serif;
    }

    .mobile-sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: stretch;
    }

    .mobile-sidebar {
        width: 80%;
        max-width: 320px;
        background-color: white;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
        padding-top: 80px;
    }

    /* Responsive breakpoints */
    @media (min-width: 768px) {
        .mobile-chat-header {
            display: none;
        }

        .desktop-sidebar {
            display: block;
            width: 320px;
            flex-shrink: 0;
        }

        .chat-container {
            padding: 20px;
        }

        .chat-content {
            border-radius: 16px;
        }

        .mobile-sidebar-overlay {
            display: none !important;
        }
    }

    @media (min-width: 1024px) {
        .desktop-sidebar {
            width: 380px;
        }

        .chat-container {
            padding: 24px;
        }
    }

    @media (min-width: 1440px) {
        .desktop-sidebar {
            width: 420px;
        }

        .chat-container {
            padding: 32px;
        }
    }
</style>
