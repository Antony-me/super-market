import { Request, Response } from 'express';
import { Document } from 'mongoose';
import { Categories, Repository } from '../models';
import { fieldValidators } from '../utils';
import CategoryControl from './categories';
import { FAILURE, NOTFOUND, AVAILABLE, SUCCESS, MALFORMED, PAGINATION } from '../constants';

export default class ProductManager {
    private catManager: CategoryControl;

    constructor() {
        this.catManager = new CategoryControl();
    
    }

    public catCheck = (category: String) =>
        new Promise((resolve, reject) => {
            const searchTerm = new RegExp(`^${category}`, 'i');
            const query = Categories.findOne({ name: { $regex: searchTerm } }).lean();
            return query.exec((error: Error, catDoc: Document) => {
                if (error) {
                    const failure = FAILURE;
                    failure.response = `Error verifying category at this time. ${error.message}`;
                    return reject(failure);
                }

                if (!catDoc || !catDoc._id) {
                    return this.catManager
                        .register(category)
                        .then((response: any) => {
                            const { data } = response;
                            return resolve(data._id);
                        })
                        .catch(error => {
                            const failure = FAILURE;
                            failure.response = `Failed to register Category at this time. ${error.message ||
                                error.response}`;

                            return reject(failure);
                        });
                }

                return resolve(catDoc._id);
            });
        });


    public dupCheck = (_data: any) =>
        new Promise((resolve, reject) => {
            if (_data['name'] && _data['name'] !== '') {
                const query = Repository.findOne({ name: _data['name'] });
                return query.exec((error: Error, product: Document) => {
                    if (error) {
                        const failure = FAILURE;
                        failure.response = "We couldn't verify your entry at this time. Try again Later...";
                        return reject(failure);
                    }

                    if (product && product._id) {
                        if (_data['_id'] && _data['_id'] === String(product.get('_id'))) {
                            if (_data['name'] === String(product.get('name'))) {
                                delete _data['name'];
                                return resolve(_data);
                            }

                            return resolve(_data);
                        }

                        const failure = AVAILABLE;
                        failure.response = 'Duplicate entry discovered...';
                        return reject(failure);
                    }

                    return resolve(_data);
                });
            }

            return resolve(_data);
        });

    public register = (_data: any) =>
        new Promise((resolve, reject) => {
            const product = new Repository(_data);
            return product.save((error: Error, product: Document) => {
                if (error) {
                    const failure = MALFORMED;
                    const fields = Object.keys(Repository.schema.paths);
                    const indexOfCat = fields.indexOf('category');
                    if (indexOfCat > -1) fields.splice(indexOfCat, 1);
                    fields.pop();
                    fields.splice(fields.length - 1, 1);
                    failure.response = `We couldn't save the record at this time. Ensure you're using the right field properties: ${fields.join(
                        ', ',
                    )}. Also ensure that these fields have meaningful content. In your case ${error.message}`;

                    return reject(failure);
                }

                const success = SUCCESS({
                    message: `${_data['name']} registered successfully`,
                    data: {
                        name: product.get('name'),
                        brand: product.get('brand'),
                        country: product.get('country'),
                        category: product.get('category'),
                        manufacturer: product.get('manufacturer'),
                        tags: product.get('tags'),
                        images: product.get('images'),
                        description: product.get('description'),
                    },
                });

                return resolve(success);
            });
        });

    public update = (_data: any, _id: String) =>
        new Promise((resolve, reject) => {
            if (_data['name'] == '') {
                delete _data['name'];
            }

            const query = Repository.findByIdAndUpdate(_id, _data, { new: true, runValidators: true });
            return query.exec((error: Error, _update: Document) => {
                if (error) {
                    const failure = MALFORMED;
                    const fields = Object.keys(Repository.schema.paths);
                    const indexOfCat = fields.indexOf('category');
                    if (indexOfCat > -1) fields.splice(indexOfCat, 1);
                    fields.pop();
                    fields.splice(fields.length - 1, 1);
                    failure.response = `We couldn't update the record at this time. Ensure you're using the right field properties: ${fields.join(
                        ', ',
                    )}. Also ensure that these fields have meaningful content. In your case ${error.message}`;

                    return reject(failure);
                }

                const success = SUCCESS({
                    message: `${_update.get('name')} updated successfully`,
                    data: {
                        name: _update.get('name'),
                        brand: _update.get('brand'),
                        country: _update.get('country'),
                        category: _update.get('category'),
                        manufacturer: _update.get('manufacturer'),
                        tags: _update.get('tags'),
                        description: _update.get('description'),
                    },
                });

                return resolve(success);
            });
        });

    public validate = (_data: any, next: () => Promise<any>, schema: string[]) =>
        new Promise(async (resolve, reject) => {
            return fieldValidators
                .match({
                    fields: Object.keys(_data),
                    schema: schema,
                })
                .then(async () => {
                    return this.dupCheck(_data)
                        .then((blob: any) => {
                            if (blob['_id']) {
                                delete blob['_id'];
                            }

                            this.catCheck(blob['category'])
                                .then(async _id => {
                                    blob['category'] = _id;

                                    return next()
                                        .then(response => {
                                            return resolve(response);
                                        })
                                        .catch(error => {
                                            return reject(error);
                                        });
                                })
                                .catch(error => {
                                    return reject(error);
                                });
                        })
                        .catch(error => {
                            return reject(error);
                        });
                })
                .catch(err => {
                    return reject(err);
                });
        });

    public updateProduct = (req: Request, res: Response) => {
        const _data = req.body,
            _product = req.params.productId;

        this.validate(
            _data,
            () =>
                new Promise((resolve, reject) => {
                    this.update(_data, _product)
                        .then(response => {
                            return resolve(response);
                        })
                        .catch(error => {
                            return reject(error);
                        });
                }),
            [],
        )
            .then((response: any) => {
                return res.status(response.code).json(response);
            })
            .catch(error => {
                return res.status(error.code).json(error);
            });
    };

    public newProduct = (req: Request, res: Response) => {
        const _data = req.body;

        return this.validate(
            _data,
            () =>
                new Promise(async (resolve, reject) => {
                    {
                        return this.register(_data)
                            .then((response: any) => {
                                return resolve(response);
                            })
                            .catch(error => {
                                return reject(error);
                            });
                    }
                }),
            ['name', 'brand', 'country', 'category', 'manufacturer', 'tags', 'images', 'description'],
        )
            .then((response: any) => {
                return res.status(response.code).json(response);
            })
            .catch(error => {
                return res.status(error.code).json(error);
            });
    };

    public deleteMany = (req: Request, res: Response) => {
        const _data = req.body;

        return fieldValidators
            .comprehensive({
                fields: Object.keys(_data),
                schema: ['products'],
            })
            .then(() => {
                const products = _data['products'];
                if (typeof products !== 'object' && products.length < 1) {
                    const failure = MALFORMED;
                    failure.response = 'Invalid Data Submitted';
                    throw failure;
                }

                const query = Repository.deleteMany({
                    _id: {
                        $in: [...products],
                    },
                });

                return query.exec((error: Error, _docs: any) => {
                    if (error) {
                        const failure = FAILURE;
                        failure.response = `We couldn't remove the selected products at this time. ${error.message}`;
                        return res.status(failure.code).json(failure);
                    }

                    if (_docs['deletedCount'] === 0) {
                        const failure = FAILURE;
                        failure.response = 'No records were purged at this time';
                        return res.status(failure.code).json(failure);
                    }

                    const success = SUCCESS({
                        message: `Data Purged Successfully`,
                    });

                    return res.status(success.code).json(success);
                });
            })
            .catch(error => {
                return res.status(error.code).json(error);
            });
    };

    public delete = (req: Request, res: Response) => {
        const _product = req.params.product,
            query = Repository.findByIdAndRemove(_product);

        return query.exec((error: Error, _doc: Document) => {
            if (error) {
                const failure = FAILURE;
                failure.response = `Failed to delete that product. ${error.message}`;
                return res.status(failure.code).json(failure);
            }

            if (!_doc || !_doc._id) {
                const failure = NOTFOUND;
                failure.response = "We couldn't find that product";

                return res.status(failure.code).json(failure);
            }

            const success = SUCCESS({
                message: 'Product Deleted Successfully',
            });

            return res.status(success.code).json(success);
        });
    };

    public fetch = (req: Request, res: Response) => {
        const _product = req.params.product,
            query = Repository.findById(_product)
                .populate('category')
                .populate('country');

        return query.exec((error: Error, _doc: Document) => {
            if (error) {
                const failure = FAILURE;
                failure.response = `Failed to fetch the Product at this time. ${error.message}`;
                return res.status(failure.code).json(failure);
            }

            if (!_doc || !_doc._id) {
                const failure = NOTFOUND;
                failure.response = `We couldn't find that product`;
                return res.status(failure.code).json(failure);
            }

            const success = SUCCESS({
                message: 'We found the product',
                data: 
                {
                    _id:_doc.id,
                    name: _doc.get('name'),
                    brand: _doc.get('brand'),
                    country: _doc.get('country'),
                    category: _doc.get('category'),
                    manufacturer: _doc.get('manufacturer'),
                    tags: _doc.get('tags'),
                    images: _doc.get('images'),
                    description: _doc.get('description'),
                },
            });

            return res.status(success.code).json(success);
        });
    };

    public repository = (req: Request, res: Response) => {
        const _offset = req.params.offset,
            query = Repository.find({})
                .lean()
                // .populate('category');

        return query.exec((error: Error, records: Document) => {
            if (error) {
                const failure = FAILURE;
                failure.response = "We couldn't fetch the repository at this time";
                return res.status(failure.code).json(failure);
            }

            const data = Object.values(records);

            if (records && data.length < 1) {
                let failure = NOTFOUND;
                failure.response = 'product Repository Empty!!!';
                return res.status(failure.code).json(failure);
            }

            if (parseInt(_offset) * PAGINATION + 1 > data.length) {
                let failure = NOTFOUND;
                failure.response = 'Page Offset Empty!!!';
                return res.status(failure.code).json(failure);
            }

            const begin = parseInt(_offset) * PAGINATION;
            const end = begin + PAGINATION > data.length - 1 ? data.length : begin + PAGINATION;

            let success = SUCCESS({
                message: 'Data Found...',
                data :{
                    products: data,
                }
                    
                
            });

            return res.status(success.code).json(success);
        });
    };
}
