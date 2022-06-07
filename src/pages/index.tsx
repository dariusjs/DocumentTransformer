import Head from 'next/head';
import { ChangeEvent, useState } from 'react';
import axios from 'axios';
import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';

const client = new SSMClient({ region: ' us-east-1' });
const BUCKET_URL = async () => {
  const command = new GetParametersCommand({
    Names: ['PayloadBucketAddress'],
  });
  return await client.send(command);
};

export default function Home() {
  const [file, setFile] = useState<any>();
  const [uploadingStatus, setUploadingStatus] = useState<any>();
  const [uploadedFile, setUploadedFile] = useState<any>();
  const [url, setUrl] = useState<any>();

  const selectFile = (e: ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    setUploadingStatus('Uploading File');
    let { data } = await axios.post('/api/s3/getUploadUrl', {
      name: file.name,
      type: file.type,
    });
    await axios.put(data.url, file, {
      headers: {
        'Content-type': file.type,
        'Access-Control-Allow-Origin': '*',
      },
    });

    await axios.post('/api/sf/translate', {
      key: uploadedFile,
      languages: ['fr'],
    });

    setUrl(data.url);
    setUploadedFile(BUCKET_URL + file.name);
    setFile(null);
  };

  return (
    <div className="container">
      <Head>
        <title>Next App</title>
      </Head>

      <main>
        <h1 className="title">Document Converter</h1>

        <p>Please select a file to upload</p>
        <input type="file" onChange={(e) => selectFile(e)} />
        {file && (
          <>
            <button onClick={uploadFile}>Upload</button>
            <p>Selected file: {file.name}</p>
            <p>Selected file type: {file.type}</p>
          </>
        )}
        {url && <p>{url}</p>}
        {uploadedFile && <p>{uploadedFile}</p>}
        {uploadingStatus && <p>{uploadingStatus}</p>}
        {uploadedFile && <img src={uploadedFile} />}
      </main>
    </div>
  );
}
