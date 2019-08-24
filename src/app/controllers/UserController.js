import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação' });
    }

    const userExist = await User.findOne({ where: { email: req.body.email } });

    if (userExist) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    const { id, name, email } = await User.create(req.body);

    return res.json({ id, name, email });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldpassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldpassword', (oldpassword, field) =>
          oldpassword ? field.required() : field
        ),
      confimpassword: Yup.string().when('password', (password, field) =>
        password ? field.required() : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação' });
    }

    const { email, oldpassword } = req.body;
    const user = await User.findByPk(req.userId);

    if (user.email === req.email) {
      const userExist = User.findOne({ where: { email: req.email } });

      if (userExist) {
        return res.status(400).json({ error: 'Email já existente' });
      }
    }

    if (oldpassword && !(await user.comparePassword(oldpassword))) {
      return res.status(400).json({ error: 'Senha incorreta' });
    }

    const { id, name } = await user.update(req.body);

    return res.json({ id, name, email });
  }
}

export default new UserController();
