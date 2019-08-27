import { isBefore } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import User from '../models/User';
import SubcriptionMail from '../jobs/SubcriptionMail';
import Queue from '../../lib/Queue';

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

    const user = await User.findByPk(subscription.user_id);
    const userOrg = await User.findByPk(meetup.user_id);

    Queue.add(SubcriptionMail.key, {
      user: user.name,
      meetup: meetup.title,
      orgEmail: userOrg.email,
      orgUser: userOrg.name,
    });

    return res.json(subscription);
  }

  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.gte]: new Date(),
        },
      },
      include: [
        {
          model: Subscription,
          required: true,
          where: {
            user_id: req.userId,
          },
        },
      ],
    });

    const subs = await Subscription.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: {
              [Op.gte]: new Date(),
            },
          },
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subs);
  }
}

export default new SubscriptionController();
