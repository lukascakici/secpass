import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const dbPath = path.join(os.homedir(), '.secpass-db');

export function dbExists() {
    return fs.existsSync(dbPath);
}

// Ana şifreden 32 bytelık güvenli bir anahtar üretir
function getKey(masterPassword) {
    return crypto.createHash('sha256').update(String(masterPassword)).digest();
}

export function loadDB(masterPassword) {
    if (!fs.existsSync(dbPath)) return {};
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        const [ivHex, encryptedHex] = data.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = getKey(masterPassword);
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    } catch (error) {
        return null; // Şifre yanlışsa veya dosya bozuksa null döner
    }
}

export function saveDB(db, masterPassword) {
    const iv = crypto.randomBytes(16);
    const key = getKey(masterPassword);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(db), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    fs.writeFileSync(dbPath, `${iv.toString('hex')}:${encrypted}`, 'utf8');
}