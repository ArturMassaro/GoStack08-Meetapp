import * as Yup from 'yup';
import { parseISO, isBefore } from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class OrganizationController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['name', 'path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(meetups);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      locale: Yup.string(),
      date: Yup.date(),
      user_id: Yup.number(),
      banner_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation error' });
    }

    const { id } = req.params;

    const meetup = await Meetup.findOne({ where: { id, user_id: req.userId } });

    if (!meetup) {
      return res.status(401).json({ error: 'you only can edit yours meetups' });
    }

    const { date } = req.body;
    if (isBefore(parseISO(date), new Date())) {
      return res.status(400).json({ error: 'Past dates not permitted' });
    }

    const { past, title, description, locale } = await meetup.update(req.body);

    return res.json({
      id,
      past,
      title,
      description,
      locale,
      date,
    });
  }

  async delete(req, res) {
    const { id } = req.params;

    const meetup = await Meetup.findOne({ where: { id, user_id: req.userId } });

    if (!meetup) {
      return res.status(401).json({ error: 'you only can edit yours meetups' });
    }

    if (isBefore(parseISO(meetup.date), new Date())) {
      return res.status(400).json({ error: 'Past dates not permitted' });
    }

    meetup.destroy();
    return res.send('Meetup has been excluded');
  }
}

export default new OrganizationController();
