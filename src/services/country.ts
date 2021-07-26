import { Countries } from '../models';
import { Request, Response } from 'express';
import { Document } from 'mongoose';
import { FAILURE, AVAILABLE, MALFORMED, NOTFOUND, SUCCESS } from '../constants';
import { fieldValidators } from '../utils';

export default class CountryManager {
    public delete = (req: Request, res: Response) => {
        const _countryId = req.params.countryId;
            // const query = Countries.findById(_countryId, (error, countries) => {});
            // return query.exec((error: Error, country) => {
            //     if (error) {
            //         const failure = FAILURE;
            //         failure.response = 'We could not delete the country at this time...';
            //         return res.status(failure.code).json(failure);
            //     }

            //     if (!country) {
            //         const failure = NOTFOUND;
            //         failure.response = 'We could not find that country..';
            //         return res.status(failure.code).json(failure);
            //     }

            //     return country
            //         .remove()
            //         .then(() => {
            //             const success = SUCCESS({
            //                 message: 'country deleted Successfully...',
            //             });

            //             return res.status(success.code).json(success);
            //         })
            //         .catch(err => {
            //             console.log(err);
            //             const failure = FAILURE;
            //             failure.response = 'We could not delete the country at this time...';
            //             return res.status(failure.code).json(failure);
            //         });
            // });
    };

    public fetch = (req: Request, res: Response) => {
        const query = Countries.find({}).lean();
        return query.exec((error: Error, results: Document) => {
            if (error) {
                const failure = FAILURE;
                failure.response = 'Sorry, We could not get the countries at this time';
                return res.status(failure.code).json(failure);
            }

            if (results && Object.keys(results).length > 0) {
                const success = SUCCESS({
                    message: 'countries Found..',
                    data: results,
                });

                return res.status(success.code).json(success);
            }

            const failure = NOTFOUND;
            failure.response = "We couldn't find countries at this time...";
            return res.status(failure.code).json(failure);
        });
    };

    public update = (req: Request, res: Response) => {
        const _countryId = req.params.countryId,
            _data = req.body;

        return fieldValidators
            .comprehensive({
                schema: ['name'],
                fields: Object.keys(_data),
            })
            .then(() => {
                if (_data['name'] == '') {
                    const failure = MALFORMED;
                    failure.response = 'Kindly use a valid Country Name';
                    return res.status(failure.code).json(failure);
                }

                const _country = `${String(_data.name)
                    .charAt(0)
                    .toUpperCase()}${String(_data.name)
                    .slice(1)
                    .toLocaleLowerCase()}`;

                this.check(_country)
                    .then(() => {
                        const query = Countries.findByIdAndUpdate(_countryId, _data, {
                            new: true,
                            runValidators: true,
                        });
                        query.exec((error: Error, result: Document) => {
                            if (error) {
                                console.log(error);
                                const failure = FAILURE;
                                failure.response = 'We could not update the country at this time...';
                                return res.status(failure.code).json(failure);
                            }

                            if (!result) {
                                const failure = NOTFOUND;
                                failure.response = 'We could not find that Country..';
                                return res.status(failure.code).json(failure);
                            }

                            const success = SUCCESS({
                                message: 'country Updated...',
                                data: result,
                            });

                            return res.status(success.code).json(success);
                        });
                    })
                    .catch(error => {
                        return res.status(error.code).json(error);
                    });
            })
            .catch(error => {
                return res.status(error.code).json(error);
            });
    };

    public find = (req: Request, res: Response) => {
        const _searchTerm = new RegExp(`^${req.params['searchTerm']}`, 'i');
        const query = Countries.find({ name: { $regex: _searchTerm } }).lean();

        return query.exec((error: Error, results: Document) => {
            if (error) {
                const failure = FAILURE;
                failure.response = 'We could not find the country at this time.';
                return res.status(failure.code).json(failure);
            }

            if (results && Object.keys(results).length > 0) {
                const success = SUCCESS({
                    message: 'country Found',
                    data: results,
                });

                return res.status(success.code).json(success);
            } else {
                const failure = NOTFOUND;
                failure.response = 'We could not find that country..';
                return res.status(failure.code).json(failure);
            }
        });
    };

    public check = (country: String) =>
        new Promise((resolve, reject) => {
            const query = Countries.findOne({ name: country });

            return query.exec((error: Error, _country: Document) => {
                if (error) {
                    const failure = FAILURE;
                    failure.response = "We couldn't validate the country at this time";
                    return reject(failure);
                }

                if (_country && _country._id) {
                    const failure = AVAILABLE;
                    failure.response = `The country ${country} has already been registered`;
                    return reject(failure);
                }

                return resolve(true);
            });
        });

    public register = (country: String) =>
        new Promise((resolve, reject) => {
            const _country = `${String(country)
                .charAt(0)
                .toUpperCase()}${String(country)
                .slice(1)
                .toLocaleLowerCase()}`;

            return this.check(_country)
                .then(() => {
                    const country = new Countries({ name: _country });
                    return country.save((error: Error, _cat: Document) => {
                        if (error) {
                            let failure = FAILURE;
                            failure.response = `country Registration Failed. ${error.message}`;
                            return reject(failure);
                        }

                        const success = SUCCESS({
                            message: 'country Registered Successfully.',
                            data: {
                                _id: _cat._id,
                                name: _cat.get('name'),
                            },
                        });

                        return resolve(success);
                    });
                })
                .catch(error => {
                    return reject(error);
                });
        });

    public newCountry = (req: Request, res: Response) => {
        const _data = req.body;

        fieldValidators
            .comprehensive({
                fields: Object.keys(_data),
                schema: ['name'],
            })
            .then(() => {
                return this.register(_data.name)
                    .then((response: any) => {
                        return res.status(response.code).json(response);
                    })
                    .catch(error => {
                        return res.status(error.code).json(error);
                    });
            })
            .catch(error => {
                return res.status(error.code).json(error);
            });
    };
}
