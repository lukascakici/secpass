# 🛡️ SecPass Manager

A lightning-fast, terminal-based (CLI) password manager. Generate strong passwords, encrypt them with AES-256-CBC, and manage everything securely from your command line — no cloud, no tracking, no nonsense.

---

## Features

Secure Encryption: All data is encrypted locally using AES-256-CBC with your Master Password.

Zero-Knowledge Design: Your Master Password is never stored — it is only used to derive your encryption key.

Smart Password Generator: Generates ultra-strong, high-entropy passwords designed to resist brute-force and dictionary attacks.

Clipboard Integration: Automatically copies selected passwords to your clipboard (Windows, macOS, Linux supported).

PIN Recovery System: Reset your Master Password securely using your 4-digit recovery PIN.

Local-Only Storage: All data is stored in `~/.secpass-db` on your machine. Nothing ever leaves your system.

---

## Installation

Install the package globally using npm to access the `secpass` command from anywhere:

npm install -g secpass

---

## Usage

Once installed, use the `secpass` command to start the interactive manager.

secpass

---

### 1. Generate a Password

Create a strong password with a custom length and optionally save it immediately.

Flow:
- Choose password length
- Generate password
- Save to a service (optional)
- Auto-copy to clipboard

---

### 2. View Saved Passwords

Browse stored services and usernames, then copy the selected password directly to your clipboard.

---

### 3. Save a Password Manually

Store a new entry by providing:
- Service name
- Username or email
- Password

---

### 4. Reset Master Password

Securely reset your Master Password.

Requirements:
- Current Master Password
- 4-digit Recovery PIN

---

### 5. Exit

Safely close the application.

---

## Security Model

Encryption Algorithm: AES-256-CBC  
Key Derivation: Master Password → 256-bit encryption key  
Storage Location: `~/.secpass-db`  
Internet Access: None  

SecPass runs completely offline and does not communicate with any external servers.

---

## License

This project is licensed under the MIT License.