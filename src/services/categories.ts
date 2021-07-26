import { Categories } from '../models';
import { Request, Response } from 'express';
import { Document } from 'mongoose';
import { FAILURE, AVAILABLE, MALFORMED, NOTFOUND, SUCCESS } from '../constants';
import { fieldValidators } from '../utils';

export default class CategoryManager {
    public delete = (req: Request, res: Response) => {
        const _categoryId = req.params.categoryId;
        // const query = Categories.findById(_categoryId, (error, Categories) => {});
        // return query.exec((error: Error, category) => {
        //     if (error) {
        //         const failure = FAILURE;
        //         failure.response = 'We could not delete the Category at this time...';
        //         return res.status(failure.code).json(failure);
        //     }

        //     if (!category) {
        //         const failure = NOTFOUND;
        //         failure.response = 'We could not find that Category..';
        //         return res.status(failure.code).json(failure);
        //     }

        //     return category
        //         .remove()
        //         .then(() => {
        //             const success = SUCCESS({
        //                 message: 'Category deleted Successfully...',
        //             });

        //             return res.status(success.code).json(success);
        //         })
        //         .catch(err => {
        //             console.log(err);
        //             const failure = FAILURE;
        //             failure.response = 'We could not delete the Category at this time...';
        //             return res.status(failure.code).json(failure);
        //         });
        // });
    };

    public fetch = (req: Request, res: Response) => {
        const query = Categories.find({}).lean();
        return query.exec((error: Error, results: Document) => {
            if (error) {
                const failure = FAILURE;
                failure.response = 'Sorry, We could not get the categories at this time';
                return res.status(failure.code).json(failure);
            }

            if (results && Object.keys(results).length > 0) {
                const success = SUCCESS({
                    message: 'Categories Found..',
                    data: results,
                });

                return res.status(success.code).json(success);
            }

            const failure = NOTFOUND;
            failure.response = "We couldn't find categories at this time...";
            return res.status(failure.code).json(failure);
        });
    };

    public update = (req: Request, res: Response) => {
        const _categoryId = req.params.categoryId,
            _data = req.body;

        return fieldValidators
            .comprehensive({
                schema: ['name'],
                fields: Object.keys(_data),
            })
            .then(() => {
                if (_data['name'] == '') {
                    const failure = MALFORMED;
                    failure.response = 'Kindly use a valid Category Name';
                    return res.status(failure.code).json(failure);
                }

                const _category = `${String(_data.name)
                    .charAt(0)
                    .toUpperCase()}${String(_data.name)
                    .slice(1)
                    .toLocaleLowerCase()}`;

                this.check(_category)
                    .then(() => {
                        const query = Categories.findByIdAndUpdate(_categoryId, _data, {
                            new: true,
                            runValidators: true,
                        });
                        query.exec((error: Error, result: Document) => {
                            if (error) {
                                console.log(error);
                                const failure = FAILURE;
                                failure.response = 'We could not update the category at this time...';
                                return res.status(failure.code).json(failure);
                            }

                            if (!result) {
                                const failure = NOTFOUND;
                                failure.response = 'We could not find that Category..';
                                return res.status(failure.code).json(failure);
                            }

                            const success = SUCCESS({
                                message: 'Category Updated...',
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
        const query = Categories.find({ name: { $regex: _searchTerm } }).lean();

        return query.exec((error: Error, results: Document) => {
            if (error) {
                const failure = FAILURE;
                failure.response = 'We could not find the category at this time.';
                return res.status(failure.code).json(failure);
            }

            if (results && Object.keys(results).length > 0) {
                const success = SUCCESS({
                    message: 'Category Found',
                    data: results,
                });

                return res.status(success.code).json(success);
            } else {
                const failure = NOTFOUND;
                failure.response = 'We could not find that Category..';
                return res.status(failure.code).json(failure);
            }
        });
    };

    public check = (category: String) =>
        new Promise((resolve, reject) => {
            const query = Categories.findOne({ name: category });

            return query.exec((error: Error, _category: Document) => {
                if (error) {
                    const failure = FAILURE;
                    failure.response = "We couldn't validate the Category at this time";
                    return reject(failure);
                }

                if (_category && _category._id) {
                    const failure = AVAILABLE;
                    failure.response = `The category ${category} has already been registered`;
                    return reject(failure);
                }

                return resolve(true);
            });
        });

    public register = (category: String) =>
        new Promise((resolve, reject) => {
            const _category = `${String(category)
                .charAt(0)
                .toUpperCase()}${String(category)
                .slice(1)
                .toLocaleLowerCase()}`;

            return this.check(_category)
                .then(() => {
                    const category = new Categories({ name: _category });
                    return category.save((error: Error, _cat: Document) => {
                        if (error) {
                            let failure = FAILURE;
                            failure.response = `Category Registration Failed. ${error.message}`;
                            return reject(failure);
                        }

                        const success = SUCCESS({
                            message: 'Category Registered Successfully.',
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

    public newCategory = (req: Request, res: Response) => {
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
