import { NextApiRequest, NextApiResponse } from 'next';
import { SFNClient, CreateActivityCommand } from '@aws-sdk/client-sfn';
import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: ' us-east-1' });
const STATE_MACHINE_NAME = async () => {
  const command = new GetParametersCommand({
    Names: ['TranslateStateMachine'],
  });
  return await ssmClient.send(command);
};

const client = new SFNClient({ region: 'us-east-1' });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const params = {
    input: JSON.stringify({ hello: 'world' }),
    name: 'start',
    stateMachineArn: STATE_MACHINE_NAME,
  };
  const command = new CreateActivityCommand(params);

  try {
    const data = await client.send(command);
    console.log(data);
  } catch (error) {
    console.log(error);
  }
};
