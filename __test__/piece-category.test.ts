import mongoose from 'mongoose';
import supertest from 'supertest';
import redis from '../src/utils/redis';
import app from '../src/app';
import { PieceCategory } from '../src/models/PieceCategory';
import { User } from '../src/models/User';

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
    await PieceCategory.deleteMany();
});

describe('POST /piece-categories', () => {
    it('Shouldn\'t pass non-admin users', async () => {
        const agent = supertest.agent(app);
        const notAdmin = new User({ name: 'notAdmin', password: '123456789' });
        await notAdmin.save();
        await agent.post('/login').send({ name: 'notAdmin', password: '123456789' }).expect(200);
        await agent.post('/piece-categories').send({ name: 'Shirts', gender: 'M' }).expect(403);
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
            const expected = {
                categories: [
                    {
                        _id: shirts._id, gender: 'M', name: shirts.name, parent: shirts.parent, children: [
                            {
                                _id: shortSleeveShirts._id, gender: 'M', name: shortSleeveShirts.name, parent: shortSleeveShirts.parent, children: [
                                    { _id: hawaiianShirts._id, gender: 'M', name: hawaiianShirts.name, parent: hawaiianShirts.parent, children: hawaiianShirts.children }
                                ]
                            },
                            {
                                _id: grandadCollarShirts._id, gender: 'M', name: grandadCollarShirts.name, parent: grandadCollarShirts.parent, children: grandadCollarShirts.children
                            }
                        ]
                    }
                ]
            };
            expect(JSON.parse(JSON.stringify(res.body))).toEqual(JSON.parse(JSON.stringify(expected)));
        });
    });
});

describe('PATCH /piece-categories/:category', () => {
    it('Should update category correctly', async () => {
        const agent = await getAdminAgent();
        const testCategory = await (new PieceCategory({ name: 'Test category', gender: 'M' })).save();
        await agent.patch(`/piece-categories/${testCategory._id}`).send({ name: 'New name' }).expect(204);
        const testCategoryWithNewName = await PieceCategory.findOne({ name: 'New name', _id: testCategory._id });
        expect(testCategoryWithNewName).not.toBeNull();
    });
});

describe('DELETE /piece-categories/:category', () => {
    it('Should delete category correctly', async () => {
        await addCategories();
        const agent = await getAdminAgent();
        const shortSleeveShirts = await PieceCategory.findOne({ name: 'Short sleeve shirts' });
        await agent.delete(`/piece-categories/${shortSleeveShirts._id}`).expect(204);
        const shirts = await PieceCategory.findOne({ name: 'Shirts' });
        expect(shirts.children).not.toContain(shortSleeveShirts._id);
        expect(await PieceCategory.findOne({ name: 'Short sleeve shirts' })).toEqual(null);
        expect(await PieceCategory.findOne({ name: 'Hawaiian shirts' })).toEqual(null);
    });
});


async function addCategories() {
    const agent = await getAdminAgent();
    await agent.post('/piece-categories').send({ name: 'Shirts', gender: 'M' }).expect(201);
    const shirts = await PieceCategory.findOne({ name: 'Shirts' });
    await agent.post('/piece-categories').send({ name: 'Short sleeve shirts', gender: 'M', parent: shirts._id });
    await agent.post('/piece-categories').send({ name: 'Grandad collar shirts', gender: 'M', parent: shirts._id });
    const shortSleeveShirts = await PieceCategory.findOne({ name: 'Short sleeve shirts' });
    await agent.post('/piece-categories').send({ name: 'Hawaiian shirts', gender: 'M', parent: shortSleeveShirts._id });
}

async function getAdminAgent() {
    const agent = supertest.agent(app);
    await agent.post('/login').send({ name: 'admin', password: '123456789' });
    return agent;
}