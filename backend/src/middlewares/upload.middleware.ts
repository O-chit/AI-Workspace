import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { env } from '../config/env.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

import { TextNormalizer } from '../utils/textNormalizer.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    file.originalname = TextNormalizer.fixUtf8FileName(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc|pptx|ppt|txt)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận các định dạng tệp PDF, DOCX, PPTX hoặc TXT.'));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
  },
  fileFilter,
});
