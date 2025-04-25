import express from 'express';
import fileUpload from 'express-fileupload';
import { uploadFileToIPFS, uploadJsonDataToIPFS } from './IPFSUploader.js';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// 视图引擎设置
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 中间件设置
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));
app.use(fileUpload());
app.use(cors());

// 路由
app.get('/', (req, res) => res.render('home'));

app.post('/upload', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    
    // 检查文件类型
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are supported' });
    }

    const uploadDir = join(__dirname, 'files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, file.name);

    try {
      await file.mv(filepath);
      console.log('File saved locally:', filepath);

      const fileResult = await uploadFileToIPFS(filepath);
      console.log('File uploaded to IPFS:', fileResult);

      const metadata = {
        title,
        description,
        image: fileResult.url,
        attributes: []
      };

      const metadataResult = await uploadJsonDataToIPFS(metadata);
      console.log('Metadata uploaded to IPFS:', metadataResult);

      res.json({
        message: 'File and metadata uploaded successfully',
        cid: fileResult.cid,
        metadataCid: metadataResult.cid,
        imageURL: fileResult.url,
        metadataURL: metadataResult.url,
        fallbackUrls: fileResult.fallbackUrls
      });
    } catch (error) {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ 
      error: 'Failed to process upload', 
      details: error.message 
    });
  }
});

// 错误处理
app.use((req, res, next) => next(createError(404)));
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500).render('error');
});

// 改用 ES modules 导出
export default app;