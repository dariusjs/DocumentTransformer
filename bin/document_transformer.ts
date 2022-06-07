#!/usr/bin/env node
import 'source-map-support/register';
import { DocumentTransformerStack } from '../lib/document_transformer-stack';
import { Builder } from '@sls-next/lambda-at-edge';
import { App } from 'aws-cdk-lib';

const builder = new Builder('.', './build', { args: ['build'] });

builder
  .build(true)
  .then(() => {
    const app = new App();
    new DocumentTransformerStack(app, 'DocumentTransformerStack', {
      description: 'DocumentTransform',
    });
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
