import { Application } from 'express';
import CategoryManager from '../services/categories';
import ProductManager from '../services/products';
import CountryManager from '../services/country';
import SearchManager from '../services/search';


export default class Routes {
    private catManager: CategoryManager;
    private couManager: CountryManager;
    private productManager: ProductManager;
    private searchManager: SearchManager;
   

    constructor(private Routes: Application) {
        this.catManager = new CategoryManager();
        this.productManager = new ProductManager();
        this.couManager = new CountryManager();
        this.searchManager = new SearchManager();
       
        this.init();
    }

    public init() {

        //services

        this.Routes.route('/product/category').get(this.catManager.fetch);
        this.Routes.route('/product/category').post(this.catManager.newCategory);
        this.Routes.route('/product/category/:categoryId').delete(this.catManager.delete);
        this.Routes.route('/product/category/:categoryId').put(this.catManager.update);
        this.Routes.route('/product/category/:searchTerm').get(this.catManager.find);
        

        //country 
        this.Routes.route('/product/country').get(this.couManager.fetch);
        this.Routes.route('/product/country').post(this.couManager.newCountry);
        this.Routes.route('/product/country/:countryId').delete(this.couManager.delete);
        this.Routes.route('/product/country/:countryId').put(this.couManager.update);
        this.Routes.route('/product/country/:searchTerm').get(this.couManager.find);
        
        //product
        this.Routes.route('/product/register').post(this.productManager.newProduct);
        this.Routes.route('/product/:offset').get(this.productManager.repository);
        this.Routes.route('/product/:productId').put(this.productManager.updateProduct);
        this.Routes.route('/product/fetch/:product').get(this.productManager.fetch);
        this.Routes.route('/product/:product').delete(this.productManager.delete);
        this.Routes.route('/repo/deleteMany').delete(this.productManager.deleteMany);
        // Search Manager
        this.Routes.route('/product/search/:searchTerm').get(this.searchManager.search);
        


    }
}
