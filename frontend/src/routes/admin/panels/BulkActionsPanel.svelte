<script>
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    
    const dispatch = createEventDispatcher();
    
    export let selectedUsers = [];
    export let user = null;
    
    let loading = false;
    let showConfirmModal = false;
    let selectedAction = '';
    let actionParams = {};
    
    const API_BASE = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

    const bulkActions = [
        {
            id: 'activate',
            label: 'Activer',
            icon: '✅',
            color: 'bg-green-100 text-green-700 hover:bg-green-200',
            description: 'Activer les comptes sélectionnés'
        },
        {
            id: 'deactivate',
            label: 'Désactiver',
            icon: '❌',
            color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
            description: 'Désactiver les comptes sélectionnés'
        },
        {
            id: 'role_change',
            label: 'Changer le rôle',
            icon: '🔄',
            color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
            description: 'Modifier le rôle des utilisateurs',
            hasParams: true
        },
        {
            id: 'delete',
            label: 'Supprimer',
            icon: '🗑️',
            color: 'bg-red-100 text-red-700 hover:bg-red-200',
            description: 'Supprimer définitivement les comptes',
            dangerous: true
        }
    ];

    function selectAction(actionId) {
        selectedAction = actionId;
        actionParams = {};
        
        // Initialize params for actions that need them
        if (actionId === 'role_change') {
            actionParams.role = 'user';
        }
        
        showConfirmModal = true;
    }

    async function executeAction() {
        try {
            loading = true;
            
            const response = await fetch(`${API_BASE}/admin/users/bulk-action`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userIds: selectedUsers,
                    action: selectedAction,
                    params: actionParams
                })
            });

            const data = await response.json();

            if (data.success) {
                dispatch('action', { 
                    action: selectedAction, 
                    results: data.data,
                    userCount: selectedUsers.length 
                });
                closeModal();
            } else {
                throw new Error(data.message || 'Erreur lors de l\'action en lot');
            }
        } catch (error) {
            console.error('Erreur action en lot:', error);
            alert(`Erreur: ${error.message}`);
        } finally {
            loading = false;
        }
    }

    function closeModal() {
        showConfirmModal = false;
        selectedAction = '';
        actionParams = {};
    }

    function closePanel() {
        dispatch('close');
    }

    function getActionById(id) {
        return bulkActions.find(action => action.id === id);
    }
</script>

<div class="bg-white border border-purple-200 rounded-xl shadow-lg p-4 mb-6">
    <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-r from-[#c174f2] to-[#cb90f1] rounded-full flex items-center justify-center text-white font-bold">
                {selectedUsers.length}
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-900 font-['Montserrat']">Actions en lot</h3>
                <p class="text-sm text-gray-600">
                    {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                </p>
            </div>
        </div>
        
        <button
            on:click={closePanel}
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        {#each bulkActions as action}
            <button
                on:click={() => selectAction(action.id)}
                disabled={loading}
                class="p-3 rounded-lg border-2 border-transparent transition-all duration-200 {action.color} hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div class="text-center">
                    <div class="text-2xl mb-1">{action.icon}</div>
                    <div class="text-sm font-medium">{action.label}</div>
                </div>
            </button>
        {/each}
    </div>
</div>

<!-- Confirmation Modal -->
{#if showConfirmModal}
    <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={closeModal}></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                {#if selectedAction}
                    {@const action = getActionById(selectedAction)}
                    
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full {action.dangerous ? 'bg-red-100' : 'bg-purple-100'} sm:mx-0 sm:h-10 sm:w-10">
                                <span class="text-2xl">{action.icon}</span>
                            </div>
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 class="text-lg leading-6 font-medium text-gray-900 font-['Montserrat']">
                                    Confirmer l'action : {action.label}
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500 mb-4">
                                        {action.description} pour {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''}.
                                    </p>

                                    {#if action.dangerous}
                                        <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                            <div class="flex">
                                                <div class="flex-shrink-0">
                                                    <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                                    </svg>
                                                </div>
                                                <div class="ml-3">
                                                    <h3 class="text-sm font-medium text-red-800">Attention !</h3>
                                                    <div class="mt-2 text-sm text-red-700">
                                                        <p>Cette action est irréversible. Les comptes supprimés ne pourront pas être récupérés.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    {/if}

                                    <!-- Parameters for role change -->
                                    {#if selectedAction === 'role_change'}
                                        <div class="space-y-3">
                                            <div>
                                                <label for="newRole" class="block text-sm font-medium text-gray-700 mb-1">
                                                    Nouveau rôle
                                                </label>
                                                <select
                                                    id="newRole"
                                                    bind:value={actionParams.role}
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                >
                                                    <option value="user">Étudiant</option>
                                                    <option value="startup">Startup</option>
                                                    <option value="investor">Investisseur</option>
                                                    <option value="admin">Administrateur</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
                                                    Raison (optionnel)
                                                </label>
                                                <textarea
                                                    id="reason"
                                                    bind:value={actionParams.reason}
                                                    rows="2"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    placeholder="Raison du changement de rôle..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    {/if}

                                    <!-- Parameters for activate/deactivate -->
                                    {#if selectedAction === 'activate' || selectedAction === 'deactivate'}
                                        <div>
                                            <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
                                                Raison (optionnel)
                                            </label>
                                            <textarea
                                                id="reason"
                                                bind:value={actionParams.reason}
                                                rows="2"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Raison de la modification..."
                                            ></textarea>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            on:click={executeAction}
                            disabled={loading}
                            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 {
                                action.dangerous 
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                                    : 'bg-gradient-to-r from-[#c174f2] to-[#cb90f1] hover:shadow-lg focus:ring-purple-500'
                            }"
                        >
                            {#if loading}
                                <LoadingSpinner size="sm" color="#ffffff" />
                            {:else}
                                {action.label}
                            {/if}
                        </button>
                        <button
                            type="button"
                            on:click={closeModal}
                            disabled={loading}
                            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                            Annuler
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap');
</style>