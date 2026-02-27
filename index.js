#!/usr/bin/env node

import { select, input, password as passwordPrompt } from '@inquirer/prompts';
import crypto from 'crypto';
import { loadDB, saveDB, dbExists } from './db.js';
import { handleGeneratePassword, handleSavePassword, handleViewPasswords, handleSettings, handleEditPassword } from './actions.js';

async function main() {
    console.clear();
    console.log("=== SecPass Manager ===\n");

    let masterPassword;
    let db;


    if (!dbExists()) {
        console.log("It looks like this is your first time. Let's set up a Master Password.\n");
        try {
            const newPassword = await passwordPrompt({ message: 'Create a Master Password:', mask: '*' });
            const confirmPassword = await passwordPrompt({ message: 'Confirm your Master Password:', mask: '*' });

            if (newPassword !== confirmPassword) {
                console.log("\n❌ Passwords do not match. Please try again.\n");
                process.exit(1);
            }

            let pin, confirmPin;
            while (true) {
                pin = await passwordPrompt({ message: 'Create a 4-digit PIN (for settings/recovery):', mask: '*' });
                if (!/^\d{4}$/.test(pin)) {
                    console.log("❌ PIN must be exactly 4 digits.\n");
                    continue;
                }

                confirmPin = await passwordPrompt({ message: 'Confirm your 4-digit PIN:', mask: '*' });
                if (pin !== confirmPin) {
                    console.log("❌ PINs do not match. Please try again.\n");
                    continue;
                }
                break;
            }

            const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

            masterPassword = newPassword;

            db = { __meta__: { pinHash } };
            saveDB(db, masterPassword);
            console.log("\n✅ Master Password and PIN set successfully!\n");
        } catch (error) {
            if (error.name === 'ExitPromptError') process.exit(0);
            throw error;
        }
    } else {

        while (!db) {
            try {
                masterPassword = await passwordPrompt({ message: 'Enter your Master Password:', mask: '*' });
                db = loadDB(masterPassword);

                if (db === null) {
                    console.log("❌ Incorrect Master Password. Please try again.\n");
                }
            } catch (error) {
                if (error.name === 'ExitPromptError') process.exit(0);
                throw error;
            }
        }


        if (!db.__meta__ || !db.__meta__.pinHash) {
            console.log("\n⚠️ Legacy database detected. Let's set up a 4-digit PIN for settings and recovery.\n");
            try {
                let pin, confirmPin;
                while (true) {
                    pin = await passwordPrompt({ message: 'Create a 4-digit PIN:', mask: '*' });
                    if (!/^\d{4}$/.test(pin)) {
                        console.log("❌ PIN must be exactly 4 digits.\n");
                        continue;
                    }

                    confirmPin = await passwordPrompt({ message: 'Confirm your 4-digit PIN:', mask: '*' });
                    if (pin !== confirmPin) {
                        console.log("❌ PINs do not match. Please try again.\n");
                        continue;
                    }
                    break;
                }

                const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
                db.__meta__ = db.__meta__ || {};
                db.__meta__.pinHash = pinHash;

                saveDB(db, masterPassword);
                console.log("\n✅ PIN set successfully! Your database is now up to date.\n");


                await input({ message: 'Press Enter to continue to the Main Menu...' });
            } catch (error) {
                if (error.name === 'ExitPromptError') process.exit(0);
                throw error;
            }
        }
    }

    while (true) {
        try {
            console.clear();
            console.log("=== Main Menu ===\n");

            const action = await select({
                message: 'Select an option:',
                choices: [
                    { name: 'Generate Password', value: 'Generate Password' },
                    { name: 'Saved Passwords', value: 'Saved Passwords' },
                    { name: 'Save Password', value: 'Save Password' },
                    { name: 'Edit Password', value: 'Edit Password' },
                    { name: 'Settings', value: 'Settings' },
                    { name: 'Exit', value: 'Exit' }
                ]
            });

            if (action === 'Generate Password') {
                await handleGeneratePassword(db, masterPassword);
            } else if (action === 'Save Password') {
                await handleSavePassword(db, masterPassword);
            } else if (action === 'Saved Passwords') {
                await handleViewPasswords(db, masterPassword);
            } else if (action === 'Edit Password') {
                await handleEditPassword(db, masterPassword);
            } else if (action === 'Settings') {
                masterPassword = await handleSettings(db, masterPassword);
            } else if (action === 'Exit') {
                console.clear();
                console.log("Goodbye!\n");
                process.exit(0);
            }

        } catch (error) {
            if (error.name === 'ExitPromptError') {
                continue;
            }
            throw error;
        }
    }
}

main();