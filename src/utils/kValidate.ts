import { MALFORMED } from '../constants';
interface CheckerPropTypes {
    schema: string[];
    fields: string[];
}

export const comprehensive = (props: CheckerPropTypes) =>
    new Promise(async (resolve, reject) => {
        await match({
            schema: props.schema,
            fields: props.fields,
        })
            .then(() => {
                if (props.fields.length === props.schema.length) {
                    resolve(true);
                } else {
                    reject(MALFORMED);
                }
            })
            .catch(() => {
                reject(MALFORMED);
            });
    });

export const match = (props: CheckerPropTypes) =>
    new Promise(async (resolve, reject) => {
        let _missingFields = [];

        for (let i = 0; i < props.schema.length; i += 1) {
            let available = false;

            props.fields.forEach(field => {
                if (field === props.schema[i]) {
                    available = true;
                }
            });

            if (!available) {
                _missingFields.push(props.schema[i]);
            }
        }

        if (_missingFields.length > 0) {
            reject(MALFORMED);
        } else {
            resolve(true);
        }
    });
