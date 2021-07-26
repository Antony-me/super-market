import fetch from 'axios';

interface PostProps {
    route: string;
    data?: any;
}

export const post = (props: PostProps) =>
    new Promise((resolve, reject) => {
        fetch(props.route, {
            headers: {
                'Content-Type': 'application/json',
                Accept: '*/*',
            },
            data: props.data,
            method: 'POST',
        })
            .then(res => {
                resolve(res.data);
            })
            .catch(err => {
                reject(err);
            });
    });
