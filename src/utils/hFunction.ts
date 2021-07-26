import * as bcrypt from 'bcryptjs';

export const hash = (secret: string, rounds: number = 10) =>
    new Promise((resolve, reject) => {
        bcrypt.hash(secret, rounds, (error, hash) => {
            if (error) reject(error);
            resolve(hash);
        });
    });

export const compare = (hash: string, secret: string) =>
    new Promise((resolve, reject) => {
        bcrypt.compare(secret, hash, (err: Error, match: Boolean) => {
            if (err || !match) {
                reject(err);
            } else {
                resolve(match);
            }
        });
    });
