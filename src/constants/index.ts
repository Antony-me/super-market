export const PORT = 44444;
export const STORE = 'mongodb://localhost:27017/supermarket';

// EXCEPT CODES
interface exceptTypes {
    message: string;
    data?: any;
}
export const SUCCESS = (props: exceptTypes) => {
    return {
        code: 200,
        response: props.message,
        data: props.data,
    };
};

export const FAILURE = {
    code: 503,
    response: 'Service Failed...',
};

export const MALFORMED = {
    code: 400,
    response: 'Request has some malformed fields',
};

export const AVAILABLE = {
    code: 409,
    response: 'Resource Exists. Contact your administrator',
};

export const NOTFOUND = {
    code: 404,
    response: 'Resource Not Found. Contact your administrator',
};

export const PAGINATION = 10;
export const tokenExpiration = 60 * 2;
