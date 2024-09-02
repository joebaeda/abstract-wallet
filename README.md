# Abstract Chain Wallet

Abstract Chain Wallet is a secure and decentralized Ethereum wallet that leverages WebAuthn for passkey-based authentication. This project allows users to create and manage their Ethereum wallets securely, storing private keys locally on their devices, encrypted with passkeys.

> **Note:** This project is a work in progress and is not yet finalized. Additional features and improvements are planned. Contributions and feedback are welcome!

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
    - [Creating a Wallet](#creating-a-wallet)
    - [Accessing a Wallet](#accessing-a-wallet)
5. [WebAuthn API Routes](#webauthn-api-routes)
    - [API Overview](#api-overview)
    - [Implementation Details](#implementation-details)
    - [Example Usage](#example-usage)
6. [Contributing](#contributing)
7. [License](#license)

## Introduction

Abstract Chain Wallet is designed to provide a seamless and secure experience for managing Ethereum wallets. By integrating WebAuthn, users can authenticate using passkeys, enhancing security and user experience.

## Features

- **Secure Wallet Creation:** Generate Ethereum wallets with private keys securely stored and encrypted on the user’s device.
- **Passkey-Based Authentication:** Leverage WebAuthn for passkey registration and authentication.
- **Local Storage:** Use IndexedDB for secure, local storage of wallet data.
- **User-Friendly Interface:** Simple and intuitive UI built with React and Next.js.

## Installation

To get started with Abstract Chain Wallet, clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/joebaeda/abstract-wallet.git
cd abstract-wallet
npm install
```

Run the development server:

```bash
npm run dev
```

## Usage

### Creating a Wallet

1. Navigate to the home page.
2. Enter your username in the input field.
3. Click the "Create Account" button.
4. Your wallet address and private key will be securely generated and stored.

### Accessing a Wallet

1. If you have already created a wallet, you can access it by clicking the "Access Account" button.
2. Authenticate using your registered passkey to reveal the private key.

## WebAuthn API Routes

The WebAuthn API routes handle the generation and verification of WebAuthn credentials for secure user authentication. These routes interact with the frontend WebAuthn utilities to register and authenticate users.

### API Overview

1. **Generate Registration Options:**
   - **Endpoint:** `GET /api/webauthn?=generate-registration-options&username={username}`
   - **Description:** Generates options for WebAuthn registration.
   - **Example Usage:**

     ```typescript
     const options = await fetch(`/api/webauthn?=generate-registration-options&username=${encodeURIComponent(username)}`, {
         method: 'GET',
     }).then((res) => res.json());
     ```

2. **Verify Registration Response:**
   - **Endpoint:** `POST /api/webauthn/verify-registration`
   - **Description:** Verifies the WebAuthn registration response.
   - **Example Usage:**

     ```typescript
     await fetch('/api/webauthn/verify-registration', {
         method: 'POST',
         body: JSON.stringify({ ...credential, username }),
         headers: {
             'Content-Type': 'application/json',
         },
     });
     ```

3. **Generate Authentication Options:**
   - **Endpoint:** `GET /api/webauthn?=generate-authentication-options&username={username}`
   - **Description:** Generates options for WebAuthn authentication.
   - **Example Usage:**

     ```typescript
     const options = await fetch(`/api/webauthn?=generate-authentication-options&username=${encodeURIComponent(username)}`, {
         method: 'GET',
     }).then((res) => res.json());
     ```

4. **Verify Authentication Response:**
   - **Endpoint:** `POST /api/webauthn/verify-authentication`
   - **Description:** Verifies the WebAuthn authentication response.
   - **Example Usage:**

     ```typescript
     await fetch('/api/webauthn/verify-authentication', {
         method: 'POST',
         body: JSON.stringify({ ...credential, username }),
         headers: {
             'Content-Type': 'application/json',
         },
     });
     ```

### Implementation Details

- **In-Memory User Device Store:**
  - Simplified in-memory store for managing user devices and WebAuthn credentials.
  
  ```typescript
  interface User {
      id: string;
      username: string;
      devices: AuthenticatorDevice[];
  }

  const inMemoryUserDeviceDB: Record<string, User> = {};
  ```

- **Utility Functions:**
  - `getUserByUsername(username: string)`: Retrieves a user by username.
  - `getCookie(req: NextRequest, name: string)`: Retrieves a cookie from the request.
  - `setCookie(res: NextResponse, name: string, value: string)`: Sets a cookie in the response.

- **Runtime:**
  - The API runs in the edge environment for better performance.

  ```typescript
  export const runtime = "edge";
  ```

### Example Usage

These WebAuthn API routes are integrated with frontend utilities (`/utils/webauthn.ts`) to manage passkey registration and authentication, providing a secure way to create and access Ethereum wallets.

## Contributing

Contributions to Abstract Chain Wallet are welcome! Feel free to submit pull requests, report issues, or suggest new features. Since the project is still in development, your contributions can have a significant impact on the final product.

## License

This project is licensed under the MIT License. See the [LICENSE](/LICENSE.txt) file for details.
