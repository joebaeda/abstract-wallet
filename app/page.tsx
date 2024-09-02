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
                        <Image src={"/chad-supporter.png"} width={250} height={250} alt="Abstract Wallet" priority={true}/>
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
            </div>
        </div>
    );
};

export default Home;
