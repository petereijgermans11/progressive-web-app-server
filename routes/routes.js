const uuid = require('uuid');
const path = require('path');
const webpush = require('web-push');

const VAPID_MAIL = 'mailto:peter.eijgermans@ordina.nl';
const VAPID_PUBLIC_KEY = 'BPg36y0YwKrMOgutw18ZeX9Ps3fBy5tNnA_OdPIoraBn4u7ptTxJKt14bNcT3WC67b_zaMe5UQgflinBotYubEM';
const VAPID_PRIVATE_KEY = 'UvlzzzCtAgousEoIdI8DALk8mtFzlUFMJao4lru_jhQ';

webpush.setVapidDetails(VAPID_MAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const appRouter = (app, selfiesDb, subscriptionsDb) => {
  app.post('/selfies', (req, res) => {
    const post = {title: req.fields.title, location: req.fields.location};

    if (req.files.selfie) {
      const selfieFileName = path.basename(req.files.selfie.path);
      post.selfieUrl = `${req.protocol}://${req.get('host')}/images/${selfieFileName}`;
    } else {
      post.selfieUrl = `${req.protocol}://${req.get('host')}/dummy/dummy_selfie.jpg`;
    }

    post.id = req.fields.id;

    selfiesDb.push(`selfies/${post.id}`, post, false);

    const subscriptions = subscriptionsDb.getData('/');

    Object.values(subscriptions).forEach(subscription => {
      if (subscription.endpoint && subscription) {
        webpush.sendNotification(subscription, JSON.stringify({
          title: 'New Selfie Added!',
          content: `${post.title} @ ${post.location}`,
          imageUrl: post.selfieUrl,
          openUrl: 'help'
        })).catch(error => console.log(error));
      }
    });

    res.status(200).send({message: 'Selfie stored', id: post.id});
  });

  app.get('/selfies', (req, res) => {
    const selfies = selfiesDb.getData('/');

    res.send(selfies);
  });

  app.post('/subscriptions', (req, res) => {
    const subscription = req.fields;

    subscription.id = uuid.v4();

    subscriptionsDb.push(`subscriptions/${subscription.id}`, subscription, false);
    res.status(200).send('subscription saved');
  });
};

module.exports = appRouter;
