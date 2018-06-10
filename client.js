let client = module.exports = class {
  constructor(connection) {
    this.connection = connection;
  }

  on(name, funct) {
    this.connection.on(name, funct);
  }
};
