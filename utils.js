import crypto from 'crypto';
import { execSync } from 'child_process';
import os from 'os';

export function copyToClipboard(text) {
    const platform = os.platform();
    try {
        if (platform === 'darwin') execSync('pbcopy', { input: text });
        else if (platform === 'win32') execSync('clip', { input: text });
        else execSync('xclip -selection clipboard', { input: text });
        console.log("📋 Copied to clipboard!\n");
    } catch (error) {
        console.log("⚠️ Could not copy to clipboard automatically.\n");
    }
}

export function generatePassword(len = 16, options = { uppercase: true, lowercase: true, numbers: true, symbols: true }) {
    
    const charSets = {
        lowercase: 'abcdefghijkmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
        numbers: '23456789',
        symbols: '!@#$%^&*()_+-='
    };

    let availableChars = '';
    let passChars = [];

    if (options.lowercase) {
        availableChars += charSets.lowercase;
        passChars.push(charSets.lowercase[crypto.randomInt(0, charSets.lowercase.length)]);
    }
    if (options.uppercase) {
        availableChars += charSets.uppercase;
        passChars.push(charSets.uppercase[crypto.randomInt(0, charSets.uppercase.length)]);
    }
    if (options.numbers) {
        availableChars += charSets.numbers;
        passChars.push(charSets.numbers[crypto.randomInt(0, charSets.numbers.length)]);
    }
    if (options.symbols) {
        availableChars += charSets.symbols;
        passChars.push(charSets.symbols[crypto.randomInt(0, charSets.symbols.length)]);
    }

    if (availableChars.length === 0) return '';

    // Kalan uzunluğu rastgele doldur
    for (let i = passChars.length; i < len; i++) {
        passChars.push(availableChars[crypto.randomInt(0, availableChars.length)]);
    }

    // Fisher-Yates Shuffle ile karıştır
    for (let i = passChars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [passChars[i], passChars[j]] = [passChars[j], passChars[i]];
    }

    // Şifreyi araya tire koymadan doğrudan, akıcı bir şekilde döndürüyoruz
    return passChars.join('');

}