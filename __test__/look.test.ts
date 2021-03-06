import mongoose from 'mongoose';
import supertest from 'supertest';
import redis from '../src/utils/redis';
import app from '../src/app';
import { Piece } from '../src/models/Piece';
import { User } from '../src/models/User';
import { PieceCategory } from '../src/models/PieceCategory';
import { Look } from '../src/models/Look';

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

beforeEach(async () => {
    const user = new User({ name: 'user', password: '123456789', gender: 'M' });
    await user.save();
});

afterAll(async () => {
    await mongoose.connection.close();
    redis.quit();
});

afterEach(async () => {
    await User.deleteMany();
    await Piece.deleteMany();
    await PieceCategory.deleteMany();
    await Look.deleteMany();
});

describe('POST /looks', () => {
    it('Shouldn\'t pass non-authenticated users', async () => {
        await supertest(app).post('/looks').expect(401);
    });

    it('Should create look when input data are valid', async () => {
        const category = await (new PieceCategory({ name: 'test category', gender: 'M' })).save();
        const whiteShirt = await (new Piece({ name: 'White shirt', gender: 'M', img: 'img.jpg', category: category._id })).save();
        const yellowPants = await (new Piece({ name: 'Yellow pants', gender: 'M', img: 'img.jpg', category: category._id })).save();

        const agent = await getUserAgent();
        await agent.post('/looks').send({
            pieces: `${whiteShirt._id},${yellowPants._id}`,
            season: 'Summer',
            gender: 'M',
        }).expect(201);

        const look = await Look.findOne();
        expect(look).toHaveProperty('pieces');
        expect(look).toHaveProperty('season');
        expect(look).toHaveProperty('gender');
        expect(look).toHaveProperty('img');
        expect(look).toHaveProperty('author');
    });

    it('Should return 400 status and error when input data are invalid', async () => {
        const agent = await getUserAgent();
        await agent.post('/looks').send({
            pieces: '',
            season: '',
            gender: 'Apache attack helicopter',
        }).expect(400).expect((res) => {
            expect(res.body.errors).toHaveProperty('gender');
            expect(res.body.errors).toHaveProperty('season');
            expect(res.body.errors).toHaveProperty('pieces');
        });
    });
});

describe('GET /looks', () => {
    it('Shouldn\'t pass non-authenticated users', async () => {
        await supertest(app).get('/looks').expect(401);
    });

    it('Should return only relevant looks in order relevant to user wardrobe', async () => {
        const category = await (new PieceCategory({ name: 'test category', gender: 'M' })).save();
        const whiteShirt = await (new Piece({ name: 'White shirt', gender: 'M', img: 'img.jpg', category: category._id })).save();
        const blackShirt = await (new Piece({ name: 'Black shirt', gender: 'M', img: 'img.jpg', category: category._id })).save();
        const yellowPants = await (new Piece({ name: 'Yellow pants', gender: 'M', img: 'img.jpg', category: category._id })).save();
        const blueJeans = await (new Piece({ name: 'Blue jeans', gender: 'M', img: 'img.jpg', category: category._id })).save();
        const blackFedora = await (new Piece({ name: 'Black fedora', gender: 'M', img: 'img.jpg', category: category._id })).save();
        const whiteSneakers = await (new Piece({ name: 'White sneakers', gender: 'M', img: 'img.jpg', category: category._id })).save();

        const user = await User.findOne();
        user.wardrobe = [whiteShirt._id, blueJeans._id, whiteSneakers._id];
        await user.save();

        const agent = await getUserAgent();
        const look1 = await (new Look({ pieces: [blackShirt._id, blueJeans._id, whiteSneakers._id], season: 'Summer', gender: 'M', img: 'img.jpg', author: user._id })).save();
        const look0 = await (new Look({ pieces: [whiteShirt._id, blueJeans._id, whiteSneakers._id], season: 'Summer', gender: 'M', img: 'img.jpg', author: user._id })).save();
        const look3 = await (new Look({ pieces: [blackShirt._id, yellowPants._id, blackFedora._id, whiteSneakers._id], season: 'Summer', gender: 'M', img: 'img.jpg', author: user._id })).save();
        const look2 = await (new Look({ pieces: [blackShirt._id, yellowPants._id, whiteSneakers._id], season: 'Summer', gender: 'M', img: 'img.jpg', author: user._id })).save();


        //These looks shouldn't be selected 
        await (new Look({ pieces: [blackShirt._id, yellowPants._id], season: 'Summer', gender: 'M', img: 'img.jpg', author: user._id })).save(),
        await (new Look({ pieces: [whiteShirt._id, blueJeans._id], season: 'Summer', gender: 'F', img: 'img.jpg', author: user._id })).save();
        //This look should be selected only if 'showDisliked' query param is true
        const hidden = await (new Look({ pieces: [whiteShirt._id, blueJeans._id], season: 'Summer', gender: 'M', img: 'img.jpg', author: user._id })).save();
        //This look should be selected only if favorites" query param is true
        const favorited = await (new Look({ pieces: [blackShirt._id, blueJeans._id], season: 'Summer', gender: 'M', img: 'img.jpg', author: user._id })).save();

        user.hideLook(hidden._id);
        user.addToFavorites(favorited._id);
        await user.save();

        await agent.get('/looks?limit=2&skip=0').expect(200).expect((res) => {
            const looks = res.body.looks;
            expect(looks).toHaveLength(2);
            expect(looks[0]._id).toEqual(look0._id.toString());
            expect(looks[1]._id).toEqual(look1._id.toString());
            expect(res.body.totalResults).toEqual(4);
        });

        await agent.get('/looks?limit=2&skip=2').expect(200).expect((res) => {
            const looks = res.body.looks;
            expect(looks).toHaveLength(2);
            expect(looks[0]._id).toEqual(look2._id.toString());
            expect(looks[1]._id).toEqual(look3._id.toString());
        });

        await agent.get('/looks?favorites=true').expect(200).expect((res) => {
            const looks = res.body.looks;
            expect(looks).toHaveLength(1);
        });

        await agent.get('/looks?showDisliked=true').expect(200).expect((res) => {
            expect(res.body.looks).toHaveLength(5);
        });
    });
});

describe('GET /looks/:id', () => {
    it('Should return look', async () => {
        const category = await (new PieceCategory({ name: 'test category', gender: 'M' })).save();
        const whiteShirt = await (new Piece({ name: 'White shirt', gender: 'M', img: 'img.jpg', category: category._id })).save();
        const yellowPants = await (new Piece({ name: 'Yellow pants', gender: 'M', img: 'img.jpg', category: category._id })).save();

        const agent = await getUserAgent();
        await agent.post('/looks').send({
            pieces: `${whiteShirt._id},${yellowPants._id}`,
            season: 'Summer',
            gender: 'M',
        }).expect(201);

        const look = await Look.findOne();

        //Add look to favorites
        await agent.put('/users/me/favorites/' + look._id).expect(204);
        //Add piece to wardrobe
        await agent.put('/users/me/wardrobe/' + whiteShirt._id).expect(204);

        await agent.get('/looks/' + look._id).expect(200).expect((res) => {
            const look = res.body.look;
            expect(look.isLiked).toEqual(true);
            expect(look.isDisliked).toEqual(false);
            expect(look.pieces[0].name).toEqual('White shirt');
            expect(look.pieces[0].inWardrobe).toEqual(true);
            expect(look.pieces[1].inWardrobe).toEqual(false);
        });
    });
});

describe('DELETE /looks/:id', () => {
    it('Should delete look and all refs to it', async () => {
        const category = await (new PieceCategory({ name: 'test category', gender: 'M' })).save();
        const whiteShirt = await (new Piece({ name: 'White shirt', gender: 'M', img: 'img.jpg', category: category._id })).save();
        const yellowPants = await (new Piece({ name: 'Yellow pants', gender: 'M', img: 'img.jpg', category: category._id })).save();

        const agent = await getUserAgent();
        await agent.post('/looks').send({
            pieces: `${whiteShirt._id},${yellowPants._id}`,
            season: 'Summer',
            gender: 'M',
        }).expect(201);

        const look = await Look.findOne();

        //Add look to favorites
        await agent.put('/users/me/favorites/' + look._id).expect(204);
        //Delete look
        await agent.delete('/looks/' + look._id).expect(204);
        //Expect the look to be deleted
        await agent.get('/looks/' + look._id).expect(404);
        //Expect the user favorites are empty ( used setTimeout because look references are removed asynchronously )
        setTimeout(async () => {
            const user = await User.findOne();
            expect(user.favorites).toHaveLength(0);
        }, 1000);
    });
});

async function getUserAgent() {
    const agent = supertest.agent(app);
    await agent.post('/login').send({ name: 'user', password: '123456789' });
    return agent;
}
