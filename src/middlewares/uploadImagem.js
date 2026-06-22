import crypto from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';

let storageClient = null;

const MAX_SIZE_MB = 5;

function getStorageClient() {

  if (storageClient) {
    return storageClient;
  }

  const region = process.env.SUPABASE_STORAGE_REGION;
  const endpoint = process.env.SUPABASE_STORAGE_S3_ENDPOINT;
  const accessKeyId = process.env.SUPABASE_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY;

  if (
    !region ||
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey
  ) {
    throw new Error(
      'Configure SUPABASE_STORAGE_REGION, SUPABASE_STORAGE_S3_ENDPOINT, SUPABASE_STORAGE_ACCESS_KEY_ID e SUPABASE_STORAGE_SECRET_ACCESS_KEY no .env.'
    );
  }

  storageClient = new S3Client({
    forcePathStyle: true,
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  return storageClient;
}

function getPublicBaseUrl() {

  const endpoint =
    process.env.SUPABASE_STORAGE_S3_ENDPOINT || '';

  if (!endpoint.includes('supabase')) {
    throw new Error(
      'SUPABASE_STORAGE_S3_ENDPOINT inválido.'
    );
  }

  return endpoint
    .replace(
      '.storage.supabase.co/storage/v1/s3',
      '.supabase.co/storage/v1/object/public'
    )
    .replace(/\/$/, '');
}

function obterExtensaoPorMime(mimetype) {

  const extensoes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg'
  };

  return extensoes[mimetype] || '.jpg';
}

export function processarUploadImagem(
  req,
  res,
  {
    pasta = 'perfil',
    campo = 'foto'
  } = {}
) {

  const bucket =
    process.env.SUPABASE_STORAGE_BUCKET;

  if (!bucket) {
    throw new Error(
      'SUPABASE_STORAGE_BUCKET não configurado.'
    );
  }

  const pastaDestino =
    String(pasta || 'perfil').trim();

  const uploader = multer({
    storage: multer.memoryStorage(),

    limits: {
      fileSize: MAX_SIZE_MB * 1024 * 1024
    },

    fileFilter: (_req, file, cb) => {

      if (file.mimetype?.startsWith('image/')) {
        return cb(null, true);
      }

      return cb(
        new Error(
          'Apenas arquivos de imagem são permitidos.'
        )
      );
    }
  });

  return new Promise((resolve, reject) => {

    uploader.single(campo)(
      req,
      res,
      async (erro) => {

        if (erro?.code === 'LIMIT_FILE_SIZE') {
          return reject(
            new Error(
              `A imagem deve ter no máximo ${MAX_SIZE_MB}MB.`
            )
          );
        }

        if (erro) {
          return reject(erro);
        }

        if (!req.file) {

          return resolve({
            arquivo: null,
            pasta: pastaDestino,
            publicUrl: null,
            caminho: null,
            bucket
          });
        }

        const usuarioId = String(
          req.usuarioId ||
          req.params?.id ||
          ''
        ).trim();

        if (!usuarioId) {
          return reject(
            new Error(
              'Não foi possível identificar o usuário para o upload.'
            )
          );
        }

        try {

          const client = getStorageClient();

          const extensao =
            obterExtensaoPorMime(
              req.file.mimetype
            );

          const fileName =
            `${crypto.randomUUID()}${extensao}`;

          const caminho =
            `${pastaDestino}/${usuarioId}/${fileName}`;

          await client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: caminho,
              Body: req.file.buffer,
              ContentType: req.file.mimetype
            })
          );

          const publicUrl =
            `${getPublicBaseUrl()}/${bucket}/${caminho}`;

          resolve({
            arquivo: req.file,
            pasta: pastaDestino,
            publicUrl,
            caminho,
            bucket,
            fileName
          });

        } catch (storageError) {

          reject(storageError);
        }
      }
    );
  });
}
