const express=require('express');const router=express.Router();const main=require('../controllers/mainController');const auth=require('../controllers/authController');const chat=require('../controllers/chatController');const {requireAuth,redirectIfAuth}=require('../middlewares/authMiddleware');
router.get('/',main.getHome);router.get('/referensi',main.getLandingPage);
router.get('/login',redirectIfAuth,auth.loginPage);router.post('/login',redirectIfAuth,auth.login);
router.get('/register',redirectIfAuth,auth.registerPage);router.post('/register',redirectIfAuth,auth.register);router.post('/logout',requireAuth,auth.logout);
router.get('/chatbot',requireAuth,chat.page);router.post('/api/chatbot',requireAuth,chat.ask);
router.get('/api/status',main.getStatusAPI);router.get('/api/produk',main.getProductsAPI);router.get('/api/produk/:id',main.getProductByIdAPI);
router.post('/api/produk',requireAuth,main.createProductAPI);router.put('/api/produk/:id',requireAuth,main.updateProductAPI);router.delete('/api/produk/:id',requireAuth,main.deleteProductAPI);router.get('/info-tiket',requireAuth,main.getInfoTiket);
module.exports=router;
