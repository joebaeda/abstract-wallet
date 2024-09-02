// /api/webauthn/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
    GenerateAuthenticationOptionsOpts,
    GenerateRegistrationOptionsOpts,
    VerifiedAuthenticationResponse,
    VerifiedRegistrationResponse,
    VerifyAuthenticationResponseOpts,
    VerifyRegistrationResponseOpts,
} from '@simplewebauthn/server';
import type {
    AuthenticationResponseJSON,
    RegistrationResponseJSON,
    PublicKeyCredentialDescriptorJSON,
    AuthenticatorDevice,
} from '@simplewebauthn/types';

export const runtime = "edge";

// In-memory store for user devices
interface User {
    id: string;
    username: string;
    devices: AuthenticatorDevice[];
}

const inMemoryUserDeviceDB: Record<string, User> = {};

// Utility function to get user by username
function getUserByUsername(username: string): User | undefined {
    return Object.values(inMemoryUserDeviceDB).find(user => user.username === username);
}

// Utility function to get a cookie from the request
function getCookie(req: NextRequest, name: string) {
    const cookie = req.cookies.get(name);
    return cookie ? cookie.value : null;
}

// Utility function to set a cookie in the response
function setCookie(res: NextResponse, name: string, value: string) {
    res.cookies.set({
        name,
        value,
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 86400,
    });
}

// Generate Registration Options
async function generateRegistrationOptionsHandler(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    let user = getUserByUsername(username);

    // If user doesn't exist, create a new user
    if (!user) {
        user = {
            id: `user-${Date.now()}`,
            username,
            devices: [],
        };
        inMemoryUserDeviceDB[user.id] = user;
    }

    const opts: GenerateRegistrationOptionsOpts = {
        rpName: 'Abstract Wallet',
        rpID: 'abstractwallet.vercel.app',
        userName: user.username,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: user.devices.map((dev) => ({
            id: dev.credentialID,
            type: 'public-key',
            transports: dev.transports,
        }) as PublicKeyCredentialDescriptorJSON),
        authenticatorSelection: {
            residentKey: 'discouraged',
            userVerification: 'preferred',
        },
        supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(opts);

    const res = NextResponse.json(options);

    // Store the challenge and username in cookies
    setCookie(res, 'currentChallenge', options.challenge);
    setCookie(res, 'username', username);

    return res;
}

// Verify Registration Response
async function verifyRegistrationHandler(req: NextRequest) {
    const body: RegistrationResponseJSON = await req.json();
    const username = getCookie(req, 'username');
    const user = getUserByUsername(username as string);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expectedChallenge = getCookie(req, 'currentChallenge');

    let verification: VerifiedRegistrationResponse;
    try {
        const opts: VerifyRegistrationResponseOpts = {
            response: body,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin: 'https://abstractwallet.vercel.app',
            expectedRPID: 'abstractwallet.vercel.app',
            requireUserVerification: false,
        };
        verification = await verifyRegistrationResponse(opts);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = registrationInfo;

        const existingDevice = user.devices.find((device) => device.credentialID === credentialID);

        if (!existingDevice) {
            const newDevice: AuthenticatorDevice = {
                credentialPublicKey,
                credentialID,
                counter,
                transports: body.response.transports,
            };
            user.devices.push(newDevice);
        }
    }

    const res = NextResponse.json({ verified });

    // Clear the challenge cookie
    setCookie(res, 'currentChallenge', '');

    return res;
}

// Generate Authentication Options
async function generateAuthenticationOptionsHandler(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const user = getUserByUsername(username as string);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: user.devices.map((dev) => ({
            id: dev.credentialID,
            type: 'public-key',
            transports: dev.transports,
        }) as PublicKeyCredentialDescriptorJSON),
        userVerification: 'preferred',
        rpID: 'abstractwallet.vercel.app',
    };

    const options = await generateAuthenticationOptions(opts);

    const res = NextResponse.json(options);

    // Store the challenge and username in cookies
    setCookie(res, 'currentChallenge', options.challenge);
    setCookie(res, 'username', username as string);

    return res;
}

// Verify Authentication Response
async function verifyAuthenticationHandler(req: NextRequest) {
    const body: AuthenticationResponseJSON = await req.json();
    const username = getCookie(req, 'username');
    const user = getUserByUsername(username as string);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expectedChallenge = getCookie(req, 'currentChallenge');

    let dbAuthenticator = user.devices.find((device) => device.credentialID === body.id);

    if (!dbAuthenticator) {
        return NextResponse.json(
            { error: 'Authenticator is not registered with this site' },
            { status: 400 }
        );
    }

    let verification: VerifiedAuthenticationResponse;
    try {
        const opts: VerifyAuthenticationResponseOpts = {
            response: body,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin: 'https://abstractwallet.vercel.app',
            expectedRPID: 'abstractwallet.vercel.app',
            authenticator: dbAuthenticator,
            requireUserVerification: false,
        };
        verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
        dbAuthenticator.counter = authenticationInfo.newCounter;
    }

    const res = NextResponse.json({ verified });

    // Clear the challenge cookie
    setCookie(res, 'currentChallenge', '');

    return res;
}

// Main API handler
export async function POST(req: NextRequest) {
    if (req.url.includes('verify-registration')) {
        return verifyRegistrationHandler(req);
    }
    if (req.url.includes('verify-authentication')) {
        return verifyAuthenticationHandler(req);
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function GET(req: NextRequest) {
    if (req.url.includes('generate-registration-options')) {
        return generateRegistrationOptionsHandler(req);
    }
    if (req.url.includes('generate-authentication-options')) {
        return generateAuthenticationOptionsHandler(req);
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
