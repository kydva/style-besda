import app from '../src/app';
import request from 'supertest';
import { User } from '../src/models/User';
import mongoose from 'mongoose';
import redis from '../src/redis';


afterAll(async () => {
    await mongoose.connection.close();
    await redis.quit();
});

afterEach(async () => {
    await User.deleteMany();
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
            .post('/registration')
            .send({ name: 'newUser1337', password: '123456789', passwordConfirm: '123456789' })
            .expect(201);

        const user = await User.find({ name: 'newUser1337' });
        expect(user).not.toBeNull();
    });

    it('Should return 400 and error messages when input data are invalid', async () => {
        await request(app)
            .post('/registration')
            .send({ name: 'aq', password: '12', passwordConfirm: '12' })
            .expect(400)
            .expect({
                errors: {
                    name: 'Username must be between 4 and 22 characters',
                    password: 'Password must be between 6 and 60 characters'
                }
            });
    });
});