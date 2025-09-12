<script>
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    
    const dispatch = createEventDispatcher();
    
    export let selectedStartups = [];
    export let user = null;
    
    let loading = false;
    let showConfirmModal = false;
    let selectedAction = '';
    let actionParams = {};
    
    const API_BASE = import.meta.env.PUBLIC_APIURL || 'http://localhost:3000';

    const bulkActions = [
        {
            id: 'status_change',
            label: 'Changer statut',
            icon: '🔄',
            color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
            description: 'Modifier le statut des startups sélectionnées',
            hasParams: true
        },
        {
            id: 'sector_change',
            label: 'Changer secteur',
            icon: '🏷️',
            color: 'bg-green-100 text-green-700 hover:bg-green-200',
            description: 'Modifier le secteur des startups sélectionnées',
            hasParams: true
        },
        {
            id: 'export',
            label: 'Exporter CSV',
            icon: '📊',
            color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
            description: 'Exporter les startups sélectionnées en CSV'
        },
        {
            id: 'delete',
            label: 'Supprimer',
            icon: '🗑️',
            color: 'bg-red-100 text-red-700 hover:bg-red-200',
            description: 'Supprimer définitivement les startups sélectionnées',
            dangerous: true
        }
    ];

    const statuses = [
        'Active', 'Seeking Investment', 'Paused', 'Completed'
    ];

    const sectors = [
        'FinTech', 'HealthTech', 'EdTech', 'GreenTech', 'AgriTech', 'PropTech', 
        'FoodTech', 'RetailTech', 'Mobility', 'Cybersécurité', 'Intelligence Artificielle', 
        'Blockchain', 'IoT', 'Robotique', 'Gaming', 'Media & Entertainment', 'E-commerce', 
        'SaaS', 'Autre'
    ];

    function selectAction(actionId) {
        selectedAction = actionId;
        actionParams = {};
        
        // Initialize params for actions that need them
        if (actionId === 'status_change') {
            actionParams.status = 'Active';
        } else if (actionId === 'sector_change') {
            actionParams.sector = 'FinTech';
        }
        
        showConfirmModal = true;
    }

    async function executeAction() {
        try {
            loading = true;
            
            if (selectedAction === 'export') {
                await exportSelectedStartups();
                return;
            }

            const response = await fetch(`${API_BASE}/admin/startups/bulk-action`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startupIds: selectedStartups,
                    action: selectedAction,
                    params: actionParams
                })
            });

            const data = await response.json();

            if (data.success) {
                dispatch('action', { 
                    action: selectedAction, 
                    results: data.data,
                    startupCount: selectedStartups.length 
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

    async function exportSelectedStartups() {
        try {
            // Pour l'export, on utilise les IDs sélectionnés comme filtre
            const response = await fetch(`${API_BASE}/admin/startups/export/csv`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startupIds: selectedStartups
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    downloadFile(data.data, `startups-selection-export-${new Date().toISOString().split('T')[0]}.csv`);
                    
                    dispatch('action', { 
                        action: 'export', 
                        results: { success: selectedStartups.length, failed: 0 },
                        startupCount: selectedStartups.length 
                    });
                    closeModal();
                } else {
                    throw new Error(data.message || 'Erreur lors de l\'export');
                }
            } else {
                throw new Error(`Erreur ${response.status}`);
            }
        } catch (error) {
            throw error;
        }
    }

    function downloadFile(data, filename) {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                {selectedStartups.length}
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-900 font-['Montserrat']">Actions en lot - Startups</h3>
                <p class="text-sm text-gray-600">
                    {selectedStartups.length} startup{selectedStartups.length > 1 ? 's' : ''} sélectionnée{selectedStartups.length > 1 ? 's' : ''}
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
                                        {action.description} pour {selectedStartups.length} startup{selectedStartups.length > 1 ? 's' : ''}.
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
                                                        <p>Cette action est irréversible. Les startups supprimées ne pourront pas être récupérées.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    {/if}

                                    <!-- Parameters for status change -->
                                    {#if selectedAction === 'status_change'}
                                        <div class="space-y-3">
                                            <div>
                                                <label for="newStatus" class="block text-sm font-medium text-gray-700 mb-1">
                                                    Nouveau statut
                                                </label>
                                                <select
                                                    id="newStatus"
                                                    bind:value={actionParams.status}
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                >
                                                    {#each statuses as status}
                                                        <option value={status}>{status}</option>
                                                    {/each}
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
                                                    placeholder="Raison du changement de statut..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    {/if}

                                    <!-- Parameters for sector change -->
                                    {#if selectedAction === 'sector_change'}
                                        <div class="space-y-3">
                                            <div>
                                                <label for="newSector" class="block text-sm font-medium text-gray-700 mb-1">
                                                    Nouveau secteur
                                                </label>
                                                <select
                                                    id="newSector"
                                                    bind:value={actionParams.sector}
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                >
                                                    {#each sectors as sector}
                                                        <option value={sector}>{sector}</option>
                                                    {/each}
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
                                                    placeholder="Raison du changement de secteur..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    {/if}

                                    <!-- Confirmation for export -->
                                    {#if selectedAction === 'export'}
                                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div class="flex">
                                                <div class="flex-shrink-0">
                                                    <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                                    </svg>
                                                </div>
                                                <div class="ml-3">
                                                    <h3 class="text-sm font-medium text-blue-800">Information</h3>
                                                    <div class="mt-2 text-sm text-blue-700">
                                                        <p>Un fichier CSV contenant les données des startups sélectionnées sera téléchargé.</p>
                                                    </div>
                                                </div>
                                            </div>
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