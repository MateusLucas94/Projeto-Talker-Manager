const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const talkerJson = './talker.json';

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

const validationToken = (req, res, next) => {
  console.log(req.headers);
 const { authorization } = req.headers;
 if (!authorization) return res.status(401).send({ message: 'Token não encontrado' });
 if (authorization.length !== 16) return res.status(401).send({ message: 'Token inválido' });
 
  next();
};

app.get('/talker/search',
  validationToken, async (req, res) => {
    const { q } = req.query;
    const promise = await fs.readFile(talkerJson, 'utf-8');
    const talkersArray = JSON.parse(promise);
    const filteredArray = talkersArray
      .filter((talker) => talker.name.toLowerCase().includes(q.toLowerCase()));
    return res.status(200).json(filteredArray);
  });

app.get('/talker', async (req, res) => {
  const talker = await fs.readFile('./talker.json', 'utf-8');
  return talker || talker.length ? (
    res.status(HTTP_OK_STATUS).send(JSON.parse(talker))) : (
    res.status(HTTP_OK_STATUS).send([]));
});

app.get('/talker/:id', async (req, res) => {
  const talker = await fs.readFile('./talker.json', 'utf-8');
  const talkerparsed = JSON.parse(talker);
  console.log(talkerparsed);
  const {
    id,
  } = req.params;
  const talkerFiltered = talkerparsed.filter((talkerObject) => talkerObject.id === Number(id));
  return talkerFiltered && talkerFiltered.length > 0 ? (
    res.status(200).send(talkerFiltered[0])) : (
    res.status(404).send({
      message: 'Pessoa palestrante não encontrada',
    }));
});

// https://stackoverflow.com/questions/8532406/create-a-random-token-in-javascript-based-on-user-details
function generateToken(length) {
  // edit the token allowed characters
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('');
  const b = [];
  for (let i = 0; i < length; i += 1) {
    const j = (Math.random() * (a.length - 1)).toFixed(0);
    b[i] = a[j];
  }
  return b.join('');
}

// https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

app.post('/login', async (req, res) => {
  const token = generateToken(16);
  const { email, password } = req.body;
  if (!email) return res.status(400).send({ message: 'O campo "email" é obrigatório' });
  if (!password) return res.status(400).send({ message: 'O campo "password" é obrigatório' });
  if (!validateEmail(email)) {
    return res.status(400).send({ message: 'O "email" deve ter o formato "email@email.com"' }); 
  }
  if (password.length < 6) {
    return res.status(400).send({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  return res.status(200).send({
    token,
  });
});

const validationName = (req, res, next) => {
  console.log(req.body);
 const { name } = req.body;
 if (!name) return res.status(400).send({ message: 'O campo "name" é obrigatório' });
 if (name.length < 3) {
  return res.status(400).send({ message: 'O "name" deve ter pelo menos 3 caracteres' });
 }
  next();
};

const validationAge = (req, res, next) => {
 const { age } = req.body;
 if (!age) return res.status(400).send({ message: 'O campo "age" é obrigatório' });
 if (age < 18) {
  return res.status(400).send({ message: 'A pessoa palestrante deve ser maior de idade' });
 }
  next();
};

const validationTalk = (req, res, next) => {
 const { talk } = req.body;
 if (!talk) return res.status(400).send({ message: 'O campo "talk" é obrigatório' });
 next();
};

// https://stackoverflow.com/questions/10194464/javascript-dd-mm-yyyy-date-check
const validationWatchedAt = (req, res, next) => {
  const { watchedAt } = req.body.talk;
if (!watchedAt) return res.status(400).send({ message: 'O campo "watchedAt" é obrigatório' });
const reg = /(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d/;
  if (!watchedAt.match(reg)) {
    return res.status(400).send({ message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' });
  }
  next();
};

const validationRate = (req, res, next) => {
 const { rate } = req.body.talk;
 console.log(rate);
 if (rate === undefined) return res.status(400).send({ message: 'O campo "rate" é obrigatório' });
 console.log(Number.isInteger(rate)); 
 if (!(rate >= 1 && rate <= 5 && Number.isInteger(rate))) {
  return res.status(400).send({ message: 'O campo "rate" deve ser um inteiro de 1 à 5' });
 }
  next();
};

app.post('/talker',
  validationToken,
  validationName,
  validationAge,
  validationTalk,
  validationWatchedAt,
  validationRate, async (req, res) => {
    const promise = await fs.readFile(talkerJson, 'utf-8');
  const talkersArray = JSON.parse(promise);
  // Obtendo o ID do novo talker
  const newId = talkersArray.length + 1;
  const { name, age, talk } = req.body;
  // Criando o novo talker
  const newTalker = {
    id: newId,
    name,
    age,
    talk,
  };
  talkersArray.push(newTalker);
  // Transformando o novo array pra string para escrevê-lo novamente em JSON
  const stringifyNewArray = JSON.stringify(talkersArray);
  await fs.writeFile(talkerJson, stringifyNewArray);
  return res.status(201).json(newTalker);
  });

  app.put('/talker/:id',
  validationToken,
  validationName,
  validationAge,
  validationTalk,
  validationWatchedAt,
  validationRate, async (req, res) => {
    const promise = await fs.readFile(talkerJson, 'utf-8');
  const talkersArray = JSON.parse(promise);
  const { name, age, talk } = req.body;
  const { rate, watchedAt } = talk;
  const { id } = req.params;
  const editedTalker = {
    id: Number(id),
    name,
    age: Number(age),
    talk: {
      rate: Number(rate),
      watchedAt,
    },
  };
  talkersArray[id] = editedTalker;
  const stringifyNewArray = JSON.stringify(talkersArray);
  await fs.writeFile(talkerJson, stringifyNewArray);
  return res.status(200).json(editedTalker);
  });

  app.delete('/talker/:id',
  validationToken, async (req, res) => {
    const { id } = req.params;
    const promise = await fs.readFile(talkerJson, 'utf-8');
    const talkersArray = JSON.parse(promise);
    const filteredArray = talkersArray.filter((talker) => Number(talker.id) !== Number(id));
    await fs.writeFile(talkerJson, JSON.stringify(filteredArray));
    return res.status(204).json();
  });

app.listen(PORT, () => {
  console.log('Online');
});