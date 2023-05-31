console.log('hello world');
import {Channel, connect, Options} from 'amqplib'
import { RABBITMQ_HOST, RABBITMQ_PASS, RABBITMQ_USER, RABBITMQ_VHOST, RABBITMQ_PORT, QUEUES_NAMES_ARRAY } from './env';

let ch: Channel;
const queues: Array<string | undefined> = Array(QUEUES_NAMES_ARRAY);

const connectionOptions: Options.Connect = {
  hostname: RABBITMQ_HOST,
  username: RABBITMQ_USER,
  password: RABBITMQ_PASS, 
  port: Number(RABBITMQ_PORT), 
  vhost: RABBITMQ_VHOST,
}

function assertQueueByName(ch: Channel, queueName: string | undefined) {
  if(!queueName) {
    throw new Error("No queues to be watched has been passed in the environment");
  }
  return ch.assertQueue(queueName)
}

async function main () {
  try {
    const connection = await connect(connectionOptions);
    ch = await connection.createChannel();

    setInterval(async () => {
      const assertions = queues.map(q => assertQueueByName(ch, q))
      const result = await Promise.all(assertions)
      result.map(r => console.log(r))
    }, 5000)
  } catch (error) {
    console.log(error);
  }
}
 
main();