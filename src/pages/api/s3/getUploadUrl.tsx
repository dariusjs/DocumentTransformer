import { NextApiRequest, NextApiResponse } from 'next';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import axios from 'axios';

const s3Client = new S3Client({ region: 'us-east-1' });

export async function getUploadSignedUrl(name: string, type: string) {
  const params = {
    Bucket: 'documenttransformerstack-payloadbucket357f5869',
    Key: name,
    ContentType: type,
  };

  const command = new PutObjectCommand(params);
  // @ts-ignore
  const url = await getSignedUrl(s3Client, command, { expiresIn: 600 });
  return url;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    let { name, type } = req.body;
    const url = await getUploadSignedUrl(name, type);
    res.status(200).json({ url });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
