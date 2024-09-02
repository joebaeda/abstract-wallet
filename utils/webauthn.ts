// /utils/webauthn.ts

import {
    startRegistration,
    startAuthentication,
} from '@simplewebauthn/browser';

export const registerPasskey = async (username: string) => {
    try {
        // Generate registration options with the username
        const options = await fetch(`/api/webauthn?=generate-registration-options&username=${encodeURIComponent(username)}`, {
            method: 'GET',
        }).then((res) => res.json());

        // Start the WebAuthn registration
        const credential = await startRegistration(options);

        // Verify the registration response with the server
        await fetch('/api/webauthn/verify-registration', {
            method: 'POST',
            body: JSON.stringify({ ...credential, username }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Example key derivation process (optional)
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(username),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new TextEncoder().encode('unique-salt'),
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    } catch (error) {
        console.error('Error during passkey registration:', error);
        throw error;
    }
};

export const authenticatePasskey = async (username: string) => {
    try {
        // Generate authentication options with the username
        const options = await fetch(`/api/webauthn?=generate-authentication-options&username=${encodeURIComponent(username)}`, {
            method: 'GET',
        }).then((res) => res.json());

        // Start the WebAuthn authentication
        const credential = await startAuthentication(options);

        // Verify the authentication response with the server
        await fetch('/api/webauthn/verify-authentication', {
            method: 'POST',
            body: JSON.stringify({ ...credential, username }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Example key derivation process (optional)
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(username),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new TextEncoder().encode('unique-salt'),
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    } catch (error) {
        console.error('Error during passkey authentication:', error);
        throw error;
    }
};
