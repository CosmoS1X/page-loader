export default class NetworkError extends Error {
  constructor({ code, message }, url) {
    super(`${code}: ${message}, fetch '${url}'`);

    this.name = this.constructor.name;
    this.code = code;
    this.url = url;
  }
}
