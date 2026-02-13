import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseAppConfig";

export const RemoteConfigKeys = {
    LIVE_API_URL: 'live_api_url',
    STAGING_API_URL: 'staging_api_url',
    ANIMALKART_LIVE_URL: 'animalkart_live_url',
    ANIMALKART_STAGING_URL: 'animalkart_staging_url',
};

class RemoteConfigService {
    private static instance: RemoteConfigService;
    private config: Record<string, any> = {};

    private constructor() { }

    static getInstance(): RemoteConfigService {
        if (!RemoteConfigService.instance) {
            RemoteConfigService.instance = new RemoteConfigService();
        }
        return RemoteConfigService.instance;
    }

    async fetchConfig(): Promise<void> {
        try {

            const docRef = doc(db, "app_settings", "farmvest_config");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.config = docSnap.data();

                this.updateLocalStorage();
            } else {
                console.warn("No such document in app_settings/farmvest_config!");
            }
        } catch (error) {
            console.error("Error fetching remote config:", error);
        }
    }

    private updateLocalStorage() {
        // We can store these for persistence across reloads until the next fetch
        localStorage.setItem('farmvest_remote_config', JSON.stringify(this.config));
    }

    getValue(key: string, defaultValue: any = null): any {
        // First check in-memory config
        if (this.config && this.config[key] !== undefined) {
            return this.config[key];
        }

        // Then check local storage fallback
        const saved = localStorage.getItem('farmvest_remote_config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed[key] !== undefined) return parsed[key];
            } catch (e) {
                // ignore
            }
        }

        return defaultValue;
    }

    getAllConfig(): Record<string, any> {
        return { ...this.config };
    }
}

export const remoteConfig = RemoteConfigService.getInstance();
