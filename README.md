# Document Transformer

The Document Transformer is a Next.js application that allows uploading of PDF's and Translating them to a selected language. It utilises https://www.npmjs.com/package/@sls-next/cdk-construct to create the CDK Constructs and deploy lambda@edge functions for executing server-side rendering.
## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
