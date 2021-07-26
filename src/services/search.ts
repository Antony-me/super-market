import { Repository, Categories, Countries } from '../models';
import { Request, Response } from 'express';
import { Document } from 'mongoose';
import { FAILURE, NOTFOUND, SUCCESS } from '../constants';

export default class SearchManager {
    public search = (req: Request, res: Response) => {
        const _searchTerm = req.params.searchTerm;

        const query = Repository.find({ $text: { $search: _searchTerm, $caseSensitive: false } })
            .lean()
            .populate('category')

        return query.exec((error: Error, _documents: Document) => {
            if (error) {
                const failure = FAILURE;
                failure.response = error.message;
                return res.status(failure.code).json(failure);
            }

            if (Object.keys(_documents).length == 0) {
                return this.regSearch(_searchTerm)
                    .then((response: any) => res.status(response.code).json(response))
                    .catch(() =>
                        this.catSearch(_searchTerm)
                            .then((response: any) => res.status(response.code).json(response))
                            .catch(() =>
                                this.subSearch(_searchTerm)
                                    .then((response: any) => res.status(response.code).json(response))
                                    .catch(error => res.status(error.code).json(error)),
                            ),
                    );
            }

            const success = SUCCESS({
                message: 'We found your query...',
                data: _documents,
            });

            return res.status(success.code).json(success);
        });
    };

    private regSearch = (_searchTerm: String) =>
        new Promise((resolve, reject) => {
            const searchTerm = new RegExp(`^${_searchTerm}`, 'i');
            const query = Repository.find({ name: { $regex: searchTerm } })
                .lean()
                .populate('category')
                .populate('subCategory');

            return query.exec((error: Error, _data: Document) => {
                if (error) {
                    const failure = FAILURE;
                    failure.response = error.message;
                    return reject(failure);
                }

                if (Object.keys(_data).length == 0) {
                    const failure = NOTFOUND;
                    failure.response = 'We could not find your query...';
                    return reject(failure);
                }

                const success = SUCCESS({
                    message: 'We found your query...',
                    data: _data,
                });

                return resolve(success);
            });
        });
    private catSearch = (_searchTerm: String) =>
        new Promise((resolve, reject) => {
            const searchTerm = new RegExp(`^${_searchTerm}`, 'i');
            const query = Categories.find({ name: { $regex: searchTerm } }).lean();

            return query.exec(async (error: Error, results: any) => {
                if (error) {
                    const failure = FAILURE;
                    failure.response = 'We could not find the your query at this time...';
                    return reject(failure);
                }

                if (results && Object.keys(results).length > 0) {
                    let data: any = [];
                    for (let i = 0; i < results.length; i += 1) {
                        await Repository.find({ category: results[i]._id }, (error: Error, _searchHits: any) => {
                            if (error) {
                                console.log('Error in Cat Search');
                                console.log(error);
                            }

                            if (Object.keys(_searchHits).length > 0) {
                                data = [...data, ..._searchHits];
                            }
                        })
                            .lean()
                            .populate('category')
            
                    }

                    if (data.length > 0) {
                        const success = SUCCESS({
                            message: 'We found your query...',
                            data: data,
                        });

                        return resolve(success);
                    }

                    const failure = NOTFOUND;
                    failure.response = 'We could not find your query...';
                    return reject(failure);
                } else {
                    const failure = NOTFOUND;
                    failure.response = 'We could not find your query...';
                    return reject(failure);
                }
            });
        });

    private subSearch = (_searchTerm: String) =>
        new Promise((resolve, reject) => {
            const searchTerm = new RegExp(`^${_searchTerm}`, 'i');
            const query = Countries.find({ name: { $regex: searchTerm } }).lean();

            return query.exec(async (error: Error, results: any) => {
                if (error) {
                    const failure = FAILURE;
                    failure.response = 'We could not find the category at this time.';
                    return reject(failure);
                }

                if (results && Object.keys(results).length > 0) {
                    // Get Products by Country Id...
                    let data: any = [];

                    for (let i = 0; i < results.length; i += 1) {
                        await Repository.find({ Countries: results[i]._id }, (error: Error, _searchHits: any) => {
                            if (error) {
                                console.log('Error in Sub Search');
                                console.log(error);
                            }

                            if (Object.keys(_searchHits).length > 0) {
                                data = [...data, ..._searchHits];
                            }
                        })
                            .lean()
                            .populate('category')
                            .populate('country')
                    
                    }

                    if (data.length > 0) {
                        const success = SUCCESS({
                            message: 'We found your query...',
                            data: data,
                        });

                        return resolve(success);
                    }

                    const failure = NOTFOUND;
                    failure.response = 'We could not find your query...';
                    return reject(failure);
                } else {
                    const failure = NOTFOUND;
                    failure.response = 'We could not find your query...';
                    return reject(failure);
                }
            });
        });
}
