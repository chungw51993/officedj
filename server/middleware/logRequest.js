import Logger from '../util/logger';

const logRequest = (req, res, next) => {
  const {
    method,
    url,
    body,
  } = req;
  const logger = Logger.getLogger('request');
  let log = `${url} - ${method}`;
  if (method === 'POST' || method === 'PUT') {
    log += `\n[PAYLOAD]: ${JSON.stringify(body)}`;
  }
  logger.debug(log);
  next();
};

export default logRequest;
