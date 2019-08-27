import { isBefore } from 'date-fns';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

class SubscriptionController {
  async store(req, res) {
    const { meetup_id } = req.body;

    const meetup = await Meetup.findByPk(meetup_id);

    if (isBefore(meetup.date, new Date())) {
      return res.status(400).json({ error: 'Past dates not permitted' });
    }

    if (req.userId === meetup.user_id) {
      return res
        .status(400)
        .json({ error: 'Unable to subscribe to your meetupp' });
    }

    const subscriptions = await Subscription.findOne({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          where: { date: meetup.date },
        },
      ],
    });

    if (subscriptions) {
      return res.status(400).json({ error: 'this date is already in use' });
    }

    const subscription = await Subscription.create({
      meetup_id,
      user_id: req.userId,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
