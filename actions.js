import { select, input, password as passwordPrompt } from '@inquirer/prompts';
import crypto from 'crypto';
import { saveDB } from './db.js';
import { generatePassword, copyToClipboard } from './utils.js';

export async function handleGeneratePassword(db, masterPassword) {
    console.clear();
    console.log("=== Generate Password ===\n");

    const lengthInput = await input({
        message: 'Enter password length (type "c" to cancel):',
        default: '16'
    });

    if (lengthInput.toLowerCase() === 'c') return;

    let len = parseInt(lengthInput, 10);
    if (isNaN(len) || len < 4) len = 16;

    const pwd = generatePassword(len);
    console.log(`\n🔑 Generated: ${pwd}\n`);
    copyToClipboard(pwd);

    console.log();

    const shouldSave = await select({
        message: 'Would you like to save this generated password?',
        choices: [
            { name: 'Yes, save it', value: true },
            { name: 'No, back to menu', value: false }
        ]
    });

    if (shouldSave) {
        const service = await input({ message: 'Service name (e.g. github) [Leave empty to cancel]:' });
        if (!service.trim()) return;

        const identifier = await input({ message: 'Username or Email (Enter "-" to skip, "c" to cancel):' });
        if (identifier.toLowerCase() === 'c') return;

        db[service] = {
            username: identifier.trim() === '-' ? '' : identifier.trim(),
            password: pwd
        };

        saveDB(db, masterPassword);
        console.log(`\n✅ Password and details saved for '${service}'!`);
    }

    await input({ message: '\nPress Enter to return to menu...' });
}

export async function handleSavePassword(db, masterPassword) {
    console.clear();
    console.log("=== Save Password ===\n");

    const service = await input({ message: 'Service name (e.g. github) [Leave empty to cancel]:' });
    if (!service.trim()) return;

    const identifier = await input({ message: 'Username or Email (Enter "-" to skip, "c" to cancel):' });
    if (identifier.toLowerCase() === 'c') return;

    let newPassword, confirmPassword;
    while (true) {
        newPassword = await passwordPrompt({ message: 'Enter the password:', mask: '*' });
        confirmPassword = await passwordPrompt({ message: 'Confirm the password:', mask: '*' });

        if (newPassword === confirmPassword) break;

        console.log("❌ Passwords do not match. Please try again.\n");
    }

    db[service] = {
        username: identifier.trim() === '-' ? '' : identifier.trim(),
        password: newPassword
    };

    saveDB(db, masterPassword);
    console.log(`\n✅ Password and details saved for '${service}'!`);

    await input({ message: '\nPress Enter to return to menu...' });
}

export async function handleViewPasswords(db, masterPassword) {
    while (true) {
        console.clear();
        console.log("=== Saved Passwords ===\n");

        const services = Object.keys(db).filter(k => k !== '__meta__');
        if (services.length === 0) {
            console.log("No passwords saved yet.");
            await input({ message: '\nPress Enter to return to menu...' });
            return;
        }

        const serviceChoices = services.map(s => ({ name: s, value: s }));
        serviceChoices.push({ name: '← Go Back', value: 'Go Back' });

        const selectedService = await select({
            message: 'Select a service to view/copy:',
            choices: serviceChoices
        });

        if (selectedService === 'Go Back') return;

        console.clear();
        console.log(`=== ${selectedService} ===\n`);

        const entry = db[selectedService];

        // If the entry was deleted or renamed in a sub-menu loop we should break out
        if (!entry) break;

        const passToCopy = typeof entry === 'string' ? entry : entry.password;
        const userToDisplay = typeof entry === 'object' && entry.username ? entry.username : 'Not provided';

        console.log(`👤 Username/Email: ${userToDisplay}`);
        console.log(`🔑 Retrieved password!`);
        copyToClipboard(passToCopy);

        await input({ message: '\nPress Enter to go back...' });
    }
}

export async function handleSettings(db, masterPassword) {
    while (true) {
        console.clear();
        console.log("=== Settings ===\n");

        const settingAction = await select({
            message: 'Select an option:',
            choices: [
                { name: 'Reset Master Password', value: 'Reset Master Password' },
                { name: '← Go Back', value: 'Go Back' }
            ]
        });

        if (settingAction === 'Go Back') break;

        if (settingAction === 'Reset Master Password') {
            const currentPassword = await passwordPrompt({ message: 'Enter CURRENT Master Password:', mask: '*' });

            if (currentPassword !== masterPassword) {
                console.log("\n❌ Incorrect Current Master Password. Reset failed.");
                await input({ message: '\nPress Enter to return...' });
                continue;
            }

            const enteredPin = await passwordPrompt({ message: 'Enter your 4-digit PIN:', mask: '*' });
            const enteredPinHash = crypto.createHash('sha256').update(enteredPin).digest('hex');

            if (db.__meta__ && db.__meta__.pinHash === enteredPinHash) {
                const newPassword = await passwordPrompt({ message: 'Enter NEW Master Password:', mask: '*' });
                const confirmPassword = await passwordPrompt({ message: 'Confirm NEW Master Password:', mask: '*' });

                if (newPassword === confirmPassword) {
                    masterPassword = newPassword;
                    saveDB(db, masterPassword);
                    console.log("\n✅ Master Password updated successfully!");
                } else {
                    console.log("\n❌ Passwords do not match.");
                }
            } else {
                console.log("\n❌ Incorrect PIN. Reset failed.");
            }
            await input({ message: '\nPress Enter to return...' });
        }
    }
    return masterPassword;
}

export async function handleEditPassword(db, masterPassword) {
    while (true) {
        console.clear();
        console.log("=== Edit Password ===\n");

        const services = Object.keys(db).filter(k => k !== '__meta__');
        if (services.length === 0) {
            console.log("No passwords saved yet.");
            await input({ message: '\nPress Enter to return to menu...' });
            return;
        }

        const serviceChoices = services.map(s => ({ name: s, value: s }));
        serviceChoices.push({ name: '← Go Back', value: 'Go Back' });

        const selectedService = await select({
            message: 'Select a service to edit:',
            choices: serviceChoices
        });

        if (selectedService === 'Go Back') return;

        const entry = db[selectedService];
        const currentPassword = typeof entry === 'string' ? entry : entry.password;
        const currentUsername = typeof entry === 'object' && entry.username ? entry.username : '';

        console.clear();
        console.log(`=== Edit: ${selectedService} ===\n`);

        const newService = await input({ message: 'Service name:', default: selectedService });
        if (!newService.trim()) {
            console.log("❌ Service name cannot be empty.");
            await input({ message: '\nPress Enter to go back...' });
            continue;
        }

        if (newService !== selectedService && db[newService]) {
            const overwrite = await select({
                message: `Service '${newService}' already exists. Overwrite?`,
                choices: [
                    { name: 'Yes', value: true },
                    { name: 'No', value: false }
                ]
            });
            if (!overwrite) continue;
        }

        const newUsername = await input({ message: 'Username or Email (Enter "-" to leave empty):', default: currentUsername || '-' });

        const changePassword = await select({
            message: 'Do you want to change the password?',
            choices: [
                { name: 'No, keep current password', value: 'keep' },
                { name: 'Yes, enter new password manually', value: 'manual' },
                { name: 'Yes, generate a new password', value: 'generate' }
            ]
        });

        let finalPassword = currentPassword;

        if (changePassword === 'manual') {
            while (true) {
                const p1 = await passwordPrompt({ message: 'Enter the new password:', mask: '*' });
                const p2 = await passwordPrompt({ message: 'Confirm the new password:', mask: '*' });
                if (p1 === p2) {
                    finalPassword = p1;
                    break;
                }
                console.log("❌ Passwords do not match. Please try again.\n");
            }
        } else if (changePassword === 'generate') {
            const lengthInput = await input({
                message: 'Enter password length:',
                default: '16'
            });
            let len = parseInt(lengthInput, 10);
            if (isNaN(len) || len < 4) len = 16;

            finalPassword = generatePassword(len);
            console.log(`\n🔑 New generated password: ${finalPassword}\n`);
            copyToClipboard(finalPassword);
            console.log("✅ Copied to clipboard!");
        }

        const enteredPin = await passwordPrompt({ message: 'Enter your 4-digit PIN to save changes:', mask: '*' });
        const enteredPinHash = crypto.createHash('sha256').update(enteredPin).digest('hex');

        if (!db.__meta__ || db.__meta__.pinHash !== enteredPinHash) {
            console.log("\n❌ Incorrect PIN. Changes not saved.");
            await input({ message: '\nPress Enter to go back...' });
            continue;
        }

        if (newService !== selectedService) {
            delete db[selectedService];
        }

        db[newService] = {
            username: newUsername.trim() === '-' ? '' : newUsername.trim(),
            password: finalPassword
        };

        saveDB(db, masterPassword);
        console.log(`\n✅ Password and details updated for '${newService}'!`);
        await input({ message: '\nPress Enter to return...' });
        return;
    }
}