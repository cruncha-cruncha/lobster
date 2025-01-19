export class ApiError extends Error {
  constructor(obj, options) {
    this.status = obj.status || 500;
    this.errCode = obj.errCode || "ERR_UNKNOWN";
    this.details = obj.details || "Unknown error";
    super(obj.details || "Unknown error", options);
  }
}
