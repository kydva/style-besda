import app from '../src/app';
import request from 'supertest';
import { User } from '../src/models/User';
import mongoose from 'mongoose';
import redis from '../src/utils/redis';
import { PieceCategory } from '../src/models/PieceCategory';
import { Piece } from '../src/models/Piece';
import supertest from 'supertest';


afterAll(async () => {
    await mongoose.connection.close();
    await redis.quit();
});

afterEach(async () => {
    await User.deleteMany();
    await PieceCategory.deleteMany();
    await Piece.deleteMany();
});


describe('User login', () => {
    it('Should return 200 when input data are valid', async () => {
        const userData = { name: 'testUser', password: '123456' };
        await (new User(userData)).save();

        await request(app)
            .post('/login')
            .send(userData)
            .expect(200);
    });

    it('Should return 401 when input data are invalid', async () => {
        await request(app)
            .post('/login')
            .send({ name: 'invalid', password: '123' })
            .expect(401);
    });
});

describe('User registration', () => {
    it('Should return 201 and create user when input data are valid', async () => {
        await request(app)
            .post('/register')
            .send({ name: 'newUser1337', password: '123456789', passwordConfirm: '123456789' })
            .expect(201);

        const user = await User.find({ name: 'newUser1337' });
        expect(user).not.toBeNull();
    });

    it('Should return 400 and error messages when input data are invalid', async () => {
        await request(app)
            .post('/register')
            .send({ name: 'aq', password: '12', passwordConfirm: '12' })
            .expect(400, {
                errors: {
                    name: 'Username must be between 4 and 22 characters',
                    password: 'Password must be between 6 and 60 characters'
                }
            });
    });
});

describe('Wardrobe', () => {
    test('PUT /users/me/wardrobe/:piece', async () => {
        const userData = { name: 'userrr', password: '123456' };
        await (new User(userData)).save();
        const agent = supertest.agent(app);
        await agent.post('/login').send(userData);

        const category = await (new PieceCategory({ name: 'T-Shirts', gender: 'M' })).save();
        const piece = await (new Piece({ name: 'White t-shirt', gender: 'M', category: category._id, img: 'img.jpg' })).save();
        agent.put(`/users/me/wardrobe/${piece._id}`).expect(204);
        agent.put(`/users/me/wardrobe/${piece._id}`).expect(204);
        agent.get('/users/me').expect(200).expect((res) => {
            expect(res.body.user.wardrobe).toEqual([piece._id]);
        });
    });

    test('DELETE /users/me/wardrobe/:piece', async () => {
        const userData = { name: 'userrr', password: '123456' };
        await (new User(userData)).save();
        const agent = supertest.agent(app);
        await agent.post('/login').send(userData);

        const category = await (new PieceCategory({ name: 'T-Shirts', gender: 'M' })).save();
        const piece = await (new Piece({ name: 'White t-shirt', gender: 'M', category: category._id, img: 'img.jpg' })).save();
        agent.put(`/users/me/wardrobe/${piece._id}`).expect(204);
        agent.delete(`/users/me/wardrobe/${piece._id}`).expect(204);
        agent.delete(`/users/me/wardrobe/${piece._id}`).expect(204);
        agent.get('/users/me').expect(200).expect((res) => {
            expect(res.body.user.wardrobe).toEqual([]);
        });
    });
});