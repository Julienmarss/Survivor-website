// frontend/src/lib/services/authApi.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class AuthApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Ajouter le token d'authentification si disponible
        const token = this.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Inscription utilisateur standard
    async registerUser(userData) {
        const response = await this.request('/auth/register/user', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        
        if (response.success && response.data.accessToken) {
            this.setToken(response.data.accessToken);
        }
        
        return response;
    }

    // Inscription startup
    async registerStartup(startupData) {
        // Mapper les données du frontend vers le format backend
        const mappedData = {
            email: startupData.email,
            password: startupData.password,
            firstName: startupData.firstName,
            lastName: startupData.lastName,
            phone: startupData.phone,
            linkedin: startupData.linkedin,
            companyName: startupData.companyName,
            sector: startupData.sector,
            description: startupData.description,
            maturity: startupData.stage || startupData.maturity,
            foundingDate: startupData.foundingYear ? `${startupData.foundingYear}-01-01` : startupData.foundingDate,
            teamSize: parseInt(startupData.teamSize?.match(/\d+/)?.[0] || 1),
            websiteUrl: startupData.website,
            projectStatus: 'Active',
            needs: startupData.fundingNeeds,
            // Champs supplémentaires du frontend
            legalStatus: 'SAS', // valeur par défaut
            address: '', // valeur par défaut
            // Mapper les champs spécifiques du frontend
            coFounders: startupData.coFounders,
            fundingNeeds: startupData.fundingNeeds,
            currentFunding: startupData.currentFunding,
            vision: startupData.vision,
            challenges: startupData.challenges,
            why: startupData.why,
        };

        const response = await this.request('/auth/register/startup', {
            method: 'POST',
            body: JSON.stringify(mappedData),
        });
        
        if (response.success && response.data.accessToken) {
            this.setToken(response.data.accessToken);
        }
        
        return response;
    }

    // Inscription investisseur
    async registerInvestor(investorData) {
        // Mapper les données du frontend vers le format backend
        const mappedData = {
            email: investorData.email,
            password: investorData.password,
            firstName: investorData.firstName,
            lastName: investorData.lastName,
            phone: investorData.phone,
            linkedinUrl: investorData.linkedin,
            companyName: investorData.company,
            position: investorData.position,
            investorType: investorData.investorType,
            website: investorData.website,
            experience: investorData.experience,
            // Gérer investmentRange selon le format
            investmentRange: typeof investorData.investmentRange === 'string' 
                ? investorData.investmentRange // Le backend parsera la string
                : investorData.investmentRange, // Ou utiliser l'objet directement
            preferredSectors: investorData.preferredSectors || [],
            preferredStages: investorData.preferredStages || [],
            geography: investorData.geography,
            investmentCriteria: investorData.investmentCriteria,
            portfolioSize: investorData.portfolioSize,
            investmentExperience: investorData.investmentExperience,
            companyWebsite: investorData.companyWebsite,
            geographicalPreferences: investorData.geographicalPreferences,
            expertise: investorData.expertise,
            portfolio: investorData.portfolio,
            motivation: investorData.motivation,
        };

        const response = await this.request('/auth/register/investor', {
            method: 'POST',
            body: JSON.stringify(mappedData),
        });
        
        if (response.success && response.data.accessToken) {
            this.setToken(response.data.accessToken);
        }
        
        return response;
    }

    // Inscription étudiant (comme utilisateur standard avec des champs supplémentaires)
    async registerStudent(studentData) {
        const mappedData = {
            email: studentData.email,
            password: studentData.password,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            age: 20, // valeur par défaut pour les étudiants
            gender: 'prefer_not_to_say', // valeur par défaut
            // On peut ajouter des champs spécifiques aux étudiants plus tard
            school: studentData.school,
            level: studentData.level,
            field: studentData.field,
            linkedin: studentData.linkedin,
            motivation: studentData.motivation,
            interests: studentData.interests,
        };

        const response = await this.request('/auth/register/user', {
            method: 'POST',
            body: JSON.stringify(mappedData),
        });
        
        if (response.success && response.data.accessToken) {
            this.setToken(response.data.accessToken);
        }
        
        return response;
    }

    // Connexion
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        
        if (response.success && response.data.accessToken) {
            this.setToken(response.data.accessToken);
        }
        
        return response;
    }

    // Déconnexion
    async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            this.removeToken();
        }
    }

    // Vérifier le token
    async verifyToken(token) {
        const response = await this.request('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
        return response;
    }

    // Obtenir le profil utilisateur actuel
    async getCurrentUser() {
        const response = await this.request('/auth/me');
        return response;
    }

    // Mettre à jour le profil
    async updateProfile(profileData) {
        const response = await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        return response;
    }

    // Gestion du token
    setToken(token) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('jeb_auth_token', token);
        }
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('jeb_auth_token');
        }
        return null;
    }

    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('jeb_auth_token');
        }
    }

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        return !!this.getToken();
    }
}

export const authApi = new AuthApiService();
export default authApi;