import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';

const BIOMETRIC_ENABLED_KEY = 'truetrack_biometric_enabled';
const BIOMETRIC_CREDENTIALS_SERVER = 'truetrack_auth';

export const biometricService = {
    /**
     * Check if biometrics are available on the device
     */
    async isAvailable(): Promise<{ available: boolean; biometryType: BiometryType | null }> {
        try {
            // Add a safety timeout for the native bridge
            const timeoutPromise = new Promise<{ available: boolean; biometryType: BiometryType | null }>(resolve =>
                setTimeout(() => resolve({ available: false, biometryType: null }), 60000)
            );
            const callPromise = NativeBiometric.isAvailable().then(result => ({
                available: result.isAvailable,
                biometryType: result.biometryType as BiometryType
            }));

            return await Promise.race([callPromise, timeoutPromise]);
        } catch (e) {
            console.error('Biometric availability check failed:', e);
            return { available: false, biometryType: null };
        }
    },

    /**
     * Check if the user has enabled biometrics in the app settings
     */
    async isEnabled(): Promise<boolean> {
        try {
            const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
            return value === 'true';
        } catch (e) {
            return false;
        }
    },

    /**
     * Enable or disable biometric auth in app settings
     */
    async setEnabled(enabled: boolean): Promise<void> {
        await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: enabled ? 'true' : 'false' });
    },

    /**
     * Securely store email and password in the native keychain/keystore
     */
    async saveCredentials(email: string, password: string): Promise<void> {
        try {
            await NativeBiometric.setCredentials({
                username: email,
                password: password,
                server: BIOMETRIC_CREDENTIALS_SERVER,
            });
        } catch (e) {
            console.error('Failed to save credentials to biometric storage:', e);
            throw e;
        }
    },

    /**
     * Retrieve stored credentials after biometric verification
     */
    async getCredentials(): Promise<{ email: string; password: string } | null> {
        try {
            // Timeout for credential retrieval
            const timeoutPromise = new Promise<{ email: string; password: string } | null>(resolve =>
                setTimeout(() => resolve(null), 60000)
            );
            const callPromise = NativeBiometric.getCredentials({
                server: BIOMETRIC_CREDENTIALS_SERVER,
            }).then(result => {
                if (result.username && result.password) {
                    console.log(`biometricService: Credentials retrieved (userLen: ${result.username.length}, passLen: ${result.password.length})`);
                    return { email: result.username, password: result.password };
                }
                console.log("biometricService: result.username or result.password missing from keychain.");
                return null;
            });

            return await Promise.race([callPromise, timeoutPromise]);
        } catch (e) {
            console.error('Failed to get credentials from biometric storage:', e);
            return null;
        }
    },

    /**
     * Remove credentials and disable biometric login
     */
    async deleteCredentials(): Promise<void> {
        try {
            await NativeBiometric.deleteCredentials({
                server: BIOMETRIC_CREDENTIALS_SERVER,
            });
            await this.setEnabled(false);
        } catch (e) {
            console.error('Failed to delete biometric credentials:', e);
        }
    },

    /**
     * Verify identity without retrieving credentials (just for check)
     */
    async verifyIdentity(): Promise<boolean> {
        try {
            const timeoutPromise = new Promise<boolean>(resolve =>
                setTimeout(() => resolve(false), 60000)
            );
            const callPromise = NativeBiometric.verifyIdentity({
                reason: 'Authenticate to TrueTrack',
                title: 'Biometric Check',
                subtitle: 'Authenticate to continue',
                description: 'Please use Face ID or Touch ID',
            }).then(() => true).catch(() => false);

            return await Promise.race([callPromise, timeoutPromise]);
        } catch (e) {
            console.error('Biometric verification failed:', e);
            return false;
        }
    }
};
