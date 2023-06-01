import { config } from "dotenv";

config({
  path: `env/.${process.env.NODE_ENV}.env`
});


export const {
  RABBITMQ_USER,
  RABBITMQ_PASS,
  RABBITMQ_VHOST,
  RABBITMQ_HOST,
  RABBITMQ_PORT,

  COMMA_SEPERATED_QUEUE_NAMES,

  SLACK_PRODUCTION_ERRORS_WEBHOOK
} = process.env