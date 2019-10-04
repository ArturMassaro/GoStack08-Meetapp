import * as Yup from 'yup';
import { parseISO, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import File from '../models/File';

class MeetupController {
  async index(req, res) {
    const { page, date } = req.query;
    const correctDate = parseISO(date);

    // const meetups = await Meetup.findAll({
    //   where: {
    //     date: {
    //       [Op.between]: [startOfDay(correctDate), endOfDay(correctDate)],
    //     },
    //   },
    //   limit: 10,
    //   offset: (page - 1) * 10,
    //   order: ['date'],
    // });

    const meetups = await Meetup.findAll({
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['name', 'path', 'url'],
        },
      ],
      order: ['date'],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      locale: Yup.string().required(),
      date: Yup.date().required(),
      user_id: Yup.number(),
      banner_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation error' });
    }

    const { date, title, description, locale, banner_id } = req.body;

    if (isBefore(parseISO(date), new Date())) {
      return res.status(400).json({ error: 'Past dates not permitted' });
    }

    const meetup = await Meetup.create({
      date,
      title,
      description,
      locale,
      banner_id,
      user_id: req.userId,
    });

    return res.json(meetup);
  }
}

export default new MeetupController();
