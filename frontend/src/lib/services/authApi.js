const API_BASE_URL = `${import.meta.env.PUBLIC_APIURL || 'http://localhost:3000'}/api`;

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

        const token = this.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
            console.log('📤 Request data:', options.body);
            
            const response = await fetch(url, config);
            
            console.log(`📥 Response status: ${response.status}`);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Vérifier le content-type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('❌ Response is not JSON:', contentType);
                const textResponse = await response.text();
                console.error('❌ Raw response:', textResponse);
                throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
            }

            const data = await response.json();
            console.log('📥 Response data:', data);

            if (!response.ok) {
                const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
                console.error('❌ API Error:', errorMessage);
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error(`❌ API request failed for ${endpoint}:`, error);
            
            // Si c'est une erreur de parsing JSON, donnons plus d'infos
            if (error.message.includes('Unexpected token')) {
                console.error('❌ JSON Parsing Error - Server likely returned HTML or plain text instead of JSON');
            }
            
            throw error;
        }
    }

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

    async registerStartup(startupData) {
        console.log('🚀 Startup registration for:', startupData.email);
        
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
            website: startupData.website,
            projectStatus: 'Active',
            needs: startupData.fundingNeeds,
            legalStatus: 'SAS',
            address: '',
            // Champs optionnels
            coFounders: startupData.coFounders,
            fundingNeeds: startupData.fundingNeeds,
            currentFunding: startupData.currentFunding,
            vision: startupData.vision,
            challenges: startupData.challenges,
            why: startupData.why,
        };

        console.log('📤 Mapped startup data:', mappedData);

        const response = await this.request('/auth/register/startup', {
            method: 'POST',
            body: JSON.stringify(mappedData),
        });
        
        if (response.success && response.data && response.data.accessToken) {
            this.setToken(response.data.accessToken);
        }
        
        return response;
    }

    async registerStudent(studentData) {
        console.log('🎓 Student registration for:', studentData.email);
        
        const mappedData = {
            email: studentData.email,
            password: studentData.password,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            age: 20,
            gender: 'prefer_not_to_say',
            
            school: studentData.school,
            level: studentData.level,
            field: studentData.field,
            linkedin: studentData.linkedin,
            motivation: studentData.motivation,
            interests: studentData.interests || [],
        };

        console.log('📤 Mapped student data:', mappedData);

        const response = await this.request('/auth/register/user', {
            method: 'POST',
            body: JSON.stringify(mappedData),
        });
        
        if (response.success && response.data && response.data.accessToken) {
            this.setToken(response.data.accessToken);
        }
        
        return response;
    }

    async registerInvestor(investorData) {
        console.log('💰 Investor registration for:', investorData.email);
        
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
            investmentRange: typeof investorData.investmentRange === 'string' 
                ? investorData.investmentRange
                : investorData.investmentRange,
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

        console.log('📤 Mapped investor data:', mappedData);

        const response = await this.request('/auth/register/investor', {
            method: 'POST',
            body: JSON.stringify(mappedData),
        });
        
        if (response.success && response.data && response.data.accessToken) {
            this.setToken(response.data.accessToken);
        }
        
        return response;
    }

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

    async verifyToken(token) {
        const response = await this.request('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
        return response;
    }

    async getCurrentUser() {
        const response = await this.request('/auth/me');
        return response;
    }

    setToken(token) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('jeb_auth_token', token);
            console.log('💾 Token saved to localStorage');
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
            console.log('🗑️ Token removed from localStorage');
        }
    }

    isAuthenticated() {
        return !!this.getToken();
    }
}

export const authApi = new AuthApiService();
export default authApi;