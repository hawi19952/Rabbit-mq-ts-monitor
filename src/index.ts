console.log('hello world');
import { Channel, connect, Options } from 'amqplib'
import { RABBITMQ_HOST, RABBITMQ_PASS, RABBITMQ_USER, RABBITMQ_VHOST, RABBITMQ_PORT, COMMA_SEPERATED_QUEUE_NAMES, SLACK_USER_ID_FOR_MENTION } from './env';
import { writeFileSync, readFileSync } from 'fs'
import sendSlack from './send.to.slack';
let ch: Channel;
const queues: string[] | undefined = COMMA_SEPERATED_QUEUE_NAMES?.split(',');
console.log('Watching the queues: ' + queues);


const connectionOptions: Options.Connect = {
  hostname: RABBITMQ_HOST,
  username: RABBITMQ_USER,
  password: RABBITMQ_PASS,
  port: Number(RABBITMQ_PORT),
  vhost: RABBITMQ_VHOST,
}
type QueueStats = {
  queue: string, // Queue Name
  messageCount: number,
  consumerCount: number
}


function assertQueueByName(ch: Channel, queueName: string) {
  return ch.assertQueue(queueName)
}

function getOldReadings() {
  const content = readFileSync('tmp/readings.json', { encoding: "utf-8" })
  if (!content) {
    return
  }
  const foundReadings = JSON.parse(content)
  return foundReadings
}

async function compareNewWithOldReadings(oldReadings: Array<QueueStats>, newReadings: Array<QueueStats>) {
  newReadings.map(n => {
    oldReadings.find(async o => {
      if (n.queue.includes(o.queue)) {
        if (n.messageCount > o.messageCount) {
          console.log(n.queue + ' Does not look to be progressing');
          if (n.consumerCount < 1) {
            console.log('No consumer is connected to ' + n.queue);
            //TODO: Fire a notification to slack
            await sendSlack({
              text: `No consumer is connected to ${n.queue} <@${SLACK_USER_ID_FOR_MENTION}>`,
              to: 'productionErrors',
              attachmentColor: 'danger',
            })
          }
        }
      }
    })
  })
}


async function main() {
  try {
    const connection = await connect(connectionOptions);
    ch = await connection.createChannel();

    setInterval(async () => {
      if(!queues) {
        console.log(`no queue found`);
        
        return
      }
      const oldReadings = getOldReadings()
      const assertions = queues.map(q => assertQueueByName(ch, q))
      const result = await Promise.all(assertions)
      let writable: Array<any> = [];
      result.map(r => writable.push(r))
      writeFileSync('tmp/readings.json', JSON.stringify(writable), "utf-8")

      compareNewWithOldReadings(oldReadings, writable)
    }, 5000)
  } catch (error) {
    console.log(error);
  }
}

main();

//TODO: Set comparison method between each 2 readings  -> store readings in fs for now 
//TODO: Set a notification helper to notify another service of the action -> Slack for now 