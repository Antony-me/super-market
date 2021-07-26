export default (word: string, length: number) =>
    new Promise((resolve, reject) => {
        try {
            const theWord = word.replace(' ', '');
            resolve(
                Array.apply(null, Array(length))
                    .map(function() {
                        return theWord.charAt(Math.floor(Math.random() * theWord.length));
                    })
                    .join(''),
            );
        } catch (error) {
            reject(error);
        }
    });
