import { getCollection, getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export class MongoDBService {
  // Users collection operations
  static async createUser(userData) {
    const users = await getCollection('users');
    const result = await users.insertOne({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { ...userData, _id: result.insertedId };
  }

  static async getUserById(id) {
    const users = await getCollection('users');
    return await users.findOne({ _id: new ObjectId(id) });
  }

  static async getUserByEmail(email) {
    const users = await getCollection('users');
    return await users.findOne({ email });
  }

  static async updateUser(id, updateData) {
    const users = await getCollection('users');
    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  // Projects collection operations
  static async createProject(projectData) {
    const projects = await getCollection('projects');
    const result = await projects.insertOne({
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { ...projectData, _id: result.insertedId };
  }

  static async getProjectsByUserId(userId) {
    const projects = await getCollection('projects');
    return await projects.find({ userId }).toArray();
  }

  static async getProjectById(id) {
    const projects = await getCollection('projects');
    return await projects.findOne({ _id: new ObjectId(id) });
  }

  static async updateProject(id, updateData) {
    const projects = await getCollection('projects');
    const result = await projects.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  static async deleteProject(id) {
    const projects = await getCollection('projects');
    const result = await projects.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Website analyses collection operations
  static async createAnalysis(analysisData) {
    const analyses = await getCollection('website_analyses');
    const result = await analyses.insertOne({
      ...analysisData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { ...analysisData, _id: result.insertedId };
  }

  static async getAnalysesByProjectId(projectId) {
    const analyses = await getCollection('website_analyses');
    return await analyses.find({ projectId }).sort({ createdAt: -1 }).toArray();
  }

  static async getAnalysisById(id) {
    const analyses = await getCollection('website_analyses');
    return await analyses.findOne({ _id: new ObjectId(id) });
  }

  // Teams collection operations
  static async createTeam(teamData) {
    const teams = await getCollection('teams');
    const result = await teams.insertOne({
      ...teamData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { ...teamData, _id: result.insertedId };
  }

  static async getTeamsByUserId(userId) {
    const teams = await getCollection('teams');
    return await teams.find({ 
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ]
    }).toArray();
  }

  // Audit logs
  static async createAuditLog(logData) {
    const auditLogs = await getCollection('audit_logs');
    await auditLogs.insertOne({
      ...logData,
      timestamp: new Date()
    });
  }

  // Generic operations
  static async findDocuments(collectionName, query = {}, options = {}) {
    const collection = await getCollection(collectionName);
    return await collection.find(query, options).toArray();
  }

  static async countDocuments(collectionName, query = {}) {
    const collection = await getCollection(collectionName);
    return await collection.countDocuments(query);
  }

  static async aggregateData(collectionName, pipeline) {
    const collection = await getCollection(collectionName);
    return await collection.aggregate(pipeline).toArray();
  }

  // Database utilities
  static async createIndexes() {
    try {
      const db = await getDatabase();
      
      // Users indexes
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ createdAt: -1 });
      
      // Projects indexes
      await db.collection('projects').createIndex({ userId: 1 });
      await db.collection('projects').createIndex({ createdAt: -1 });
      await db.collection('projects').createIndex({ url: 1 });
      
      // Website analyses indexes
      await db.collection('website_analyses').createIndex({ projectId: 1 });
      await db.collection('website_analyses').createIndex({ createdAt: -1 });
      await db.collection('website_analyses').createIndex({ url: 1 });
      
      // Teams indexes
      await db.collection('teams').createIndex({ ownerId: 1 });
      await db.collection('teams').createIndex({ 'members.userId': 1 });
      
      // Audit logs indexes
      await db.collection('audit_logs').createIndex({ userId: 1 });
      await db.collection('audit_logs').createIndex({ timestamp: -1 });
      await db.collection('audit_logs').createIndex({ action: 1 });
      
      console.log('✅ MongoDB indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating MongoDB indexes:', error);
      throw error;
    }
  }
}