/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['./config/jest.setup.ts'],
    setupFilesAfterEnv: ['jest-extended']
};