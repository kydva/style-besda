import mongoose from 'mongoose';
import redis from '../src/redis';
import supertest from 'supertest';
import app from '../src/app';
import { PieceCategory } from '../src/models/PieceCategory';
import { User } from '../src/models/User';

describe('Creating piece categories', () => {
    afterAll(async () => {
        await mongoose.connection.close();
        await redis.quit();
    });

    afterEach(async () => {
        await PieceCategory.deleteMany();
        await User.deleteMany();
    });

    it('Shouldn\'t pass non-admin users', async () => {
        const agent = supertest.agent(app);
        const notAdmin = new User({ name: 'notAdmin', password: '123456789' });
        await notAdmin.save();
        await agent.post('/login').send({ name: 'notAdmin', password: '123456789' }).expect(200);
        await agent.post('/piece-categories').send({ name: 'Shirts' }).expect(403);
    });

    it('Should corrrectly build categories', async () => {
        const agent = supertest.agent(app);
        const admin = new User({ name: 'admin', password: '123456789', roles: ['admin'] });
        await admin.save();
        await agent.post('/login').send({ name: 'admin', password: '123456789' }).expect(200);
        await agent.post('/piece-categories').send({ name: 'Shirts' }).expect(201);
        let shirts = await PieceCategory.findOne({ name: 'Shirts' });
        await agent.post('/piece-categories').send({ name: 'Short sleeve shirts', parent: shirts._id });
        await agent.post('/piece-categories').send({ name: 'Grandad collar shirts', parent: shirts._id });
        const shortSleeveShirts = await PieceCategory.findOne({ name: 'Short sleeve shirts' });
        const grandadCollarShirts = await PieceCategory.findOne({ name: 'Grandad collar shirts' });
        await agent.post('/piece-categories').send({ name: 'Hawaiian shirts', parent: shortSleeveShirts._id });

        shirts = await PieceCategory.findById(shirts._id); //Reload shirts category
        expect(JSON.stringify(shirts.children)).toEqual(JSON.stringify([shortSleeveShirts._id, grandadCollarShirts._id]));
    });




});