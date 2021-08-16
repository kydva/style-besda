import mongoose from 'mongoose';
import redis from '../src/redis';
import supertest from 'supertest';
import app from '../src/app';
import { PieceCategory } from '../src/models/PieceCategory';
import { User } from '../src/models/User';

afterAll(async () => {
    await mongoose.connection.close();
    await redis.quit();
});

afterEach(async () => {
    await PieceCategory.deleteMany();
    await User.deleteMany();
});

describe('POST /piece-categories', () => {
    it('Shouldn\'t pass non-admin users', async () => {
        const agent = supertest.agent(app);
        const notAdmin = new User({ name: 'notAdmin', password: '123456789' });
        await notAdmin.save();
        await agent.post('/login').send({ name: 'notAdmin', password: '123456789' }).expect(200);
        await agent.post('/piece-categories').send({ name: 'Shirts' }).expect(403);
    });

    it('Should build categories relationships corrrectly', async () => {
        await addCategories();
        const shirts = await PieceCategory.findOne({ name: 'Shirts' });
        const shortSleeveShirts = await PieceCategory.findOne({ name: 'Short sleeve shirts' });
        const grandadCollarShirts = await PieceCategory.findOne({ name: 'Grandad collar shirts' });
        expect(JSON.stringify(shirts.children)).toEqual(JSON.stringify([shortSleeveShirts._id, grandadCollarShirts._id]));
    });
});

describe('GET /piece-categories', () => {
    it('Should return categories tree', async () => {
        await addCategories();
        const shirts = await PieceCategory.findOne({ name: 'Shirts' });
        const shortSleeveShirts = await PieceCategory.findOne({ name: 'Short sleeve shirts' });
        const grandadCollarShirts = await PieceCategory.findOne({ name: 'Grandad collar shirts' });
        const hawaiianShirts = await PieceCategory.findOne({ name: 'Hawaiian shirts' });

        await supertest(app).get('/piece-categories').expect(200).expect(async (res) => {
            const expected = [
                {
                    _id: shirts._id, name: shirts.name, parent: shirts.parent, children: [
                        {
                            _id: shortSleeveShirts._id, name: shortSleeveShirts.name, parent: shortSleeveShirts.parent, children: [
                                { _id: hawaiianShirts._id, name: hawaiianShirts.name, parent: hawaiianShirts.parent, children: hawaiianShirts.children }
                            ]
                        },
                        {
                            _id: grandadCollarShirts._id, name: grandadCollarShirts.name, parent: grandadCollarShirts.parent, children: grandadCollarShirts.children
                        }
                    ]
                }
            ];
            expect(JSON.parse(JSON.stringify(res.body))).toIncludeSameMembers(JSON.parse(JSON.stringify(expected)));
        });
    });
});




async function addCategories() {
    const agent = supertest.agent(app);
    const admin = new User({ name: 'admin', password: '123456789', roles: ['admin'] });
    await admin.save();
    await agent.post('/login').send({ name: 'admin', password: '123456789' }).expect(200);
    await agent.post('/piece-categories').send({ name: 'Shirts' }).expect(201);
    const shirts = await PieceCategory.findOne({ name: 'Shirts' });
    await agent.post('/piece-categories').send({ name: 'Short sleeve shirts', parent: shirts._id });
    await agent.post('/piece-categories').send({ name: 'Grandad collar shirts', parent: shirts._id });
    const shortSleeveShirts = await PieceCategory.findOne({ name: 'Short sleeve shirts' });
    await agent.post('/piece-categories').send({ name: 'Hawaiian shirts', parent: shortSleeveShirts._id });
}