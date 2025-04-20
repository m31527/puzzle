import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(false);  // 關閉調試模式以提高性能
SQLite.enablePromise(true);

export default class Database {
  static db = null;

  static async initDB() {
    if (this.db) {
      return this.db;
    }

    try {
      this.db = await SQLite.openDatabase({
        name: 'throwp.db',
        location: 'default',
        androidDatabaseProvider: 'system'
      });

      await this.createTables();
      await this.migrateDB(); // Call the migration function after creating tables
      return this.db;
    } catch (error) {
      console.error('Error initializing database:', error);
      return null;  // 返回 null 而不是拋出錯誤
    }
  }

  static async createTables() {
    if (!this.db) {
      return;
    }

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS game_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accuracy INTEGER,
        attentionAvg INTEGER,
        brainPower INTEGER,
        endurance INTEGER,
        meditationAvg INTEGER,
        score INTEGER,
        stability INTEGER,
        successCount INTEGER,
        superPower INTEGER,
        throwCount INTEGER,
        userName TEXT,
        timestamp TEXT,
        completionTime TEXT
      );
    `;

    try {
      await this.db.executeSql(createTableQuery);
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  static async migrateDB() {
    if (!this.db) {
      await this.initDB();
    }

    try {
      const columnCheckQuery = "PRAGMA table_info(game_records);";
      const [result] = await this.db.executeSql(columnCheckQuery);
      const columns = result.rows.raw();
      const columnExists = columns.some(column => column.name === 'completionTime');

      if (!columnExists) {
        const alterTableQuery = "ALTER TABLE game_records ADD COLUMN completionTime TEXT;";
        await this.db.executeSql(alterTableQuery);
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }
  }

  static async saveGameRecord(gameRecord) {
    if (!this.db) {
      await this.initDB();
    }

    const insertQuery = `
      INSERT INTO game_records (
        accuracy,
        attentionAvg,
        brainPower,
        endurance,
        meditationAvg,
        score,
        stability,
        successCount,
        superPower,
        throwCount,
        userName,
        timestamp,
        completionTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      gameRecord.accuracy || 0,
      gameRecord.attentionAvg || 0,
      gameRecord.brainPower || 0,
      gameRecord.endurance || 0,
      gameRecord.meditationAvg || 0,
      gameRecord.score || 0,
      gameRecord.stability || 0,
      gameRecord.successCount || 0,
      gameRecord.superPower || 0,
      gameRecord.throwCount || 0,
      gameRecord.userName || 'Anonymous',
      gameRecord.timestamp,
      gameRecord.completionTime
    ];

    try {
      await this.db.executeSql(insertQuery, values);
      return true;
    } catch (error) {
      console.error('Error saving game record:', error);
      return false;
    }
  }

  static async getAllGameRecords() {
    if (!this.db) {
      await this.initDB();
    }

    try {
      const [results] = await this.db.executeSql(
        'SELECT * FROM game_records ORDER BY timestamp DESC;'
      );
      
      const records = [];
      for (let i = 0; i < results.rows.length; i++) {
        records.push(results.rows.item(i));
      }
      
      return records;
    } catch (error) {
      console.error('Error getting game records:', error);
      return [];
    }
  }

  static async deleteGameRecord(timestamp) {
    if (!this.db) {
      await this.initDB();
    }

    try {
      await this.db.executeSql(
        'DELETE FROM game_records WHERE timestamp = ?;',
        [timestamp]
      );
      return true;
    } catch (error) {
      console.error('Error deleting game record:', error);
      return false;
    }
  }
}
