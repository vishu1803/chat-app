import multer from "multer";  
const upload = multer({
    storage: multer.memoryStorage(),  // Corrected memoryStronger to memoryStorage
});

export default upload;
