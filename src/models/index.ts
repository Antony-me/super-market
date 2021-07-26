import STOREX from 'mongoose';

const CATEGORY = new STOREX.Schema(
    {
        name: { type: String, required: true },
    },
    { versionKey: false },
);

const COUNTRY = new STOREX.Schema(
    {
        name: { type: String, required: true },
    },
    { versionKey: false },
);

const PRODUCT = new STOREX.Schema(
    {
        name: { type: String, required: true, unique: true, minlength: 3 },
        country: { type: STOREX.Types.ObjectId, ref: 'product_country'},
        category: { type: STOREX.Types.ObjectId, ref: 'product_categories'},
        manufacturer: { type: String },
        tags: { type: [String] },
        images: { type: [String], required: false },
        manDate: { type: Date },
        expDate: { type: Date },
        price:{ type: Number }
    },
    { versionKey: false },
);

CATEGORY.pre('remove', function(callback) {
    this.model('product_repository').remove({ category: this._id }, callback);
});

CATEGORY.index({ name: 'text' });
COUNTRY.index({ name: 'text' });
PRODUCT.index({ name: 'text', brand: 'text', tags: 'text' });

const Repository = STOREX.model('product_repository', PRODUCT);
const Categories = STOREX.model('product_categories', CATEGORY);
const Countries = STOREX.model('product_country', COUNTRY);


export { Repository, Categories, Countries };