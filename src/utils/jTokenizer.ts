import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { FAILURE, tokenExpiration } from '../constants';
interface SignPropTypes {
    creds: any;
}

export const sign = (props: SignPropTypes) =>
    new Promise((resolve, reject) => {
        const key = process.env.AUTHKEY;
        jwt.sign(
            {
                profile: JSON.stringify(props.creds),
            },
            `${key}`,
            // { expiresIn: 60 },
            (err: Error | null, token: string | undefined) => {
                if (err || !token) {
                    reject(err);
                } else {
                    resolve(token);
                }
            },
        );
    });

export const checker = (req: Request, res: Response, next: () => any) => {
    const authHeader = req.headers['authorization'];
    const key = process.env.AUTHKEY;
    let failure = FAILURE;
    failure.code = 401;
    failure.response = 'Authentication Failed!!!';

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, `${key}`, (err, profile: any) => {
            if (err) {
                return res.status(failure.code).json(failure);
            } else {
                next();
            }
        });
    } else {
        return res.status(failure.code).json(failure);
    }
};
