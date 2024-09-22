export default class FileSystemError extends Error {
  constructor(error) {
    const {
      message,
      errno,
      code,
      syscall,
      path,
    } = error;

    super(message);

    this.name = this.constructor.name;
    this.errno = errno;
    this.code = code;
    this.syscall = syscall;
    this.path = path;
  }
}
