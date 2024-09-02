"use client"

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { set, get } from 'idb-keyval';
import { registerPasskey, authenticatePasskey } from '@/utils/webauthn';
import Image from 'next/image';

interface WalletData {
    username: string;
    address: string;
    privateKey: string;
    iv: string;  // Include this if you're using it for encryption
}


const Home = () => {
    const [username, setUsername] = useState<string>('');
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [showPrivateKey, setShowPrivateKey] = useState<string>('');

    useEffect(() => {
        const loadWallet = async () => {
            const storedWallet = await get<WalletData>('wallet');
            if (storedWallet) {
                setWallet(storedWallet);
            }
        };
        loadWallet();
    }, []);

    const createWallet = async () => {
        try {
            const newWallet = ethers.Wallet.createRandom();
            const walletData: WalletData = {
                username: username,
                address: newWallet.address,
                privateKey: newWallet.privateKey,
                iv: '',  // Initialize IV
            };

            const key = await registerPasskey(username);
            const iv = crypto.getRandomValues(new Uint8Array(12));  // Generate a random IV
            const encryptedPrivateKey = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                new TextEncoder().encode(walletData.privateKey)
            );

            walletData.privateKey = JSON.stringify(Array.from(new Uint8Array(encryptedPrivateKey)));
            walletData.iv = JSON.stringify(Array.from(iv));  // Store IV as string

            await set('wallet', walletData);
            setWallet(walletData);
        } catch (error) {
            console.error('Error creating wallet:', error);
        }
    };

    const accessWallet = async () => {
        try {
            if (wallet) {
                const key = await authenticatePasskey(wallet.username);
                const iv = new Uint8Array(JSON.parse(wallet.iv));  // Retrieve IV

                const decryptedPrivateKey = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv },
                    key,
                    new Uint8Array(JSON.parse(wallet.privateKey))
                );
                const privateKey = new TextDecoder().decode(decryptedPrivateKey);
                setShowPrivateKey(privateKey);
            }
        } catch (error) {
            console.error('Error accessing wallet:', error);
        }
    };

    return (
        <div className="flex items-center bg-gray-100 justify-center min-h-screen">
            <div className="w-full max-w-sm p-4 bg-transparent sm:bg-white sm:rounded-2xl">
                {!wallet ? (
                    <div className="flex flex-col justify-between items-center">
                        <Image src={"/chad-supporter.png"} width={250} height={250} alt="Abstract Wallet" priority={true} />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-300 text-gray-500 p-3 focus:outline-none placeholder:opacity-30 mb-2 rounded-2xl"
                        />
                        <button onClick={createWallet} className="w-full py-3 bg-blue-500 hover:bg-blue-800 text-white p-2 rounded-2xl">
                            Create Account
                        </button>
                    </div>
                ) : (
                    <div>
                        <p><strong>Address:</strong> {wallet.address}</p>
                        <p><strong>Private Key:</strong> {showPrivateKey}</p>
                        <button onClick={accessWallet} className="w-full py-3 bg-green-500 text-white p-2 rounded-2xl">
                            Access Account
                        </button>
                    </div>
                )}
                <p className="mt-4 text-center text-gray-500 text-sm">
                    Just for experimental purposes only. Please do not use it for storing real assets or sensitive information.
                </p>

                <div className="flex justify-center mt-4 space-x-4">
                    <a href="https://github.com/joebaeda" target="_blank" rel="noopener noreferrer">
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 2a14 14 0 0 0-4.43 27.28c.7.13 1-.3 1-.67v-2.38c-3.89.84-4.71-1.88-4.71-1.88a3.7 3.7 0 0 0-1.62-2.05c-1.27-.86.1-.85.1-.85a2.94 2.94 0 0 1 2.14 1.45 3 3 0 0 0 4.08 1.16 2.93 2.93 0 0 1 .88-1.87c-3.1-.36-6.37-1.56-6.37-6.92a5.4 5.4 0 0 1 1.44-3.76 5 5 0 0 1 .14-3.7s1.17-.38 3.85 1.43a13.3 13.3 0 0 1 7 0c2.67-1.81 3.84-1.43 3.84-1.43a5 5 0 0 1 .14 3.7 5.4 5.4 0 0 1 1.44 3.76c0 5.38-3.27 6.56-6.39 6.91a3.33 3.33 0 0 1 .95 2.59v3.84c0 .46.25.81 1 .67A14 14 0 0 0 16 2" />
                            <path fill="none" d="M0 0h32v32H0z" />
                        </svg>
                    </a>
                    <a href="https://t.me/joebaeda" target="_blank" rel="noopener noreferrer">
                        <svg height="32" width="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 189.473 189.473" xmlSpace="preserve">
                            <path d="M152.531 179.476c-1.48 0-2.95-.438-4.211-1.293l-47.641-32.316-25.552 18.386a7.502 7.502 0 0 1-11.633-4.174l-12.83-48.622L4.821 93.928a7.501 7.501 0 0 1-.094-13.975l174.312-69.36a7.503 7.503 0 0 1 10.282 8.408L159.898 173.38a7.5 7.5 0 0 1-7.367 6.096m-47.669-48.897 42.437 28.785L170.193 39.24l-82.687 79.566 17.156 11.638q.103.065.2.135m-35.327-6.401 5.682 21.53 12.242-8.809-16.03-10.874a7.5 7.5 0 0 1-1.894-1.847M28.136 86.782l31.478 12.035a7.5 7.5 0 0 1 4.573 5.092l3.992 15.129a7.5 7.5 0 0 1 2.259-4.624L149.227 38.6z" />
                        </svg>
                    </a>
                    <a href="https://x.com/joebaeda" target="_blank" rel="noopener noreferrer">
                        <svg width="32" height="32" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.47 6.77 15.3 0h-1.4L8.85 5.88 4.81 0H.15l6.11 8.9L.15 16h1.38l5.35-6.21L11.14 16h4.67zm-1.9 2.2-.61-.88-4.93-7.05h2.12l3.98 5.69.62.88 5.17 7.4h-2.13L7.58 8.97Z" fill="#000" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Home;
