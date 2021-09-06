import mongoose from 'mongoose';
import supertest from 'supertest';
import redis from '../src/utils/redis';
import app from '../src/app';
import { Piece } from '../src/models/Piece';
import { User } from '../src/models/User';
import { PieceCategory } from '../src/models/PieceCategory';

jest.mock('../src/utils/s3');
jest.mock('../src/utils/upload', () => {
    return {
        single: jest.fn().mockImplementation(() => {
            return (req: any, res: any, next: any) => {
                req.file = {
                    originalname: 'fake.jpg',
                    mimetype: 'image/jpeg',
                    filename: 'fake.jpg',
                    path: 'tmp/fake.jpg',
                };
                return next();
            };
        })
    };
});

beforeAll(async () => {
    const admin = new User({ name: 'admin', password: '123456789', gender: 'M', roles: ['admin'] });
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
        const notAdmin = new User({ name: 'notAdmin', gender: 'M', password: '123456789' });
        await notAdmin.save();
        await agent.post('/login').send({ name: 'notAdmin', password: '123456789' }).expect(200);
        await agent.post('/pieces').send().expect(403);
    });

    it('Should create piece when input data are valid', async () => {
        const agent = await getAdminAgent();
        const category = await (new PieceCategory({ name: 'T-Shirts', gender: 'M' })).save();
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
    it('Shouldn\'t pass non-authenticated users', async () => {
        await supertest(app).get('/pieces').expect(401);
    });

    it('Should return pieces', async () => {
        const category = await (new PieceCategory({ name: 'T-Shirts', gender: 'M' })).save();
        const agent = await getAdminAgent();
        await Piece.insertMany([
            { name: 'White t-shirt', gender: 'M', category: category._id, img: 'img.jpg' },
            { name: 'Black t-shirt', gender: 'M', category: category._id, img: 'img.jpg' },
            { name: 'Orange t-shirt', gender: 'M', category: category._id, img: 'img.jpg' },
            { name: 'Yellow t-shirt', gender: 'M', category: category._id, img: 'img.jpg' },
            { name: 'Women t-shirt', gender: 'F', category: category._id, img: 'img.jpg' },
        ]);

        await agent.get('/pieces').expect(200).expect((res) => {
            expect(res.body.pieces).toHaveLength(4); //Women pieces shouldn't be counted
            expect(res.body.pieces[0]).toHaveProperty('_id');
            expect(res.body.pieces[0]).toHaveProperty('name');
            expect(res.body.pieces[0]).toHaveProperty('img');
            expect(res.body.pieces[0]).toHaveProperty('inWardrobe');
        });
    });
});

describe('PATCH /pieces/:piece', () => {
    it('Should update piece correctly', async () => {
        const agent = await getAdminAgent();
        const category = await (new PieceCategory({ name: 'Test category', gender: 'M' })).save();
        const testPiece = await (new Piece({ name: 'Test piece', gender: 'F', category: category._id, img: 'img.jpg' })).save();
        await agent.patch(`/pieces/${testPiece._id}`).send({ gender: 'M' }).expect(204);
        const updatedTestPiece = await Piece.findOne({ _id: testPiece._id, gender: 'M' });
        expect(updatedTestPiece).not.toBeNull();
    });
});

describe('DELETE /pieces/:piece', () => {
    it('Should delete piece correctly', async () => {
        const category = await (new PieceCategory({ name: 'T-Shirts', gender: 'M' })).save();
        const piece = await (new Piece({ name: 'White T-Shirt', gender: 'M', category: category._id, img: 'img.jpg' })).save();
        const agent = await getAdminAgent();
        await agent.delete(`/pieces/${piece._id}`).expect(204);
        expect(await Piece.findOne({ name: 'White T-Shirt', gender: 'M' })).toEqual(null);
    });
});

async function getAdminAgent() {
    const agent = supertest.agent(app);
    await agent.post('/login').send({ name: 'admin', password: '123456789' });
    return agent;
}