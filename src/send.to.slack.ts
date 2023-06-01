import { IncomingWebhook, IncomingWebhookSendArguments } from '@slack/webhook';
import { SLACK_PRODUCTION_ERRORS_WEBHOOK } from './env'

export interface ISendSlack {
  to: 'productionErrors';
  text: string;
  customId?: string;
  link?: string;
  attachmentsFields?: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  attachmentColor?: 'good' | 'warning' | 'danger';
}

async function sendSlack ({ to, text, customId, link, attachmentsFields, attachmentColor }: ISendSlack) {
  try {
    const webhookBody = {
      text,
      attachments: handleAttachments()
    };

    const webhook = getWebhook({ channelName: to });
    await webhook.send(webhookBody);
  } catch (err) {
    console.log(err);
  }

  function handleAttachments () {
    let attachments: IncomingWebhookSendArguments['attachments'];

    if (link && customId) {
      attachments = [{
        fallback: `${customId} ${link}`,
        actions: [{ type: 'button', text: customId, url: link }]
      }];
    }

    if (attachmentsFields?.length) {
      attachments = [{
        fallback: text,
        text,
        fields: attachmentsFields,
        color: attachmentColor
      }];
    }
    return attachments;
  }
}

function getWebhook ({ channelName }: { channelName: string }) {
  const webhook = getAllWebhooks()[channelName];
  if (!webhook) {
    throw new Error(`No webhook URL registered for ${channelName}.`);
  }

  return webhook;
}


const allWebhooks = {
  productionErrors: generateWebhook(SLACK_PRODUCTION_ERRORS_WEBHOOK)
};
function getAllWebhooks (): any {
  return allWebhooks;
}
function generateWebhook (webhookURL: string | undefined) {
  return new IncomingWebhook(webhookURL || 'https://hooks.slack.com/services/PLACEHOLDER');
}
export default sendSlack;