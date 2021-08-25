import mongoose from 'mongoose';
import redis from '../src/redis';
import supertest from 'supertest';
import app from '../src/app';
import { Piece } from '../src/models/Piece';
import { User } from '../src/models/User';
import { PieceCategory } from '../src/models/PieceCategory';

beforeAll(async () => {
    const admin = new User({ name: 'admin', password: '123456789', roles: ['admin'] });
    await admin.save();
});

afterAll(async () => {
    await User.deleteMany();
    await mongoose.connection.close();
    redis.quit();
});

afterEach(async () => {
    await Piece.deleteMany();
    await PieceCategory.deleteMany();
});

describe('POST /pieces', () => {
    it('Shouldn\'t pass non-admin users', async () => {
        const agent = supertest.agent(app);
        const notAdmin = new User({ name: 'notAdmin', password: '123456789' });
        await notAdmin.save();
        await agent.post('/login').send({ name: 'notAdmin', password: '123456789' }).expect(200);
        await agent.post('/pieces').send().expect(403);
    });

    it('Should create piece when input data are valid', async () => {
        const agent = await getAdminAgent();
        const category = await (new PieceCategory({ name: 'T-Shirts' })).save();
        await agent.post('/pieces').send({ name: 'White t-shirt', gender: 'M', category: category._id }).expect(201);
        const piece = await Piece.find({ name: 'White t-shirt' });
        expect(piece).not.toBeNull();
    });

    it('Should return 400 status and error when input data are invalid', async () => {
        const agent = await getAdminAgent();
        await agent.post('/pieces').send({ name: 'White t-shirt', gender: 'Apache Attack Helicopter', category: 'invalid' })
            .expect(400)
            .expect((res) => {
                expect(res.body.errors).toHaveProperty('gender');
                expect(res.body.errors).toHaveProperty('category');
            });
    });
});

describe('GET /pieces', () => {
    it('Should return pieces', async () => {
        const category = await (new PieceCategory({ name: 'T-Shirts' })).save();

        await Piece.insertMany([
            { name: 'White t-shirt', gender: 'M', category: category._id },
            { name: 'Black t-shirt', gender: 'M', category: category._id },
            { name: 'Orange t-shirt', gender: 'M', category: category._id },
            { name: 'Yellow t-shirt', gender: 'M', category: category._id }
        ]);

        await supertest(app).get('/pieces').expect(200).expect((res) => {
            expect(res.body.pieces).toHaveLength(4);
        });
    });
});

describe('PATCH /pieces/:piece', () => {
    it('Should update piece correctly', async () => {
        const agent = await getAdminAgent();
        const category = await (new PieceCategory({ name: 'Test category' })).save();
        const testPiece = await (new Piece({ name: 'Test piece', gender: 'F', category: category._id })).save();
        await agent.patch(`/pieces/${testPiece._id}`).send({ gender: 'M' }).expect(204);
        const updatedTestPiece = await Piece.findOne({ _id: testPiece._id, gender: 'M' });
        expect(updatedTestPiece).not.toBeNull();
    });
});

describe('DELETE /pieces/:piece', () => {
    it('Should delete piece correctly', async () => {
        const category = await (new PieceCategory({ name: 'T-Shirts' })).save();
        const piece = await (new Piece({ name: 'White T-Shirt', category: category._id })).save();
        const agent = await getAdminAgent();
        await agent.delete(`/pieces/${piece._id}`).expect(204);

        expect(await Piece.findOne({ name: 'White T-Shirt' })).toEqual(null);
    });
});


async function getAdminAgent() {
    const agent = supertest.agent(app);
    await agent.post('/login').send({ name: 'admin', password: '123456789' });
    return agent;
}