import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Mail from '../../lib/Mail';

class SubcriptionMail {
  get key() {
    return 'SubscritionMail';
  }

  async handle({ data }) {
    const { orgUser, user, meetup, orgEmail } = data;
    console.log(data);

    await Mail.sendMail({
      to: `${orgUser} <${orgEmail}>`,
      subject: 'Novo Cadastro em Meetup',
      template: 'subcription',
      context: {
        orgUser,
        user,
        meetup,
      },
    });
  }
}

export default new SubcriptionMail();
